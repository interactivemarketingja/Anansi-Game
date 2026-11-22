import { ChapterData, Collectible, Enemy, GrappleAnchor, LanternPillar, Platform } from './types';

function makeBeadArc(prefix: string, startX: number, y: number, count: number, stepX: number, arcHeight = 0): Collectible[] {
  const items: Collectible[] = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0.5;
    const curve = Math.sin(t * Math.PI) * arcHeight;
    items.push({
      id: `${prefix}_${i}`,
      x: startX + i * stepX,
      y: y - curve,
      baseY: y - curve,
      kind: 'BEAD',
      collected: false,
      bobPhase: i * 0.65,
    });
  }
  return items;
}

function makeEnemy(
  id: string,
  kind: Enemy['kind'],
  x: number,
  y: number,
  patrolSpan: number
): Enemy {
  if (kind === 'SNAKE') {
    const h = 50;
    const adjY = y - (h - 34);
    return {
      id,
      kind,
      x,
      y: adjY,
      vx: 0,
      vy: 0,
      w: 86,
      h,
      homeX: x,
      homeY: adjY,
      patrolMinX: x - patrolSpan,
      patrolMaxX: x + patrolSpan,
      facing: -1,
      hp: 1,
      maxHp: 1,
      state: 'PATROL',
      stateTimer: 0,
      bindTimer: 0,
      hitFlashTimer: 0,
      animPhase: Math.random() * Math.PI * 2,
      attackCooldown: 0.8,
    };
  }
  if (kind === 'HORNET') {
    const h = 54;
    const adjY = y - 9;
    return {
      id,
      kind,
      x,
      y: adjY,
      vx: 0,
      vy: 0,
      w: 66,
      h,
      homeX: x,
      homeY: adjY,
      patrolMinX: x - patrolSpan,
      patrolMaxX: x + patrolSpan,
      facing: -1,
      hp: 1,
      maxHp: 1,
      state: 'PATROL',
      stateTimer: 0,
      bindTimer: 0,
      hitFlashTimer: 0,
      animPhase: Math.random() * Math.PI * 2,
      attackCooldown: 1.0,
    };
  }
  if (kind === 'TIGER_CUB') {
    const h = 64;
    const adjY = y - (h - 42);
    return {
      id,
      kind,
      x,
      y: adjY,
      vx: 0,
      vy: 0,
      w: 94,
      h,
      homeX: x,
      homeY: adjY,
      patrolMinX: x - patrolSpan,
      patrolMaxX: x + patrolSpan,
      facing: -1,
      hp: 2,
      maxHp: 2,
      state: 'PATROL',
      stateTimer: 0,
      bindTimer: 0,
      hitFlashTimer: 0,
      animPhase: Math.random() * Math.PI * 2,
      attackCooldown: 1.1,
    };
  }
  // BREDDA_TIGER Boss
  const bossH = 108;
  const bossAdjY = y - (bossH - 74);
  return {
    id,
    kind: 'BREDDA_TIGER',
    x,
    y: bossAdjY,
    vx: 0,
    vy: 0,
    w: 164,
    h: bossH,
    homeX: x,
    homeY: bossAdjY,
    patrolMinX: x - patrolSpan,
    patrolMaxX: x + patrolSpan,
    facing: -1,
    hp: 4,
    maxHp: 4,
    state: 'PATROL',
    stateTimer: 0,
    bindTimer: 0,
    hitFlashTimer: 0,
    animPhase: 0,
    attackCooldown: 1.4,
  };
}

