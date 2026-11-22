import { soundEngine } from './audio';
import { drawAnansiAfterImages, drawAnansiCharacter, drawEnemyCharacter } from './characterRenderer';
import { createChapters } from './levels';
import {
  AfterImage,
  ChapterData,
  Enemy,
  Firefly,
  FloatingCallout,
  GamePhase,
  HudSnapshot,
  Particle,
  Platform,
  PlayerState,
  SilkProjectile,
} from './types';
import {
  drawCollectibles,
  drawGrappleAnchors,
  drawLanternsAndGoal,
  drawParticlesAndCallouts,
  drawPlatforms,
  drawSilkLinesAndProjectiles,
  drawWorldBackdrop,
} from './worldRenderer';

const LOGICAL_H = 760;
const GRAVITY = 1580;
const MOVE_ACCEL = 2400;
const AIR_ACCEL = 1750;
const MAX_RUN_SPEED = 340;
const JUMP_VEL = -620;
const DOUBLE_JUMP_VEL = -550;
const DASH_SPEED = 690;
const DASH_DURATION = 0.16;

export class AnansiGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHudUpdate: (hud: HudSnapshot) => void;

  private rafId: number | null = null;
  private lastTime = 0;
  private elapsedTime = 0;
  private hitstopTimer = 0;
  private shakeTimer = 0;
  private shakeIntensity = 0;

  private phase: GamePhase = 'TITLE_MENU';
  private chapters: ChapterData[] = [];
  private chapterIndex = 0;
  private chapter!: ChapterData;

  private player!: PlayerState;
  private safeX = 120;
  private safeY = 500;

  private projectiles: SilkProjectile[] = [];
  private particles: Particle[] = [];
  private callouts: FloatingCallout[] = [];
  private afterImages: AfterImage[] = [];
  private fireflies: Firefly[] = [];

  private score = 0;
  private combo = 0;
  private comboTimer = 0;
  private beadsCollected = 0;
  private chapterElapsed = 0;
  private hudSyncAccum = 0;

  private camX = 0;
  private viewW = 1280;
  private viewH = LOGICAL_H;

  // Input state
  private heldKeys = new Set<string>();
  private jumpJustPressed = false;
  private jumpHeld = false;
  private dashJustPressed = false;
  private silkJustPressed = false;
  private aimWorldX: number | null = null;
  private aimWorldY: number | null = null;

  // Touch inputs
  public touchMoveDir: -1 | 0 | 1 = 0;

  constructor(canvas: HTMLCanvasElement, onHudUpdate: (hud: HudSnapshot) => void) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
    this.onHudUpdate = onHudUpdate;

    this.initFireflies();
    this.chapters = createChapters();
    this.loadChapter(0, true);
    this.attachEvents();
    this.handleResize();
  }

  private initFireflies() {
    this.fireflies = [];
    for (let i = 0; i < 36; i++) {
      this.fireflies.push({
        x: Math.random() * 1600,
        y: 90 + Math.random() * 540,
        phase: Math.random() * Math.PI * 2,
        speedX: (Math.random() - 0.5) * 14,
        speedY: (Math.random() - 0.5) * 8,
        size: 1.6 + Math.random() * 2.2,
      });
    }
  }

  public startLoop() {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.detachEvents();
  }

  public startNewGame() {
    this.chapters = createChapters();
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.beadsCollected = 0;
    this.loadChapter(0, true);
    this.phase = 'CHAPTER_INTRO';
    this.emitHud();
  }

  public beginChapterPlay() {
    this.phase = 'PLAYING';
    this.heldKeys.clear();
    this.emitHud();
  }

  public togglePause() {
    if (this.phase === 'PLAYING') {
      this.phase = 'PAUSED';
      this.heldKeys.clear();
      this.emitHud();
    } else if (this.phase === 'PAUSED') {
      this.phase = 'PLAYING';
      this.emitHud();
    }
  }

  public nextChapter() {
    if (this.chapterIndex + 1 < this.chapters.length) {
      this.loadChapter(this.chapterIndex + 1, false);
      this.phase = 'CHAPTER_INTRO';
      this.emitHud();
    } else {
      this.phase = 'VICTORY';
      this.emitHud();
    }
  }

  public restartChapter() {
    const fresh = createChapters();
    this.chapters[this.chapterIndex] = fresh[this.chapterIndex];
    this.loadChapter(this.chapterIndex, true);
    this.phase = 'PLAYING';
    this.emitHud();
  }

  public returnToTitle() {
    this.chapters = createChapters();
    this.loadChapter(0, true);
    this.phase = 'TITLE_MENU';
    this.emitHud();
  }

  public getPhase(): GamePhase {
    return this.phase;
  }

  public getCurrentIntro() {
    return {
      chapterTitle: this.chapter.title,
      chapterSubtitle: this.chapter.subtitle,
      ...this.chapter.intro,
    };
  }

  // Touch / Virtual controls helpers
  public triggerJump() {
    this.jumpJustPressed = true;
    this.jumpHeld = true;
  }
  public releaseJump() {
    this.jumpHeld = false;
  }
  public triggerDash() {
    this.dashJustPressed = true;
  }
  public triggerSilk() {
    this.aimWorldX = null;
    this.aimWorldY = null;
    this.silkJustPressed = true;
  }

  private loadChapter(index: number, resetHp: boolean) {
    this.chapterIndex = index;
    this.chapter = this.chapters[index];
    this.chapterElapsed = 0;
    this.projectiles = [];
    this.particles = [];
    this.callouts = [];
    this.afterImages = [];

    const prevHp = this.player && !resetHp ? Math.min(5, Math.max(3, this.player.hp + 1)) : 5;
    const sx = this.chapter.spawnX;
    const sy = this.chapter.spawnY;
    this.safeX = sx;
    this.safeY = sy;

    const sash: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 6; i++) {
      sash.push({ x: sx - i * 6, y: sy + 18 });
    }

    this.player = {
      x: sx,
      y: sy,
      vx: 0,
      vy: 0,
      w: 52,
      h: 68,
      facing: 1,
      grounded: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      doubleJumpAvailable: true,
      dashTimer: 0,
      dashCooldown: 0,
      invulnTimer: 0,
      hitFlashTimer: 0,
      hp: prevHp,
      maxHp: 5,
      grappleAnchor: null,
      ropeLength: 0,
      silkCooldown: 0,
      scaleX: 1,
      scaleY: 1,
      stridePhase: 0,
      blinkTimer: 2.2,
      isBlinking: false,
      hatTilt: 0,
      sashPoints: sash,
      expression: 'CLEVER',
      expressionTimer: 0,
    };

    this.camX = 0;
  }

  private handleResize = () => {
    const parent = this.canvas.parentElement;
    const width = parent ? parent.clientWidth : window.innerWidth;
    const height = parent ? parent.clientHeight : window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));

    const aspect = width / Math.max(1, height);
    this.viewH = LOGICAL_H;
    this.viewW = Math.max(760, Math.round(LOGICAL_H * aspect));
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const code = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
    }

    if (code === 'Escape' || code === 'KeyP') {
      if (this.phase === 'PLAYING' || this.phase === 'PAUSED') {
        this.togglePause();
      }
      return;
    }

    if (this.phase !== 'PLAYING') return;

    const wasHeld = this.heldKeys.has(code);
    this.heldKeys.add(code);

    if (!wasHeld) {
      if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
        this.jumpJustPressed = true;
        this.jumpHeld = true;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyK') {
        this.dashJustPressed = true;
      }
      if (code === 'KeyJ' || code === 'KeyE') {
        this.aimWorldX = null;
        this.aimWorldY = null;
        this.silkJustPressed = true;
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
    if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      this.jumpHeld = false;
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.phase !== 'PLAYING') return;
    if (e.button !== 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width);
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height);
    this.aimWorldX = this.camX + nx * this.viewW;
    this.aimWorldY = ny * this.viewH;
    this.silkJustPressed = true;
  };

  private onWindowBlur = () => {
    this.heldKeys.clear();
    this.jumpHeld = false;
    this.touchMoveDir = 0;
  };

  private attachEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
  }

  private detachEvents() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
  }

  private update(dt: number) {
    this.elapsedTime += dt;

    // Gentle firefly drift even on title/intro
    for (const f of this.fireflies) {
      f.x += f.speedX * dt;
      f.y += f.speedY * dt;
    }

    if (this.phase !== 'PLAYING') {
      return;
    }

    // Hitstop freeze-frame for punchy impacts
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateCamera(dt);
      return;
    }

    this.chapterElapsed += dt;

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
    }

    this.updatePlayer(dt);
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateCollectibles();
    this.updateParticlesAndCallouts(dt);
    this.updateCamera(dt);
    this.checkGoalReached();

    // Clear one-frame edge triggers
    this.jumpJustPressed = false;
    this.dashJustPressed = false;
    this.silkJustPressed = false;

    this.hudSyncAccum += dt;
    if (this.hudSyncAccum >= 0.08) {
      this.hudSyncAccum = 0;
      this.emitHud();
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player;

    // Timers
    if (p.coyoteTimer > 0) p.coyoteTimer -= dt;
    if (p.jumpBufferTimer > 0) p.jumpBufferTimer -= dt;
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (p.invulnTimer > 0) p.invulnTimer -= dt;
    if (p.hitFlashTimer > 0) p.hitFlashTimer -= dt;
    if (p.silkCooldown > 0) p.silkCooldown -= dt;
    if (p.expressionTimer > 0) {
      p.expressionTimer -= dt;
      if (p.expressionTimer <= 0) p.expression = 'CLEVER';
    }

    // Blinking animation
    p.blinkTimer -= dt;
    if (p.blinkTimer <= 0) {
      if (!p.isBlinking) {
        p.isBlinking = true;
        p.blinkTimer = 0.11;
      } else {
        p.isBlinking = false;
        p.blinkTimer = 2.4 + Math.random() * 2.5;
      }
    }

    // Smooth squash-and-stretch recovery
    p.scaleX += (1 - p.scaleX) * Math.min(1, dt * 14);
    p.scaleY += (1 - p.scaleY) * Math.min(1, dt * 14);

    // Horizontal input
    let moveDir = 0;
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) moveDir -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) moveDir += 1;
    if (this.touchMoveDir !== 0) moveDir = this.touchMoveDir;

    if (moveDir !== 0 && p.dashTimer <= 0) {
      p.facing = moveDir > 0 ? 1 : -1;
    }

    if (this.jumpJustPressed) {
      p.jumpBufferTimer = 0.12;
    }

    // Silk action (shoot or release grapple)
    if (this.silkJustPressed) {
      if (p.grappleAnchor) {
        this.releaseGrapple(true);
      } else if (p.silkCooldown <= 0) {
        this.castGoldenSilk();
      }
    }

    // Trickster Dash
    if (this.dashJustPressed && p.dashCooldown <= 0 && p.dashTimer <= 0) {
      if (p.grappleAnchor) {
        this.releaseGrapple(false);
      }
      p.dashTimer = DASH_DURATION;
      p.dashCooldown = 0.45;
      p.invulnTimer = Math.max(p.invulnTimer, DASH_DURATION + 0.05);
      p.vx = p.facing * DASH_SPEED;
      p.vy = -40;
      p.scaleX = 1.32;
      p.scaleY = 0.76;
      p.expression = 'GRIN';
      p.expressionTimer = 0.35;
      soundEngine.playDash();
      this.spawnBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, '#F5B731', 10, 180);
    }

    // Active Dash movement
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      this.afterImages.push({
        x: p.x + p.w * 0.5,
        y: p.y + p.h * 0.5,
        facing: p.facing,
        scaleX: p.scaleX,
        scaleY: p.scaleY,
        life: 0.18,
        maxLife: 0.18,
      });
      if (p.dashTimer <= 0) {
        p.vx *= 0.55;
      }
    } else if (p.grappleAnchor) {
      // Pendulum Web-Swing Physics!
      p.vy += GRAVITY * 0.92 * dt;
      if (moveDir !== 0) {
        p.vx += moveDir * 780 * dt;
      }

      const cx = p.x + p.w * 0.5;
      const cy = p.y + p.h * 0.4;
      const dx = cx - p.grappleAnchor.x;
      const dy = cy - p.grappleAnchor.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (dist > p.ropeLength) {
        const nx = dx / dist;
        const ny = dy / dist;
        // Constrain position onto circle radius
        const targetX = p.grappleAnchor.x + nx * p.ropeLength - p.w * 0.5;
        const targetY = p.grappleAnchor.y + ny * p.ropeLength - p.h * 0.4;
        p.x = targetX;
        p.y = targetY;

        // Remove outward radial velocity
        const radialVel = p.vx * nx + p.vy * ny;
        if (radialVel > 0) {
          p.vx -= radialVel * nx;
          p.vy -= radialVel * ny;
        }
      }

      // Jump off swing with momentum boost!
      if (p.jumpBufferTimer > 0) {
        p.jumpBufferTimer = 0;
        this.releaseGrapple(true);
      }
    } else {
      // Standard run & air physics
      const accel = p.grounded ? MOVE_ACCEL : AIR_ACCEL;
      if (moveDir !== 0) {
        p.vx += moveDir * accel * dt;
        if (Math.abs(p.vx) > MAX_RUN_SPEED) {
          p.vx += (moveDir * MAX_RUN_SPEED - p.vx) * Math.min(1, dt * 10);
        }
      } else {
        const friction = p.grounded ? 16 : 5;
        p.vx -= p.vx * Math.min(1, friction * dt);
        if (Math.abs(p.vx) < 6) p.vx = 0;
      }

      // Gravity
      p.vy += GRAVITY * dt;
      if (!this.jumpHeld && p.vy < -220) {
        p.vy += GRAVITY * 0.85 * dt; // Variable jump cut
      }
      p.vy = Math.min(p.vy, 920);

      // Jump execution (ground/coyote or double jump)
      if (p.jumpBufferTimer > 0) {
        if (p.coyoteTimer > 0) {
          p.vy = JUMP_VEL;
          p.grounded = false;
          p.coyoteTimer = 0;
          p.jumpBufferTimer = 0;
          p.scaleX = 0.78;
          p.scaleY = 1.26;
          soundEngine.playJump();
          this.spawnBurst(p.x + p.w * 0.5, p.y + p.h, '#9AE6B4', 6, 95);
        } else if (p.doubleJumpAvailable) {
          p.vy = DOUBLE_JUMP_VEL;
          p.doubleJumpAvailable = false;
          p.jumpBufferTimer = 0;
          p.scaleX = 0.82;
          p.scaleY = 1.22;
          soundEngine.playDoubleJump();
          this.spawnBurst(p.x + p.w * 0.5, p.y + p.h, '#F5B731', 9, 130);
        }
      }
    }

    // Move & Collide Platforms
    const prevY = p.y;
    const prevBottom = prevY + p.h;

    p.x += p.vx * dt;
    if (p.x < 12) {
      p.x = 12;
      p.vx = Math.max(0, p.vx);
    }
    if (p.x + p.w > this.chapter.width - 12) {
      p.x = this.chapter.width - 12 - p.w;
      p.vx = Math.min(0, p.vx);
    }

    // Horizontal solid collisions
    for (const plat of this.chapter.platforms) {
      if (plat.oneWay || plat.kind === 'BOUNCE_DRUM') continue;
      if (this.aabbOverlap(p.x, p.y, p.w, p.h, plat.x, plat.y, plat.w, plat.h)) {
        if (p.vx > 0) {
          p.x = plat.x - p.w;
          p.vx = 0;
        } else if (p.vx < 0) {
          p.x = plat.x + plat.w;
          p.vx = 0;
        }
      }
    }

    p.y += p.vy * dt;
    const wasGrounded = p.grounded;
    p.grounded = false;

    for (const plat of this.chapter.platforms) {
      if (!this.aabbOverlap(p.x, p.y, p.w, p.h, plat.x, plat.y, plat.w, plat.h)) {
        continue;
      }

      if (plat.kind === 'BOUNCE_DRUM') {
        if (p.vy >= 0 && prevBottom <= plat.y + 18) {
          p.y = plat.y - p.h;
          p.vy = plat.bounceVelocity ?? -760;
          p.doubleJumpAvailable = true;
          p.scaleX = 0.74;
          p.scaleY = 1.32;
          p.expression = 'GRIN';
          p.expressionTimer = 0.4;
          soundEngine.playBounceDrum();
          this.spawnBurst(plat.x + plat.w * 0.5, plat.y, '#F5B731', 12, 190);
        }
        continue;
      }

      if (plat.oneWay) {
        if (p.vy >= 0 && prevBottom <= plat.y + 14) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
        }
      } else {
        if (p.vy >= 0 && prevBottom <= plat.y + 18) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
          if (!plat.oneWay && plat.w >= 160) {
            this.safeX = Math.max(plat.x + 24, Math.min(plat.x + plat.w - 60, p.x));
            this.safeY = plat.y - p.h - 4;
          }
        } else if (p.vy < 0 && prevY >= plat.y + plat.h - 18) {
          p.y = plat.y + plat.h;
          p.vy = 0;
        }
      }
    }

    if (p.grounded) {
      p.coyoteTimer = 0.11;
      p.doubleJumpAvailable = true;
      if (!wasGrounded) {
        p.scaleX = 1.22;
        p.scaleY = 0.8;
      }
      if (Math.abs(p.vx) > 22) {
        p.stridePhase += dt * Math.abs(p.vx) * 0.052;
      }
    }

    // Hat tilt & Sash Verlet trailing physics
    const targetHatTilt = Math.max(-0.26, Math.min(0.26, -p.vy * 0.00035 + p.vx * 0.0002));
    p.hatTilt += (targetHatTilt - p.hatTilt) * Math.min(1, dt * 12);

    const anchorX = p.x + p.w * 0.5 - p.facing * 12;
    const anchorY = p.y + 34;
    p.sashPoints[0].x = anchorX;
    p.sashPoints[0].y = anchorY;
    for (let i = 1; i < p.sashPoints.length; i++) {
      const prev = p.sashPoints[i - 1];
      const cur = p.sashPoints[i];
      cur.y += 45 * dt;
      cur.x -= p.facing * 24 * dt;
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const d = Math.hypot(dx, dy) || 1;
      const segLen = 9.5;
      cur.x = prev.x + (dx / d) * segLen;
      cur.y = prev.y + (dy / d) * segLen;
    }

    // Gorge pit safety respawn
    if (p.y > LOGICAL_H + 85) {
      this.damagePlayer(1, 0);
      if (p.hp > 0) {
        p.grappleAnchor = null;
        p.x = this.safeX;
        p.y = this.safeY;
        p.vx = 0;
        p.vy = -180;
        p.invulnTimer = 1.3;
        this.spawnBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, '#F5B731', 14, 170);
      }
    }
  }

  private castGoldenSilk() {
    const p = this.player;
    const ox = p.x + p.w * 0.5;
    const oy = p.y + 24;

    // 1. Check if a Silk Blossom anchor is within effortless grapple range
    let bestAnchor = null;
    let bestScore = Infinity;
    for (const a of this.chapter.anchors) {
      const dx = a.x - ox;
      const dy = a.y - oy;
      const dist = Math.hypot(dx, dy);
      if (dist > 395 || dist < 42) continue;

      if (this.aimWorldX !== null && this.aimWorldY !== null) {
        const aimDist = Math.hypot(a.x - this.aimWorldX, a.y - this.aimWorldY);
        if (aimDist < 120 && aimDist < bestScore) {
          bestScore = aimDist;
          bestAnchor = a;
        }
      } else {
        // Keyboard auto-latch prefers anchors ahead or above
        const dirPenalty = dx * p.facing >= -60 ? 0 : 180;
        const sc = dist + dirPenalty;
        if (sc < bestScore) {
          bestScore = sc;
          bestAnchor = a;
        }
      }
    }

    if (bestAnchor && (this.aimWorldX !== null || !this.hasEnemyDirectlyAhead(ox, oy, p.facing))) {
      p.grappleAnchor = bestAnchor;
      p.ropeLength = Math.max(95, Math.min(285, Math.hypot(bestAnchor.x - ox, bestAnchor.y - oy) * 0.92));
      p.doubleJumpAvailable = true;
      p.silkCooldown = 0.22;
      p.expression = 'GRIN';
      p.expressionTimer = 0.5;
      soundEngine.playGrappleLatch();
      this.spawnBurst(bestAnchor.x, bestAnchor.y, '#FFF3C4', 12, 160);
      return;
    }

    // 2. Otherwise shoot a Golden Silk projectile (aimed at cursor OR smart-aimed at nearest rival)
    let dirX = p.facing;
    let dirY = -0.06;

    if (this.aimWorldX !== null && this.aimWorldY !== null) {
      const adx = this.aimWorldX - ox;
      const ady = this.aimWorldY - oy;
      const len = Math.hypot(adx, ady) || 1;
      dirX = adx / len;
      dirY = ady / len;
      p.facing = dirX >= 0 ? 1 : -1;
    } else {
      // Gentle smart-assist toward nearest non-defeated enemy in front
      let nearestEnemy: Enemy | null = null;
      let nearestDist = 420;
      for (const e of this.chapter.enemies) {
        if (e.state === 'DEFEATED') continue;
        const ex = e.x + e.w * 0.5;
        const ey = e.y + e.h * 0.5;
        const dx = ex - ox;
        if (dx * p.facing < -24) continue;
        const d = Math.hypot(dx, ey - oy);
        if (d < nearestDist) {
          nearestDist = d;
          nearestEnemy = e;
        }
      }
      if (nearestEnemy) {
        const dx = nearestEnemy.x + nearestEnemy.w * 0.5 - ox;
        const dy = nearestEnemy.y + nearestEnemy.h * 0.5 - oy;
        const len = Math.hypot(dx, dy) || 1;
        dirX = dx / len;
        dirY = dy / len;
      }
    }

    const speed = 780;
    this.projectiles.push({
      x: ox + dirX * 16,
      y: oy + dirY * 16,
      vx: dirX * speed,
      vy: dirY * speed,
      life: 0.58,
      maxLife: 0.58,
      active: true,
    });

    p.silkCooldown = 0.28;
    p.expression = 'FOCUS';
    p.expressionTimer = 0.28;
    soundEngine.playSilkShoot();
  }

  private hasEnemyDirectlyAhead(ox: number, oy: number, facing: 1 | -1): boolean {
    for (const e of this.chapter.enemies) {
      if (e.state === 'DEFEATED' || e.state === 'SILK_BOUND') continue;
      const ex = e.x + e.w * 0.5;
      const ey = e.y + e.h * 0.5;
      if ((ex - ox) * facing > 0 && Math.abs(ex - ox) < 280 && Math.abs(ey - oy) < 95) {
        return true;
      }
    }
    return false;
  }

  private releaseGrapple(boost: boolean) {
    const p = this.player;
    p.grappleAnchor = null;
    if (boost) {
      p.vy = Math.min(p.vy - 180, -520);
      p.vx *= 1.18;
      p.scaleX = 0.8;
      p.scaleY = 1.24;
      soundEngine.playDoubleJump();
      this.spawnBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, '#F5B731', 10, 140);
    }
  }

  private updateProjectiles(dt: number) {
    for (const proj of this.projectiles) {
      if (!proj.active) continue;
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;
      if (proj.life <= 0) {
        proj.active = false;
        continue;
      }

      // Latch onto Grapple Anchor if projectile hits it!
      for (const a of this.chapter.anchors) {
        if (Math.hypot(proj.x - a.x, proj.y - a.y) < a.radius + 16) {
          proj.active = false;
          this.player.grappleAnchor = a;
          this.player.ropeLength = Math.max(
            95,
            Math.min(285, Math.hypot(a.x - this.player.x, a.y - this.player.y) * 0.92)
          );
          this.player.doubleJumpAvailable = true;
          soundEngine.playGrappleLatch();
          this.spawnBurst(a.x, a.y, '#FFF3C4', 10, 140);
          break;
        }
      }
      if (!proj.active) continue;

      // Bind enemies in Golden Silk!
      for (const e of this.chapter.enemies) {
        if (e.state === 'DEFEATED') continue;
        if (
          proj.x >= e.x - 10 &&
          proj.x <= e.x + e.w + 10 &&
          proj.y >= e.y - 10 &&
          proj.y <= e.y + e.h + 10
        ) {
          proj.active = false;
          e.state = 'SILK_BOUND';
          e.bindTimer = e.kind === 'BREDDA_TIGER' ? 3.2 : 4.2;
          e.vx = 0;
          e.vy = 0;
          e.hitFlashTimer = 0.1;
          this.hitstopTimer = 0.045;
          soundEngine.playEnemyBind();
          this.spawnBurst(e.x + e.w * 0.5, e.y + e.h * 0.5, '#FFE082', 16, 210);
          this.addCallout(
            e.x + e.w * 0.5,
            e.y - 14,
            e.kind === 'BREDDA_TIGER' ? 'Silk-Bound! Dash Now!' : 'Silk-Bound!',
            '#FFE082'
          );
          break;
        }
      }
    }

    this.projectiles = this.projectiles.filter((p) => p.active);
  }

  private updateEnemies(dt: number) {
    const p = this.player;
    const px = p.x + p.w * 0.5;
    const py = p.y + p.h * 0.5;

    for (const e of this.chapter.enemies) {
      if (e.state === 'DEFEATED') continue;
      e.animPhase += dt;
      if (e.hitFlashTimer > 0) e.hitFlashTimer -= dt;
      if (e.attackCooldown > 0) e.attackCooldown -= dt;

      const ex = e.x + e.w * 0.5;
      const ey = e.y + e.h * 0.5;
      const dxToPlayer = px - ex;
      const dyToPlayer = py - ey;
      const dist = Math.hypot(dxToPlayer, dyToPlayer);

      if (e.state === 'SILK_BOUND') {
        e.bindTimer -= dt;
        if (e.bindTimer <= 0) {
          e.state = 'PATROL';
          e.attackCooldown = 1.0;
        }
      } else if (e.kind === 'HORNET') {
        // Hovering Hornet AI
        if (e.state === 'PATROL') {
          e.x += e.facing * 86 * dt;
          e.y = e.homeY + Math.sin(e.animPhase * 3) * 18;
          if (e.x < e.patrolMinX) e.facing = 1;
          if (e.x > e.patrolMaxX) e.facing = -1;
          if (dist < 260 && e.attackCooldown <= 0) {
            e.state = 'TELEGRAPH';
            e.stateTimer = 0.52;
            e.facing = dxToPlayer >= 0 ? 1 : -1;
          }
        } else if (e.state === 'TELEGRAPH') {
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'ATTACK';
            e.stateTimer = 0.42;
            const len = Math.hypot(dxToPlayer, dyToPlayer) || 1;
            e.vx = (dxToPlayer / len) * 390;
            e.vy = (dyToPlayer / len) * 390;
          }
        } else if (e.state === 'ATTACK') {
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'RECOVER';
            e.stateTimer = 0.7;
          }
        } else if (e.state === 'RECOVER') {
          e.y += (e.homeY - e.y) * Math.min(1, dt * 3);
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'PATROL';
            e.attackCooldown = 1.35;
          }
        }
      } else {
        // Grounded Folklore Rivals (SNAKE, TIGER_CUB, BREDDA_TIGER)
        const isBoss = e.kind === 'BREDDA_TIGER';
        const patrolSpeed = isBoss ? 125 : e.kind === 'TIGER_CUB' ? 110 : 72;
        const detectRange = isBoss ? 520 : 270;
        const telegraphDur = isBoss ? 0.68 : 0.54;
        const attackSpeed = isBoss ? 470 : e.kind === 'TIGER_CUB' ? 350 : 290;

        if (e.state === 'PATROL') {
          e.vx = e.facing * patrolSpeed;
          e.x += e.vx * dt;
          if (e.x < e.patrolMinX) {
            e.x = e.patrolMinX;
            e.facing = 1;
          }
          if (e.x > e.patrolMaxX) {
            e.x = e.patrolMaxX;
            e.facing = -1;
          }
          if (dist < detectRange && Math.abs(dyToPlayer) < 130 && e.attackCooldown <= 0) {
            e.state = 'TELEGRAPH';
            e.stateTimer = telegraphDur;
            e.vx = 0;
            e.facing = dxToPlayer >= 0 ? 1 : -1;
          }
        } else if (e.state === 'TELEGRAPH') {
          e.vx = 0;
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'ATTACK';
            e.stateTimer = isBoss ? 0.58 : 0.38;
            e.vx = e.facing * attackSpeed;
            if (isBoss) {
              e.vy = -270;
            }
          }
        } else if (e.state === 'ATTACK') {
          e.x += e.vx * dt;
          if (isBoss) {
            e.vy += 1200 * dt;
            e.y += e.vy * dt;
            if (e.y >= e.homeY) {
              e.y = e.homeY;
              e.vy = 0;
            }
          }
          e.x = Math.max(e.patrolMinX, Math.min(e.patrolMaxX, e.x));
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'RECOVER';
            e.stateTimer = isBoss ? 1.55 : 0.75;
            e.vx = 0;
            e.y = e.homeY;
          }
        } else if (e.state === 'RECOVER') {
          e.vx = 0;
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.state = 'PATROL';
            e.attackCooldown = isBoss ? 1.15 : 1.1;
          }
        }
      }

      // Check Player <-> Enemy Interaction
      if (this.aabbOverlap(p.x, p.y, p.w, p.h, e.x, e.y, e.w, e.h)) {
        const isDashing = p.dashTimer > 0;
        const isStomping = p.vy > 45 && p.y + p.h - p.vy * dt <= e.y + 22;

        if (e.state === 'SILK_BOUND' || (isStomping && e.kind !== 'BREDDA_TIGER')) {
          // Trick-Vault! Outwitted!
          this.vaultEnemy(e, isStomping);
        } else if (!isDashing && p.invulnTimer <= 0) {
          const knockDir = px < ex ? -1 : 1;
          this.damagePlayer(1, knockDir);
        }
      }
    }
  }

  private vaultEnemy(e: Enemy, wasStomp: boolean) {
    const p = this.player;
    e.hp -= 1;
    e.hitFlashTimer = 0.16;

    if (wasStomp) {
      p.vy = -480;
      p.doubleJumpAvailable = true;
    } else {
      p.vy = -260;
    }
    p.invulnTimer = Math.max(p.invulnTimer, 0.38);
    p.expression = 'GRIN';
    p.expressionTimer = 0.55;

    this.combo += 1;
    this.comboTimer = 4.0;
    const pts = (e.kind === 'BREDDA_TIGER' ? 350 : 150) * Math.max(1, this.combo);
    this.score += pts;

    this.hitstopTimer = e.kind === 'BREDDA_TIGER' ? 0.075 : 0.05;
    this.shakeTimer = 0.22;
    this.shakeIntensity = e.kind === 'BREDDA_TIGER' ? 11 : 6;

    if (e.hp <= 0) {
      e.state = 'DEFEATED';
      soundEngine.playTrickVault();
      if (e.kind === 'BREDDA_TIGER') {
        soundEngine.playChapterClear();
        this.spawnBurst(e.x + e.w * 0.5, e.y + e.h * 0.5, '#F5B731', 36, 320);
        this.addCallout(e.x + e.w * 0.5, e.y - 24, 'Bredda Tiger Outwitted!', '#FFD15C');
      } else {
        this.spawnBurst(e.x + e.w * 0.5, e.y + e.h * 0.5, '#F5B731', 20, 220);
        this.addCallout(e.x + e.w * 0.5, e.y - 18, `+${pts} Trickster!`, '#F5B731');
      }
    } else {
      // Boss or Tiger Cub breaks free after taking 1 strike
      e.state = 'RECOVER';
      e.stateTimer = 0.85;
      e.attackCooldown = 1.0;
      soundEngine.playBossStagger();
      this.spawnBurst(e.x + e.w * 0.5, e.y + e.h * 0.5, '#FFD15C', 22, 260);
      this.addCallout(e.x + e.w * 0.5, e.y - 20, `Bell Loose! +${pts}`, '#FFD15C');
    }

    this.emitHud();
  }

  private damagePlayer(amount: number, knockDir: number) {
    const p = this.player;
    if (p.invulnTimer > 0) return;

    p.hp = Math.max(0, p.hp - amount);
    p.invulnTimer = 1.15;
    p.hitFlashTimer = 0.18;
    p.grappleAnchor = null;
    p.expression = 'SURPRISED';
    p.expressionTimer = 0.6;
    if (knockDir !== 0) {
      p.vx = knockDir * 280;
      p.vy = -340;
    }

    this.combo = 0;
    this.comboTimer = 0;
    this.hitstopTimer = 0.055;
    this.shakeTimer = 0.25;
    this.shakeIntensity = 9;
    soundEngine.playHurt();
    this.spawnBurst(p.x + p.w * 0.5, p.y + p.h * 0.5, '#E85D3F', 14, 190);

    if (p.hp <= 0) {
      this.phase = 'GAME_OVER';
    }
    this.emitHud();
  }

  private updateCollectibles() {
    const p = this.player;
    const px = p.x + p.w * 0.5;
    const py = p.y + p.h * 0.5;

    for (const c of this.chapter.collectibles) {
      if (c.collected) continue;
      const dist = Math.hypot(c.x - px, c.baseY - py);
      const radius = c.kind === 'SHARD' ? 36 : 28;
      if (dist <= radius) {
        c.collected = true;
        if (c.kind === 'BEAD') {
          this.beadsCollected += 1;
          this.combo += 1;
          this.comboTimer = 3.2;
          const pts = 25 * Math.min(5, Math.max(1, this.combo));
          this.score += pts;
          soundEngine.playCollectBead(this.combo);
          this.spawnBurst(c.x, c.baseY, '#F5B731', 8, 120);
        } else if (c.kind === 'SHARD') {
          this.score += 500;
          p.expression = 'GRIN';
          p.expressionTimer = 0.8;
          soundEngine.playCollectShard();
          this.spawnBurst(c.x, c.baseY, '#FFF3C4', 22, 230);
          this.addCallout(c.x, c.baseY - 18, 'Calabash Shard! +500', '#FFD15C');
        } else if (c.kind === 'ACKEE') {
          p.hp = Math.min(p.maxHp, p.hp + 1);
          this.score += 100;
          soundEngine.playHeal();
          this.spawnBurst(c.x, c.baseY, '#68D391', 16, 170);
          this.addCallout(c.x, c.baseY - 18, 'Sweet Ackee! +1 Heart', '#68D391');
        }
        this.emitHud();
      }
    }
  }

  private checkGoalReached() {
    const boss = this.chapter.enemies.find((e) => e.kind === 'BREDDA_TIGER');
    const bossDefeated = !boss || boss.state === 'DEFEATED';
    if (this.chapter.isBossStage && !bossDefeated) return;

    const px = this.player.x + this.player.w * 0.5;
    const py = this.player.y + this.player.h * 0.5;
    const dist = Math.hypot(px - this.chapter.goalX, py - (this.chapter.goalY - 38));

    if (dist < 62) {
      soundEngine.playChapterClear();
      this.score += 750;
      if (this.chapterIndex + 1 < this.chapters.length) {
        this.phase = 'CHAPTER_CLEAR';
      } else {
        this.phase = 'VICTORY';
      }
      this.emitHud();
    }
  }

  private updateParticlesAndCallouts(dt: number) {
    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += pt.gravity * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);

    for (const c of this.callouts) {
      c.y += c.vy * dt;
      c.life -= dt;
    }
    this.callouts = this.callouts.filter((c) => c.life > 0);

    for (const a of this.afterImages) {
      a.life -= dt;
    }
    this.afterImages = this.afterImages.filter((a) => a.life > 0);
  }

  private updateCamera(dt: number) {
    const targetCam = this.player.x + this.player.w * 0.5 - this.viewW * 0.36;
    const maxCam = Math.max(0, this.chapter.width - this.viewW);
    const clamped = Math.max(0, Math.min(maxCam, targetCam));
    this.camX += (clamped - this.camX) * Math.min(1, dt * 7.5);
  }

  private spawnBurst(x: number, y: number, color: string, count: number, speed: number) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = speed * (0.4 + Math.random() * 0.7);
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        size: 3 + Math.random() * 3.5,
        life: 0.42 + Math.random() * 0.28,
        maxLife: 0.7,
        color,
        gravity: 340,
      });
    }
  }

  private addCallout(x: number, y: number, text: string, color: string) {
    this.callouts.push({
      x,
      y,
      vy: -42,
      text,
      color,
      life: 1.05,
      maxLife: 1.05,
    });
  }

  private aabbOverlap(
    ax: number,
    ay: number,
    aw: number,
    ah: number,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  private emitHud() {
    const shards = this.chapter.collectibles.filter((c) => c.kind === 'SHARD');
    const shardsCollected = shards.filter((s) => s.collected).length;
    const boss = this.chapter.enemies.find((e) => e.kind === 'BREDDA_TIGER');

    this.onHudUpdate({
      phase: this.phase,
      chapterIndex: this.chapterIndex,
      chapterTitle: this.chapter.title,
      chapterSubtitle: this.chapter.subtitle,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      score: this.score,
      combo: this.combo,
      comboTimer: this.comboTimer,
      shardsCollected,
      shardsTotal: shards.length,
      beadsCollected: this.beadsCollected,
      bossName: boss && boss.state !== 'DEFEATED' ? 'Bredda Tiger' : null,
      bossHp: boss ? boss.hp : 0,
      bossMaxHp: boss ? boss.maxHp : 0,
      bossBound: boss ? boss.state === 'SILK_BOUND' : false,
      elapsedSeconds: Math.floor(this.chapterElapsed),
    });
  }

  private render() {
    const ctx = this.ctx;
    const ch = this.canvas.height;

    ctx.save();
    // Scale logical 760px height cleanly to physical canvas
    const scale = ch / this.viewH;
    ctx.scale(scale, scale);

    // 1. Parallax Backdrop
    drawWorldBackdrop(
      ctx,
      this.chapter,
      this.camX,
      this.viewW,
      this.viewH,
      this.elapsedTime,
      this.fireflies
    );

    // Camera Shake offset
    let sx = 0;
    let sy = 0;
    if (this.shakeTimer > 0) {
      sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }

    ctx.save();
    ctx.translate(-this.camX + sx, sy);

    const boss = this.chapter.enemies.find((e) => e.kind === 'BREDDA_TIGER');
    const bossDefeated = !boss || boss.state === 'DEFEATED';

    // 2. Platforms, Lanterns, Shrine Goal
    drawPlatforms(ctx, this.chapter.platforms, this.camX, this.viewW, this.elapsedTime);
    drawLanternsAndGoal(
      ctx,
      this.chapter.lanterns,
      this.chapter.goalX,
      this.chapter.goalY,
      this.chapter.isBossStage,
      bossDefeated,
      this.elapsedTime
    );

    // 3. Grapple Anchors & Collectibles
    drawGrappleAnchors(ctx, this.chapter.anchors, this.player, this.elapsedTime);
    drawCollectibles(ctx, this.chapter.collectibles, this.elapsedTime);

    // 4. Enemies
    for (const enemy of this.chapter.enemies) {
      drawEnemyCharacter(ctx, enemy, this.elapsedTime);
    }

    // 5. Golden Silk Threads & Projectiles
    drawSilkLinesAndProjectiles(ctx, this.player, this.projectiles);

    // 6. Bredda Anansi Afterimages & Hero Rig
    drawAnansiAfterImages(ctx, this.afterImages);
    drawAnansiCharacter(ctx, this.player, this.elapsedTime);

    // 7. Particles & Callouts
    drawParticlesAndCallouts(ctx, this.particles, this.callouts);

    ctx.restore();
    ctx.restore();
  }
}
