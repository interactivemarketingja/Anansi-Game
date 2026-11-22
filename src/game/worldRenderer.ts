import {
  ChapterData,
  Collectible,
  Firefly,
  FloatingCallout,
  GrappleAnchor,
  LanternPillar,
  Particle,
  Platform,
  PlayerState,
  SilkProjectile,
} from './types';

export function drawWorldBackdrop(
  ctx: CanvasRenderingContext2D,
  chapter: ChapterData,
  camX: number,
  viewW: number,
  viewH: number,
  time: number,
  fireflies: Firefly[]
) {
  const { palette } = chapter;

  // 1. Twilight Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
  skyGrad.addColorStop(0, palette.skyTop);
  skyGrad.addColorStop(0.55, palette.skyMid);
  skyGrad.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewW, viewH);

  // 2. Stars & Crescent Moon
  ctx.save();
  for (let i = 0; i < 36; i++) {
    const sx = ((i * 197 + 43) % (viewW + 120)) - (camX * 0.03) % 120;
    const sy = (i * 89 + 21) % (viewH * 0.48);
    const twinkle = 0.28 + 0.55 * Math.abs(Math.sin(time * 1.4 + i));
    ctx.fillStyle = `rgba(255, 245, 214, ${twinkle.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, (i % 3 === 0 ? 1.8 : 1.1), 0, Math.PI * 2);
    ctx.fill();
  }

  // Crescent Moon
  const moonX = viewW * 0.74 - camX * 0.02;
  const moonY = viewH * 0.19;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 130);
  moonGlow.addColorStop(0, 'rgba(251, 232, 166, 0.25)');
  moonGlow.addColorStop(1, 'rgba(251, 232, 166, 0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 130, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.moonColor;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.skyTop;
  ctx.beginPath();
  ctx.arc(moonX + 11, moonY - 7, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Far Blue Mountain Ridges (Parallax 0.14)
  drawMountainLayer(ctx, viewW, viewH, camX * 0.14, viewH * 0.52, 85, palette.ridgeFar, 0.0032);
  // 4. Mid Fern Ridges (Parallax 0.28)
  drawMountainLayer(ctx, viewW, viewH, camX * 0.28, viewH * 0.65, 65, palette.ridgeMid, 0.0055);
  // 5. Giant Silk-Cotton Tree Silhouettes (Parallax 0.45)
  drawCanopyTrees(ctx, viewW, viewH, camX * 0.45, palette.ridgeNear);

  // 6. Soft drifting mountain mist
  ctx.fillStyle = palette.mistColor;
  for (let i = 0; i < 4; i++) {
    const mx = ((i * 460 - camX * 0.35 + time * 18) % (viewW + 500)) - 250;
    const my = viewH * 0.72 + Math.sin(time * 0.5 + i) * 18;
    ctx.beginPath();
    ctx.ellipse(mx, my, 290, 46, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Peenie-Wallie Fireflies in ambient air
  for (const f of fireflies) {
    const fx = ((f.x - camX * 0.75) % (viewW + 120) + (viewW + 120)) % (viewW + 120) - 60;
    const fy = f.y + Math.sin(time * 2.2 + f.phase) * 18;
    const pulse = 0.35 + 0.65 * Math.abs(Math.sin(time * 3 + f.phase));

    ctx.fillStyle = `rgba(245, 198, 66, ${(pulse * 0.28).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(fx, fy, f.size * 4.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 240, 170, ${(pulse * 0.95).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(fx, fy, f.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMountainLayer(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  scroll: number,
  baseY: number,
  amp: number,
  color: string,
  freq: number
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, viewH);
  for (let x = 0; x <= viewW + 40; x += 32) {
    const wx = x + scroll;
    const h =
      Math.sin(wx * freq) * amp +
      Math.cos(wx * freq * 2.1 + 1.4) * (amp * 0.42) +
      Math.sin(wx * freq * 0.45) * (amp * 0.55);
    ctx.lineTo(x, baseY - Math.abs(h));
  }
  ctx.lineTo(viewW, viewH);
  ctx.closePath();
  ctx.fill();
}

function drawCanopyTrees(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  scroll: number,
  color: string
) {
  ctx.fillStyle = color;
  const spacing = 360;
  const firstIdx = Math.floor(scroll / spacing) - 1;
  const count = Math.ceil(viewW / spacing) + 3;

  for (let i = 0; i < count; i++) {
    const idx = firstIdx + i;
    const tx = idx * spacing - scroll + ((idx * 97) % 90);
    const trunkW = 34 + (Math.abs(idx * 17) % 22);
    ctx.fillRect(tx - trunkW * 0.5, viewH * 0.28, trunkW, viewH * 0.72);
    // Buttress roots & upper branches
    ctx.beginPath();
    ctx.ellipse(tx, viewH * 0.27, 130, 52, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawPlatforms(
  ctx: CanvasRenderingContext2D,
  platforms: Platform[],
  camX: number,
  viewW: number,
  time: number
) {
  for (const p of platforms) {
    if (p.x + p.w < camX - 80 || p.x > camX + viewW + 80) continue;

    if (p.kind === 'MOSS_BRANCH') {
      // Rich dark earth/bark body
      const barkGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
      barkGrad.addColorStop(0, '#3D271C');
      barkGrad.addColorStop(0.4, '#241710');
      barkGrad.addColorStop(1, '#100B08');
      ctx.fillStyle = barkGrad;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y + 6, p.w, p.h - 6, [10, 10, 0, 0]);
      ctx.fill();

      // Lush moss & fern rim
      const mossGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + 18);
      mossGrad.addColorStop(0, '#3FA36C');
      mossGrad.addColorStop(1, '#1D5E3C');
      ctx.fillStyle = mossGrad;
      ctx.beginPath();
      ctx.roundRect(p.x - 3, p.y, p.w + 6, 16, 8);
      ctx.fill();

      // Subtle golden highlight rim
      ctx.fillStyle = 'rgba(245, 224, 150, 0.25)';
      ctx.fillRect(p.x + 6, p.y + 2, p.w - 12, 2);
    } else if (p.kind === 'BAMBOO_BRIDGE') {
      // Bamboo segments lashed with twine
      ctx.fillStyle = '#0D1914';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 8);
      ctx.fill();

      const bamGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
      bamGrad.addColorStop(0, '#C7A953');
      bamGrad.addColorStop(0.55, '#8F732B');
      bamGrad.addColorStop(1, '#584418');
      ctx.fillStyle = bamGrad;
      ctx.beginPath();
      ctx.roundRect(p.x + 2, p.y + 2, p.w - 4, p.h - 6, 6);
      ctx.fill();

      // Bamboo node joints
      ctx.strokeStyle = '#3B2C0F';
      ctx.lineWidth = 2.5;
      for (let bx = p.x + 42; bx < p.x + p.w - 20; bx += 46) {
        ctx.beginPath();
        ctx.moveTo(bx, p.y + 2);
        ctx.lineTo(bx, p.y + p.h - 4);
        ctx.stroke();
      }
    } else if (p.kind === 'LIMESTONE') {
      const rockGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
      rockGrad.addColorStop(0, '#3C5966');
      rockGrad.addColorStop(0.45, '#223540');
      rockGrad.addColorStop(1, '#0F1A22');
      ctx.fillStyle = rockGrad;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, [10, 10, 0, 0]);
      ctx.fill();

      // Bioluminescent moss rim
      ctx.fillStyle = '#38B2AC';
      ctx.beginPath();
      ctx.roundRect(p.x + 2, p.y, p.w - 4, 8, 4);
      ctx.fill();
    } else if (p.kind === 'BOUNCE_DRUM') {
      // Jamaican Djembe / Nyabinghi Bounce Drum!
      const pulse = Math.sin(time * 4) * 1.5;
      ctx.fillStyle = '#5D2E1B';
      ctx.beginPath();
      ctx.roundRect(p.x + 12, p.y + 8, p.w - 24, p.h - 6, 6);
      ctx.fill();

      // Tension cords
      ctx.strokeStyle = '#E6C27A';
      ctx.lineWidth = 2;
      for (let dx = p.x + 18; dx <= p.x + p.w - 18; dx += 14) {
        ctx.beginPath();
        ctx.moveTo(dx, p.y + 8);
        ctx.lineTo(dx + 4, p.y + p.h - 2);
        ctx.stroke();
      }

      // Drumhead
      ctx.fillStyle = '#F5B731';
      ctx.strokeStyle = '#1E110B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y - pulse * 0.4, p.w, 13, 6);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export function drawLanternsAndGoal(
  ctx: CanvasRenderingContext2D,
  lanterns: LanternPillar[],
  goalX: number,
  goalY: number,
  isBossStage: boolean,
  bossDefeated: boolean,
  time: number
) {
  for (const l of lanterns) {
    // Wooden carved post
    ctx.fillStyle = '#2B1B12';
    ctx.fillRect(l.x - 5, l.y - l.h, 10, l.h);
    // Crossbar
    ctx.fillRect(l.x - 6, l.y - l.h, 24, 6);

    // Glowing amber lantern
    const lx = l.x + 14;
    const ly = l.y - l.h + 14;
    const glow = ctx.createRadialGradient(lx, ly, 3, lx, ly, 46);
    glow.addColorStop(0, 'rgba(255, 210, 96, 0.55)');
    glow.addColorStop(1, 'rgba(245, 183, 49, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly, 46, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFD166';
    ctx.strokeStyle = '#1E120C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(lx - 6, ly - 8, 12, 16, 3);
    ctx.fill();
    ctx.stroke();
  }

  // Story Shrine / Golden Calabash Portal
  if (!isBossStage || bossDefeated) {
    const pulse = 1 + Math.sin(time * 3.5) * 0.08;
    ctx.save();
    ctx.translate(goalX, goalY - 46);

    // Radiant aura
    const aura = ctx.createRadialGradient(0, 0, 8, 0, 0, 74 * pulse);
    aura.addColorStop(0, 'rgba(245, 198, 66, 0.55)');
    aura.addColorStop(0.5, 'rgba(245, 183, 49, 0.18)');
    aura.addColorStop(1, 'rgba(245, 183, 49, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 74 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Carved Wooden Story Arch
    ctx.strokeStyle = '#6B4226';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, 8, 38, Math.PI, 0);
    ctx.moveTo(-38, 8);
    ctx.lineTo(-38, 46);
    ctx.moveTo(38, 8);
    ctx.lineTo(38, 46);
    ctx.stroke();

    // Floating Golden Calabash Crown inside Shrine
    ctx.translate(0, Math.sin(time * 2.8) * 5);
    ctx.fillStyle = '#F5B731';
    ctx.strokeStyle = '#1F130C';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 6, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

export function drawGrappleAnchors(
  ctx: CanvasRenderingContext2D,
  anchors: GrappleAnchor[],
  player: PlayerState,
  time: number
) {
  const px = player.x + player.w * 0.5;
  const py = player.y + player.h * 0.4;

  for (const a of anchors) {
    const dist = Math.hypot(a.x - px, a.y - py);
    const inRange = dist < 390;
    const isLatched = player.grappleAnchor?.id === a.id;

    // Hanging vine stalk
    ctx.strokeStyle = '#255B40';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 120);
    ctx.lineTo(a.x, a.y);
    ctx.stroke();

    // Outer Silk Blossom Halo
    const haloRadius = isLatched ? 28 : inRange ? 24 + Math.sin(time * 6) * 3 : 16;
    ctx.strokeStyle = isLatched
      ? '#FFF3C4'
      : inRange
        ? 'rgba(245, 183, 49, 0.85)'
        : 'rgba(245, 183, 49, 0.32)';
    ctx.lineWidth = isLatched ? 3 : 2;
    ctx.beginPath();
    ctx.arc(a.x, a.y, haloRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Golden Blossom Core
    ctx.fillStyle = isLatched ? '#FFF3C4' : '#F5B731';
    ctx.beginPath();
    ctx.arc(a.x, a.y, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8C4A15';
    ctx.beginPath();
    ctx.arc(a.x, a.y, 3.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawCollectibles(
  ctx: CanvasRenderingContext2D,
  collectibles: Collectible[],
  time: number
) {
  for (const c of collectibles) {
    if (c.collected) continue;
    const y = c.baseY + Math.sin(time * 3.4 + c.bobPhase) * 6;

    if (c.kind === 'BEAD') {
      // Glowing Story Bead
      ctx.fillStyle = 'rgba(245, 183, 49, 0.25)';
      ctx.beginPath();
      ctx.arc(c.x, y, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F5B731';
      ctx.strokeStyle = '#1E140B';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(c.x, y, 7.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFF7D6';
      ctx.beginPath();
      ctx.arc(c.x - 2, y - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.kind === 'SHARD') {
      // Radiant Golden Calabash Shard
      ctx.save();
      ctx.translate(c.x, y);
      ctx.rotate(Math.sin(time * 2 + c.bobPhase) * 0.14);

      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
      glow.addColorStop(0, 'rgba(255, 226, 122, 0.65)');
      glow.addColorStop(1, 'rgba(245, 183, 49, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFD15C';
      ctx.strokeStyle = '#1F130B';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(12, -2);
      ctx.lineTo(7, 14);
      ctx.lineTo(-9, 12);
      ctx.lineTo(-12, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Etched Adinkra spiral inside shard
      ctx.strokeStyle = '#9C5B12';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 1, 4.5, 0, Math.PI * 1.6);
      ctx.stroke();
      ctx.restore();
    } else if (c.kind === 'ACKEE') {
      // Jamaican Ackee Healing Fruit!
      ctx.save();
      ctx.translate(c.x, y);

      ctx.fillStyle = 'rgba(232, 93, 63, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#E85D3F';
      ctx.strokeStyle = '#1E110B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 2, 11, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Golden arils peeking out + leaf
      ctx.fillStyle = '#FCD34D';
      ctx.beginPath();
      ctx.arc(-2.5, 1, 3.2, 0, Math.PI * 2);
      ctx.arc(3, 2, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2EA06B';
      ctx.beginPath();
      ctx.ellipse(3, -11, 5, 2.8, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export function drawSilkLinesAndProjectiles(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  projectiles: SilkProjectile[]
) {
  // Active grapple silk tether
  if (player.grappleAnchor) {
    const px = player.x + player.w * 0.5 + player.facing * 12;
    const py = player.y + 12;
    const ax = player.grappleAnchor.x;
    const ay = player.grappleAnchor.y;

    ctx.save();
    ctx.strokeStyle = 'rgba(245, 183, 49, 0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    ctx.strokeStyle = '#FFF3C4';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    ctx.restore();
  }

  // Active silk projectiles
  for (const p of projectiles) {
    if (!p.active) continue;
    ctx.save();
    ctx.strokeStyle = '#F5B731';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x - p.vx * 0.028, p.y - p.vy * 0.028);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawParticlesAndCallouts(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  callouts: FloatingCallout[]
) {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const c of callouts) {
    const alpha = Math.min(1, (c.life / c.maxLife) * 1.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '700 15px "Fraunces", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#09110E';
    ctx.fillText(c.text, c.x + 1.5, c.y + 1.5);
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, c.x, c.y);
    ctx.restore();
  }
}