export function createChapters(): ChapterData[] {
  // CHAPTER 1: FERN GULLY TWILIGHT
  const ch1Platforms: Platform[] = [
    { id: 'c1_start', x: 0, y: 610, w: 620, h: 160, kind: 'MOSS_BRANCH' },
    { id: 'c1_step1', x: 700, y: 540, w: 230, h: 36, kind: 'BAMBOO_BRIDGE', oneWay: true },
    { id: 'c1_ledge2', x: 1010, y: 480, w: 320, h: 160, kind: 'MOSS_BRANCH' },
    { id: 'c1_high1', x: 1110, y: 310, w: 190, h: 28, kind: 'BAMBOO_BRIDGE', oneWay: true },
    { id: 'c1_gorge_l', x: 1450, y: 560, w: 280, h: 160, kind: 'MOSS_BRANCH' },
    // Silk swing gorge here!
    { id: 'c1_gorge_r', x: 2140, y: 530, w: 460, h: 190, kind: 'MOSS_BRANCH' },
    { id: 'c1_drum1', x: 2460, y: 500, w: 96, h: 30, kind: 'BOUNCE_DRUM', bounceVelocity: -760 },
    { id: 'c1_canopy1', x: 2660, y: 315, w: 320, h: 32, kind: 'BAMBOO_BRIDGE', oneWay: true },
    { id: 'c1_mid2', x: 2740, y: 560, w: 420, h: 160, kind: 'MOSS_BRANCH' },
    { id: 'c1_step3', x: 3280, y: 470, w: 240, h: 32, kind: 'BAMBOO_BRIDGE', oneWay: true },
    // Double silk swing valley
    { id: 'c1_shrine', x: 3920, y: 520, w: 580, h: 200, kind: 'MOSS_BRANCH' },
  ];

  const ch1Anchors: GrappleAnchor[] = [
    { id: 'c1_a1', x: 1850, y: 265, radius: 18 },
    { id: 'c1_a2', x: 2010, y: 255, radius: 18 },
    { id: 'c1_a3', x: 3630, y: 240, radius: 18 },
    { id: 'c1_a4', x: 3810, y: 230, radius: 18 },
  ];

  const ch1Collectibles: Collectible[] = [
    ...makeBeadArc('c1b1', 330, 560, 4, 52, 22),
    ...makeBeadArc('c1b2', 740, 488, 3, 55, 16),
    ...makeBeadArc('c1b3', 1780, 400, 5, 58, 42),
    ...makeBeadArc('c1b4', 2710, 265, 4, 58, 12),
    ...makeBeadArc('c1b5', 3580, 360, 5, 62, 48),
    { id: 'c1_s1', x: 1205, y: 252, baseY: 252, kind: 'SHARD', collected: false, bobPhase: 0 },
    { id: 'c1_s2', x: 2820, y: 248, baseY: 248, kind: 'SHARD', collected: false, bobPhase: 1.5 },
    { id: 'c1_s3', x: 3725, y: 295, baseY: 295, kind: 'SHARD', collected: false, bobPhase: 2.8 },
    { id: 'c1_ackee', x: 2290, y: 482, baseY: 482, kind: 'ACKEE', collected: false, bobPhase: 0.7 },
  ];

  const ch1Enemies: Enemy[] = [
    makeEnemy('c1_e1', 'SNAKE', 1180, 446, 110),
    makeEnemy('c1_e2', 'SNAKE', 2310, 496, 120),
    makeEnemy('c1_e3', 'HORNET', 2920, 420, 120),
    makeEnemy('c1_e4', 'SNAKE', 4100, 486, 120),
  ];

  // CHAPTER 2: COCKPIT COUNTRY CAVES
  const ch2Platforms: Platform[] = [
    { id: 'c2_start', x: 0, y: 600, w: 520, h: 170, kind: 'LIMESTONE' },
    { id: 'c2_b1', x: 600, y: 520, w: 220, h: 32, kind: 'BAMBOO_BRIDGE', oneWay: true },
    { id: 'c2_l1', x: 920, y: 450, w: 360, h: 260, kind: 'LIMESTONE' },
    { id: 'c2_drum1', x: 1170, y: 420, w: 94, h: 30, kind: 'BOUNCE_DRUM', bounceVelocity: -780 },
    { id: 'c2_upper', x: 1310, y: 255, w: 320, h: 36, kind: 'LIMESTONE', oneWay: true },
    { id: 'c2_lower', x: 1360, y: 540, w: 380, h: 180, kind: 'LIMESTONE' },
    // Grapple chasm
    { id: 'c2_island', x: 2140, y: 490, w: 340, h: 220, kind: 'LIMESTONE' },
    { id: 'c2_b2', x: 2570, y: 410, w: 210, h: 30, kind: 'BAMBOO_BRIDGE', oneWay: true },
    { id: 'c2_l2', x: 2880, y: 530, w: 460, h: 200, kind: 'LIMESTONE' },
    { id: 'c2_drum2', x: 3220, y: 500, w: 94, h: 30, kind: 'BOUNCE_DRUM', bounceVelocity: -760 },
    // High silk path to shrine
    { id: 'c2_top_l', x: 3390, y: 310, w: 260, h: 32, kind: 'BAMBOO_BRIDGE', oneWay: true },
    { id: 'c2_shrine', x: 4060, y: 490, w: 540, h: 230, kind: 'LIMESTONE' },
  ];

  const ch2Anchors: GrappleAnchor[] = [
    { id: 'c2_a1', x: 1855, y: 245, radius: 18 },
    { id: 'c2_a2', x: 2025, y: 235, radius: 18 },
    { id: 'c2_a3', x: 3760, y: 210, radius: 18 },
    { id: 'c2_a4', x: 3940, y: 225, radius: 18 },
  ];

  const ch2Collectibles: Collectible[] = [
    ...makeBeadArc('c2b1', 280, 550, 4, 52, 18),
    ...makeBeadArc('c2b2', 1350, 205, 4, 62, 12),
    ...makeBeadArc('c2b3', 1820, 390, 5, 58, 45),
    ...makeBeadArc('c2b4', 2940, 475, 4, 60, 20),
    ...makeBeadArc('c2b5', 3710, 345, 5, 65, 52),
    { id: 'c2_s1', x: 1470, y: 192, baseY: 192, kind: 'SHARD', collected: false, bobPhase: 0.4 },
    { id: 'c2_s2', x: 1940, y: 290, baseY: 290, kind: 'SHARD', collected: false, bobPhase: 1.4 },
    { id: 'c2_s3', x: 2675, y: 350, baseY: 350, kind: 'SHARD', collected: false, bobPhase: 2.2 },
    { id: 'c2_s4', x: 3850, y: 270, baseY: 270, kind: 'SHARD', collected: false, bobPhase: 3.1 },
    { id: 'c2_ackee', x: 2290, y: 440, baseY: 440, kind: 'ACKEE', collected: false, bobPhase: 1.1 },
  ];

  const ch2Enemies: Enemy[] = [
    makeEnemy('c2_e1', 'SNAKE', 1070, 416, 110),
    makeEnemy('c2_e2', 'HORNET', 1530, 390, 120),
    makeEnemy('c2_e3', 'TIGER_CUB', 2300, 448, 110),
    makeEnemy('c2_e4', 'HORNET', 2740, 280, 110),
    makeEnemy('c2_e5', 'TIGER_CUB', 3060, 488, 130),
    makeEnemy('c2_e6', 'SNAKE', 4220, 456, 100),
  ];

  // CHAPTER 3: BLUE MOUNTAIN PEAK & BREDDA TIGER'S HOLLOW (Boss Arena Finale!)
  const ch3Platforms: Platform[] = [
    { id: 'c3_start', x: 0, y: 590, w: 500, h: 180, kind: 'MOSS_BRANCH' },
    { id: 'c3_b1', x: 590, y: 505, w: 220, h: 30, kind: 'BAMBOO_BRIDGE', oneWay: true },
    { id: 'c3_mid', x: 900, y: 540, w: 320, h: 180, kind: 'MOSS_BRANCH' },
    // Grapple approach to Bredda Tiger's Hollow
    { id: 'c3_arena_floor', x: 1620, y: 580, w: 1240, h: 200, kind: 'LIMESTONE' },
    { id: 'c3_arena_l', x: 1740, y: 410, w: 220, h: 28, kind: 'BAMBOO_BRIDGE', oneWay: true },
    { id: 'c3_arena_c', x: 2130, y: 330, w: 220, h: 28, kind: 'BAMBOO_BRIDGE', oneWay: true },
    { id: 'c3_arena_r', x: 2520, y: 410, w: 220, h: 28, kind: 'BAMBOO_BRIDGE', oneWay: true },
    { id: 'c3_drum_l', x: 1660, y: 550, w: 86, h: 30, kind: 'BOUNCE_DRUM', bounceVelocity: -760 },
    { id: 'c3_drum_r', x: 2730, y: 550, w: 86, h: 30, kind: 'BOUNCE_DRUM', bounceVelocity: -760 },
  ];

  const ch3Anchors: GrappleAnchor[] = [
    { id: 'c3_a1', x: 1390, y: 265, radius: 18 },
    { id: 'c3_a2', x: 1990, y: 220, radius: 18 },
    { id: 'c3_a3', x: 2490, y: 220, radius: 18 },
  ];

  const ch3Collectibles: Collectible[] = [
    ...makeBeadArc('c3b1', 260, 540, 4, 50, 20),
    ...makeBeadArc('c3b2', 1310, 380, 4, 58, 42),
    { id: 'c3_s1', x: 700, y: 445, baseY: 445, kind: 'SHARD', collected: false, bobPhase: 0.2 },
    { id: 'c3_s2', x: 2240, y: 265, baseY: 265, kind: 'SHARD', collected: false, bobPhase: 1.5 },
    { id: 'c3_ackee_pre', x: 1060, y: 492, baseY: 492, kind: 'ACKEE', collected: false, bobPhase: 0.9 },
    { id: 'c3_ackee_boss', x: 2240, y: 525, baseY: 525, kind: 'ACKEE', collected: false, bobPhase: 2.1 },
  ];

  const ch3Enemies: Enemy[] = [
    makeEnemy('c3_e1', 'HORNET', 1050, 380, 120),
    makeEnemy('c3_boss', 'BREDDA_TIGER', 2460, 506, 460),
  ];

  const ch3Lanterns: LanternPillar[] = [
    { x: 1850, y: 580, h: 120, lit: true, sparkTimer: 0 },
    { x: 2630, y: 580, h: 120, lit: true, sparkTimer: 0 },
  ];

  return [
    {
      index: 0,
      title: 'Fern Gully Twilight',
      subtitle: 'Chapter I · The Whispering Canopy',
      width: 4520,
      height: 760,
      spawnX: 120,
      spawnY: 540,
      goalX: 4320,
      goalY: 520,
      isBossStage: false,
      palette: {
        skyTop: '#071614',
        skyMid: '#0F2E27',
        skyBottom: '#1B4938',
        moonColor: '#FBE8A6',
        ridgeFar: '#0C251F',
        ridgeMid: '#12362B',
        ridgeNear: '#174232',
        mistColor: 'rgba(130, 214, 182, 0.08)',
        accentGlow: '#F5B731',
        groundTint: '#254C36',
      },
      intro: {
        speaker: 'Bredda Anansi',
        speakerTitle: 'Master Weaver of Tales',
        portraitKey: 'anansi',
        proverb:
          '"When di story pot break, di forest go quiet — but six swift legs and one golden thread can mend what Tiger scatter."',
        objective:
          'Swing from Silk Blossoms, bind Bredda Snake in golden web, and gather the Calabash Shards to reach the Shrine.',
      },
      platforms: ch1Platforms,
      anchors: ch1Anchors,
      collectibles: ch1Collectibles,
      enemies: ch1Enemies,
      lanterns: [
        { x: 460, y: 610, h: 100, lit: true, sparkTimer: 0 },
        { x: 2220, y: 530, h: 100, lit: true, sparkTimer: 0 },
        { x: 4210, y: 520, h: 110, lit: true, sparkTimer: 0 },
      ],
    },
    {
      index: 1,
      title: 'Cockpit Country Caves',
      subtitle: 'Chapter II · Bioluminescent Limestone',
      width: 4620,
      height: 760,
      spawnX: 120,
      spawnY: 530,
      goalX: 4410,
      goalY: 490,
      isBossStage: false,
      palette: {
        skyTop: '#070E1C',
        skyMid: '#102238',
        skyBottom: '#18364A',
        moonColor: '#A8E6CF',
        ridgeFar: '#0B1728',
        ridgeMid: '#11253B',
        ridgeNear: '#163147',
        mistColor: 'rgba(94, 214, 200, 0.09)',
        accentGlow: '#4FD1C5',
        groundTint: '#274354',
      },
      intro: {
        speaker: 'Bredda Snake',
        speakerTitle: 'Keeper of the Deep Hollows',
        portraitKey: 'snake',
        proverb:
          '"No spider walk through Cockpit limestone without sharp eyes — watch di hornets’ sting and di tiger cubs’ leap."',
        objective:
          'Use Bounce Drums and high Silk Blossoms to cross the limestone chasms and claim four Calabash Shards.',
      },
      platforms: ch2Platforms,
      anchors: ch2Anchors,
      collectibles: ch2Collectibles,
      enemies: ch2Enemies,
      lanterns: [
        { x: 420, y: 600, h: 100, lit: true, sparkTimer: 0 },
        { x: 2200, y: 490, h: 100, lit: true, sparkTimer: 0 },
        { x: 4290, y: 490, h: 110, lit: true, sparkTimer: 0 },
      ],
    },
    {
      index: 2,
      title: "Blue Mountain Peak",
      subtitle: "Chapter III · Bredda Tiger's Hollow",
      width: 2920,
      height: 760,
      spawnX: 110,
      spawnY: 520,
      goalX: 2240,
      goalY: 580,
      isBossStage: true,
      palette: {
        skyTop: '#160D1E',
        skyMid: '#2D1A2E',
        skyBottom: '#5A2B2C',
        moonColor: '#FFD17A',
        ridgeFar: '#1E1226',
        ridgeMid: '#2F1B33',
        ridgeNear: '#3D2233',
        mistColor: 'rgba(245, 183, 49, 0.09)',
        accentGlow: '#F5B731',
        groundTint: '#4B2D2B',
      },
      intro: {
        speaker: 'Bredda Tiger',
        speakerTitle: 'Lord of the Mountain Ridge',
        portraitKey: 'tiger',
        proverb:
          '"Strength alone cannot hold di Golden Calabash, Tiger — wait till he roar and pounce, then wrap him tight in golden silk!"',
        objective:
          'Dodge Bredda Tiger’s pounces, spin Golden Silk when he pauses to catch his breath, then Dash or Stomp through him 4 times!',
      },
      platforms: ch3Platforms,
      anchors: ch3Anchors,
      collectibles: ch3Collectibles,
      enemies: ch3Enemies,
      lanterns: ch3Lanterns,
    },
  ];
}
