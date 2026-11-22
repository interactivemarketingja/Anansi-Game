export type GamePhase =
  | 'TITLE_MENU'
  | 'CHAPTER_INTRO'
  | 'PLAYING'
  | 'PAUSED'
  | 'CHAPTER_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY';

export type PlatformKind = 'MOSS_BRANCH' | 'BAMBOO_BRIDGE' | 'LIMESTONE' | 'BOUNCE_DRUM';

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: PlatformKind;
  bounceVelocity?: number;
  oneWay?: boolean;
}

export interface GrappleAnchor {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export type CollectibleKind = 'BEAD' | 'SHARD' | 'ACKEE';

export interface Collectible {
  id: string;
  x: number;
  y: number;
  baseY: number;
  kind: CollectibleKind;
  collected: boolean;
  bobPhase: number;
}

export type EnemyKind = 'SNAKE' | 'HORNET' | 'TIGER_CUB' | 'BREDDA_TIGER';

export type EnemyAIState =
  | 'PATROL'
  | 'TELEGRAPH'
  | 'ATTACK'
  | 'RECOVER'
  | 'SILK_BOUND'
  | 'DEFEATED';

export interface Enemy {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  homeX: number;
  homeY: number;
  patrolMinX: number;
  patrolMaxX: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  state: EnemyAIState;
  stateTimer: number;
  bindTimer: number;
  hitFlashTimer: number;
  animPhase: number;
  attackCooldown: number;
}

export interface SilkProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
  glow?: boolean;
}

export interface FloatingCallout {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface AfterImage {
  x: number;
  y: number;
  facing: 1 | -1;
  scaleX: number;
  scaleY: number;
  life: number;
  maxLife: number;
}

export interface Firefly {
  x: number;
  y: number;
  phase: number;
  speedX: number;
  speedY: number;
  size: number;
}

export interface LanternPillar {
  x: number;
  y: number;
  h: number;
  lit: boolean;
  sparkTimer: number;
}

export interface ChapterPalette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  moonColor: string;
  ridgeFar: string;
  ridgeMid: string;
  ridgeNear: string;
  mistColor: string;
  accentGlow: string;
  groundTint: string;
}

export interface ChapterStoryIntro {
  speaker: string;
  speakerTitle: string;
  portraitKey: 'anansi' | 'snake' | 'tiger';
  proverb: string;
  objective: string;
}

export interface ChapterData {
  index: number;
  title: string;
  subtitle: string;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  goalX: number;
  goalY: number;
  isBossStage: boolean;
  palette: ChapterPalette;
  intro: ChapterStoryIntro;
  platforms: Platform[];
  anchors: GrappleAnchor[];
  collectibles: Collectible[];
  enemies: Enemy[];
  lanterns: LanternPillar[];
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  grounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  doubleJumpAvailable: boolean;
  dashTimer: number;
  dashCooldown: number;
  invulnTimer: number;
  hitFlashTimer: number;
  hp: number;
  maxHp: number;
  // Grapple swing state
  grappleAnchor: GrappleAnchor | null;
  ropeLength: number;
  silkCooldown: number;
  // Visual animation state
  scaleX: number;
  scaleY: number;
  stridePhase: number;
  blinkTimer: number;
  isBlinking: boolean;
  hatTilt: number;
  sashPoints: Array<{ x: number; y: number }>;
  expression: 'CLEVER' | 'GRIN' | 'FOCUS' | 'SURPRISED';
  expressionTimer: number;
}

export interface HudSnapshot {
  phase: GamePhase;
  chapterIndex: number;
  chapterTitle: string;
  chapterSubtitle: string;
  hp: number;
  maxHp: number;
  score: number;
  combo: number;
  comboTimer: number;
  shardsCollected: number;
  shardsTotal: number;
  beadsCollected: number;
  bossName: string | null;
  bossHp: number;
  bossMaxHp: number;
  bossBound: boolean;
  elapsedSeconds: number;
}
