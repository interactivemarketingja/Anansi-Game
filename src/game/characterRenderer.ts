import { AfterImage, Enemy, PlayerState } from './types';

function drawTwoSegmentLimb(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness: number,
  fillColor: string,
  highlightColor: string
) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Dark silhouette outline
  ctx.strokeStyle = '#0A0908';
  ctx.lineWidth = thickness + 3.5;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Main dark mahogany limb
  ctx.strokeStyle = fillColor;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Subtle rim highlight along upper edge
  ctx.strokeStyle = highlightColor;
  ctx.lineWidth = Math.max(1.2, thickness * 0.28);
  ctx.beginPath();
  ctx.moveTo(x0, y0 - 0.8);
  ctx.lineTo(x1, y1 - 0.8);
  ctx.stroke();

  // Joint bead
  ctx.fillStyle = '#D99B38';
  ctx.beginPath();
  ctx.arc(x1, y1, thickness * 0.34, 0, Math.PI * 2);
  ctx.fill();
}

export function drawAnansiAfterImages(
  ctx: CanvasRenderingContext2D,
  afterImages: AfterImage[]
) {
  for (const img of afterImages) {
    const alpha = Math.max(0, (img.life / img.maxLife) * 0.42);
    ctx.save();
    ctx.translate(img.x, img.y);
    ctx.scale(img.facing * img.scaleX * 1.55, img.scaleY * 1.55);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#F5B731';
    ctx.beginPath();
    ctx.ellipse(-6, 4, 15, 13, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(3, -12, 12, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawAnansiCharacter(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  time: number
) {
  const cx = player.x + player.w * 0.5;
  const cy = player.y + player.h * 0.55;

  // Flicker slightly during invulnerability frames
  if (player.invulnTimer > 0 && Math.floor(player.invulnTimer * 24) % 2 === 1 && player.hitFlashTimer <= 0) {
    ctx.save();
    ctx.globalAlpha = 0.52;
    renderAnansiRig(ctx, player, cx, cy, time);
    ctx.restore();
    return;
  }

  renderAnansiRig(ctx, player, cx, cy, time);
}

function renderAnansiRig(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  cx: number,
  cy: number,
  time: number
) {
  // 1. Flowing crimson-and-gold silk sash (world space coordinates)
  if (player.sashPoints.length >= 2) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < player.sashPoints.length - 1; i++) {
      const p0 = player.sashPoints[i];
      const p1 = player.sashPoints[i + 1];
      const t = i / (player.sashPoints.length - 1);
      ctx.strokeStyle = '#9D2A2B';
      ctx.lineWidth = (1 - t * 0.6) * 11.5;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      ctx.strokeStyle = '#F5B731';
      ctx.lineWidth = (1 - t * 0.65) * 3.2;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  // Anchor squash & stretch at feet
  const feetY = player.y + player.h;
  ctx.translate(cx, feetY);
  const tilt = player.grappleAnchor
    ? Math.max(-0.35, Math.min(0.35, player.vx * 0.0006))
    : Math.max(-0.18, Math.min(0.18, player.vx * 0.00032));
  ctx.rotate(tilt);
  ctx.scale(player.facing * player.scaleX * 1.55, player.scaleY * 1.55);
  ctx.translate(0, -20);

  const isRunning = player.grounded && Math.abs(player.vx) > 22;
  const speedRatio = Math.min(1, Math.abs(player.vx) / 310);
  const idleBob = player.grounded && !isRunning ? Math.sin(time * 4.2) * 1.8 : 0;

  // 2. Back legs (2 articulated legs behind torso)
  const stride = player.stridePhase;
  for (let i = 0; i < 2; i++) {
    const phase = stride + i * Math.PI;
    const stepX = isRunning ? Math.sin(phase) * 13 * speedRatio : (i === 0 ? -10 : 8);
    const stepLift = isRunning ? Math.max(0, -Math.cos(phase)) * 7 * speedRatio : 0;
    const airTuck = !player.grounded ? -5 : 0;

    const hipX = i === 0 ? -6 : 4;
    const hipY = 6 + idleBob * 0.4;
    const footX = (i === 0 ? -16 : 13) + stepX;
    const footY = 23 - stepLift + airTuck;
    const kneeX = (hipX + footX) * 0.5 + (i === 0 ? -6 : 7);
    const kneeY = Math.min(hipY, footY) - 9;

    drawTwoSegmentLimb(ctx, hipX, hipY, kneeX, kneeY, footX, footY, 4.4, '#2A1B14', '#5A3B2B');
  }

  // 3. Spider Abdomen (back velvet roundness with Adinkra gold spiral)
  ctx.save();
  ctx.translate(-12, 3 + idleBob * 0.6);
  ctx.rotate(-0.18 + Math.sin(time * 5) * 0.03);
  ctx.fillStyle = '#0A0908';
  ctx.beginPath();
  ctx.ellipse(0, 0, 14.5, 12.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const abdGrad = ctx.createRadialGradient(-3, -4, 2, 0, 0, 14);
  abdGrad.addColorStop(0, '#5A3A28');
  abdGrad.addColorStop(0.55, '#331F16');
  abdGrad.addColorStop(1, '#1A0F0A');
  ctx.fillStyle = abdGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12.5, 10.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gold Ananse Ntontan web mark on abdomen
  ctx.strokeStyle = 'rgba(245, 183, 49, 0.72)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(-2, -1, 5.2, 0, Math.PI * 2);
  ctx.moveTo(-7, -1);
  ctx.lineTo(3, -1);
  ctx.moveTo(-2, -6);
  ctx.lineTo(-2, 4);
  ctx.stroke();
  ctx.restore();

  // 4. Dapper Emerald-and-Gold Brocade Waistcoat Torso
  ctx.save();
  ctx.translate(1, idleBob * 0.5);

  // Coat outline
  ctx.fillStyle = '#0A0908';
  ctx.beginPath();
  ctx.ellipse(0, 3, 12.2, 13.5, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Emerald brocade coat
  const vestGrad = ctx.createLinearGradient(-8, -10, 10, 15);
  vestGrad.addColorStop(0, '#1D7A58');
  vestGrad.addColorStop(0.65, '#11513B');
  vestGrad.addColorStop(1, '#0B3325');
  ctx.fillStyle = vestGrad;
  ctx.beginPath();
  ctx.ellipse(0, 3, 10.4, 11.8, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Warm cream shirt V-collar
  ctx.fillStyle = '#F3E5C8';
  ctx.beginPath();
  ctx.moveTo(1, -8);
  ctx.lineTo(8, -6);
  ctx.lineTo(4, 3);
  ctx.closePath();
  ctx.fill();

  // Gold brocade trim & brass buttons
  ctx.strokeStyle = '#F5B731';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(4, 2);
  ctx.lineTo(3, 13);
  ctx.stroke();

  ctx.fillStyle = '#FFD97D';
  for (let b = 0; b < 3; b++) {
    ctx.beginPath();
    ctx.arc(4.2, 3.5 + b * 3.5, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 5. Front walking legs (2 articulated foreground legs)
  for (let i = 0; i < 2; i++) {
    const phase = stride + (i === 0 ? 0.8 : 0.8 + Math.PI);
    const stepX = isRunning ? Math.sin(phase) * 14 * speedRatio : (i === 0 ? -4 : 14);
    const stepLift = isRunning ? Math.max(0, -Math.cos(phase)) * 8 * speedRatio : 0;
    const airTuck = !player.grounded ? -4 : 0;

    const hipX = i === 0 ? -2 : 7;
    const hipY = 8 + idleBob * 0.4;
    const footX = (i === 0 ? -9 : 18) + stepX;
    const footY = 24 - stepLift + airTuck;
    const kneeX = (hipX + footX) * 0.5 + (i === 0 ? -5 : 7);
    const kneeY = Math.min(hipY, footY) - 10;

    drawTwoSegmentLimb(ctx, hipX, hipY, kneeX, kneeY, footX, footY, 4.8, '#3B251B', '#7B503B');
  }

  // 6. Expressive Head
  ctx.save();
  ctx.translate(3, -12 + idleBob * 0.8);

  // Head silhouette
  ctx.fillStyle = '#0A0908';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12.6, 11.4, 0, 0, Math.PI * 2);
  ctx.fill();

  const headGrad = ctx.createRadialGradient(2, -3, 2, 0, 0, 12);
  headGrad.addColorStop(0, '#6B4633');
  headGrad.addColorStop(0.6, '#432A1D');
  headGrad.addColorStop(1, '#26160E');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 9.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Clever grin & tiny trickster mandibles
  ctx.strokeStyle = '#F5C469';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (player.expression === 'SURPRISED') {
    ctx.ellipse(5, 4.5, 2.2, 2.6, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(4.5, 3, 4.2, 0.15, Math.PI * 0.72);
  }
  ctx.stroke();

  // Small subtle mandibles
  ctx.fillStyle = '#E6B87A';
  ctx.beginPath();
  ctx.moveTo(1.5, 6);
  ctx.lineTo(2.8, 9.5);
  ctx.lineTo(4.2, 6.4);
  ctx.closePath();
  ctx.fill();

  // Expressive Golden-Amber Eyes (with blinking!)
  const eyeScaleY = player.isBlinking ? 0.14 : player.expression === 'GRIN' ? 0.78 : 1;
  // Back eye
  drawSpiderEye(ctx, 8.2, -1.8, 3.1, eyeScaleY);
  // Hero front eye
  drawSpiderEye(ctx, 2.2, -1.2, 4.0, eyeScaleY);

  // 7. Jaunty Woven Jamaican Straw Fedora Hat
  ctx.save();
  ctx.translate(-1, -8.5);
  ctx.rotate(-0.12 + player.hatTilt);

  // Hat brim outline
  ctx.fillStyle = '#0A0908';
  ctx.beginPath();
  ctx.ellipse(1, 1, 17.5, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Woven straw crown
  const strawGrad = ctx.createLinearGradient(-10, -13, 10, 2);
  strawGrad.addColorStop(0, '#F6D37A');
  strawGrad.addColorStop(0.55, '#D49E3D');
  strawGrad.addColorStop(1, '#9E6D22');
  ctx.fillStyle = strawGrad;
  ctx.strokeStyle = '#0A0908';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.quadraticCurveTo(-8, -12, 0, -11.5);
  ctx.quadraticCurveTo(8.5, -12, 9.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crimson & emerald hatband
  ctx.fillStyle = '#A62B28';
  ctx.fillRect(-8.6, -3.5, 17.6, 3);
  ctx.fillStyle = '#1E825C';
  ctx.fillRect(-8.6, -1.5, 17.6, 1.3);

  // Feather tucked into band
  ctx.fillStyle = '#F5B731';
  ctx.beginPath();
  ctx.ellipse(-7.5, -7.5, 2.2, 6, -0.45, 0, Math.PI * 2);
  ctx.fill();

  // Woven straw brim
  ctx.fillStyle = '#E8BE5D';
  ctx.beginPath();
  ctx.ellipse(1, 0.8, 16, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9E6D22';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
  ctx.restore(); // End head

  // 8. Two Expressive Upper Arms (reaching for grapple silk or poised for tricks)
  const shoulderX = 3;
  const shoulderY = -1 + idleBob * 0.5;
  if (player.grappleAnchor) {
    // Arm reaches upward toward grapple thread
    drawTwoSegmentLimb(ctx, shoulderX, shoulderY, 10, -13, 14, -24, 3.9, '#3B251B', '#8A5A42');
    drawTwoSegmentLimb(ctx, shoulderX - 5, shoulderY + 2, -13, 3, -18, 9, 3.6, '#2A1B14', '#5A3B2B');
  } else if (player.silkCooldown > 0.14) {
    // Forward silk-casting flourish!
    drawTwoSegmentLimb(ctx, shoulderX, shoulderY, 13, -4, 23, -7, 4.0, '#3B251B', '#8A5A42');
    drawTwoSegmentLimb(ctx, shoulderX - 4, shoulderY + 2, -11, -3, -15, 5, 3.6, '#2A1B14', '#5A3B2B');
  } else {
    const armSwing = isRunning ? Math.sin(stride) * 7 : Math.sin(time * 3.5) * 2;
    drawTwoSegmentLimb(
      ctx,
      shoulderX,
      shoulderY,
      10 + armSwing * 0.4,
      3,
      15 + armSwing,
      7,
      3.9,
      '#3B251B',
      '#8A5A42'
    );
    drawTwoSegmentLimb(
      ctx,
      shoulderX - 5,
      shoulderY + 2,
      -9 - armSwing * 0.3,
      4,
      -13 - armSwing * 0.6,
      9,
      3.5,
      '#2A1B14',
      '#5A3B2B'
    );
  }

  // White hit-flash overlay if injured
  if (player.hitFlashTimer > 0) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255, 240, 220, 0.72)';
    ctx.fillRect(-35, -45, 70, 90);
  }

  ctx.restore();
}

function drawSpiderEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  scaleY: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, scaleY);

  // Eye socket
  ctx.fillStyle = '#0D0907';
  ctx.beginPath();
  ctx.arc(0, 0, r + 1.1, 0, Math.PI * 2);
  ctx.fill();

  // Warm amber iris
  const eyeGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0.5, 0, 0, r);
  eyeGrad.addColorStop(0, '#FFE38E');
  eyeGrad.addColorStop(0.55, '#F59E0B');
  eyeGrad.addColorStop(1, '#92400E');
  ctx.fillStyle = eyeGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Pupil + expressive catchlight
  ctx.fillStyle = '#140B06';
  ctx.beginPath();
  ctx.arc(r * 0.22, 0, r * 0.46, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-r * 0.28, -r * 0.35, r * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawEnemyCharacter(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  time: number
) {
  if (enemy.state === 'DEFEATED') return;

  ctx.save();
  const cx = enemy.x + enemy.w * 0.5;
  const cy = enemy.y + enemy.h * 0.5;
  ctx.translate(cx, cy);
  ctx.scale(enemy.facing, 1);

  if (enemy.kind === 'SNAKE') {
    ctx.save();
    ctx.scale(1.5, 1.5);
    drawBreddaSnake(ctx, enemy, time);
    ctx.restore();
  } else if (enemy.kind === 'HORNET') {
    ctx.save();
    ctx.scale(1.5, 1.5);
    drawSkyHornet(ctx, enemy, time);
    ctx.restore();
  } else if (enemy.kind === 'TIGER_CUB') {
    drawTigerRig(ctx, enemy, time, false);
  } else if (enemy.kind === 'BREDDA_TIGER') {
    drawTigerRig(ctx, enemy, time, true);
  }

  // Golden Silk Cocoon Wraps when Silk-Bound!
  if (enemy.state === 'SILK_BOUND') {
    drawSilkCocoonOverlay(ctx, enemy, time);
  }

  // Telegraph warning diamond above head before strike
  if (enemy.state === 'TELEGRAPH') {
    ctx.scale(enemy.facing, 1); // unflip for crisp upright icon
    const pulse = 1 + Math.sin(time * 28) * 0.16;
    ctx.save();
    ctx.translate(0, -enemy.h * 0.72);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#E85D3F';
    ctx.strokeStyle = '#FFF3C4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Hit flash
  if (enemy.hitFlashTimer > 0) {
    ctx.fillStyle = 'rgba(255, 250, 230, 0.68)';
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.w * 0.55, enemy.h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBreddaSnake(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
  const wave = Math.sin(time * 6 + enemy.animPhase);
  const coiled = enemy.state === 'TELEGRAPH';

  // Sinuous multi-segment emerald & gold body
  const segCount = 6;
  for (let i = segCount - 1; i >= 0; i--) {
    const t = i / segCount;
    const sx = coiled ? -16 + i * 3.5 : -24 + i * 7.5;
    const sy = coiled ? 6 - i * 2.2 : 8 + Math.sin(time * 7 + i * 0.9) * 4;
    const r = 10.5 - t * 3.5;

    ctx.fillStyle = '#07140E';
    ctx.beginPath();
    ctx.arc(sx, sy, r + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = i % 2 === 0 ? '#1E8259' : '#D8A334';
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Raised Serpent Head
  const headX = coiled ? 14 : 18;
  const headY = coiled ? -9 : -2 + wave * 2.5;
  ctx.fillStyle = '#07140E';
  ctx.beginPath();
  ctx.ellipse(headX, headY, 13, 10, -0.1, 0, Math.PI * 2);
  ctx.fill();

  const headGrad = ctx.createLinearGradient(headX - 8, headY - 8, headX + 10, headY + 8);
  headGrad.addColorStop(0, '#2AA673');
  headGrad.addColorStop(1, '#11583C');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(headX, headY, 11, 8.2, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Golden slit eye
  ctx.fillStyle = enemy.state === 'TELEGRAPH' ? '#FF5E3A' : '#F5C443';
  ctx.beginPath();
  ctx.ellipse(headX + 4, headY - 2, 3.3, 2.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0A0908';
  ctx.fillRect(headX + 3.6, headY - 4.2, 1.3, 4.4);

  // Forked tongue flick
  if (Math.sin(time * 9 + enemy.animPhase) > 0.35 || enemy.state === 'ATTACK') {
    ctx.strokeStyle = '#E85D3F';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(headX + 10, headY + 1);
    ctx.lineTo(headX + 18, headY + 1);
    ctx.lineTo(headX + 21, headY - 2);
    ctx.moveTo(headX + 18, headY + 1);
    ctx.lineTo(headX + 21, headY + 4);
    ctx.stroke();
  }
}

function drawSkyHornet(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
  const wingBeat = Math.sin(time * 42 + enemy.animPhase);

  // Translucent iridescent wings
  ctx.save();
  ctx.translate(-3, -10);
  ctx.rotate(-0.4 + wingBeat * 0.45);
  ctx.fillStyle = 'rgba(205, 244, 238, 0.55)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(-4, -9, 7, 13, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Striped amber-obsidian abdomen
  ctx.fillStyle = '#0B0B0D';
  ctx.beginPath();
  ctx.ellipse(-8, 2, 14, 10, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.ellipse(-6, 2, 9, 8.2, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#18181B';
  ctx.fillRect(-10, -5, 4, 14);

  // Sharp stinger
  ctx.fillStyle = enemy.state === 'TELEGRAPH' ? '#FF5E3A' : '#E5E7EB';
  ctx.beginPath();
  ctx.moveTo(-20, 4);
  ctx.lineTo(-27, 7);
  ctx.lineTo(-19, 8);
  ctx.closePath();
  ctx.fill();

  // Head & glowing eye
  ctx.fillStyle = '#1F2937';
  ctx.beginPath();
  ctx.arc(9, -1, 8.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = enemy.state === 'TELEGRAPH' ? '#FF4D36' : '#FBBF24';
  ctx.beginPath();
  ctx.ellipse(12, -2, 3.6, 4.4, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawTigerRig(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  time: number,
  isBoss: boolean
) {
  const s = isBoss ? 2.18 : 1.34;
  ctx.save();
  ctx.scale(s, s);

  const crouch = enemy.state === 'TELEGRAPH' ? 6 : 0;
  const stride = Math.sin(time * 9 + enemy.animPhase);
  const moving = Math.abs(enemy.vx) > 20;

  // Swishing striped tail
  ctx.strokeStyle = '#0D0806';
  ctx.lineWidth = 8.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-22, -2 + crouch);
  ctx.quadraticCurveTo(-36, -10 + Math.sin(time * 5) * 6, -40, -22 + Math.cos(time * 5) * 5);
  ctx.stroke();
  ctx.strokeStyle = '#D96B27';
  ctx.lineWidth = 5.5;
  ctx.stroke();

  // Back legs
  const legOffset = moving ? stride * 9 : 0;
  drawTigerLeg(ctx, -15 - legOffset * 0.7, 10 + crouch, '#A84819');
  drawTigerLeg(ctx, 13 + legOffset * 0.7, 10 + crouch, '#A84819');

  // Muscular torso
  ctx.fillStyle = '#0D0806';
  ctx.beginPath();
  ctx.ellipse(0, 2 + crouch, 27, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  const furGrad = ctx.createLinearGradient(0, -15 + crouch, 0, 18 + crouch);
  furGrad.addColorStop(0, '#EA7A2C');
  furGrad.addColorStop(0.65, '#C8581E');
  furGrad.addColorStop(1, '#F3DFC1');
  ctx.fillStyle = furGrad;
  ctx.beginPath();
  ctx.ellipse(0, 2 + crouch, 25, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bold obsidian tiger stripes
  ctx.fillStyle = '#150E0B';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 8 - 2, -12 + crouch);
    ctx.lineTo(i * 8 + 2, -12 + crouch);
    ctx.lineTo(i * 8, 2 + crouch);
    ctx.closePath();
    ctx.fill();
  }

  // Front legs
  drawTigerLeg(ctx, -11 + legOffset, 12 + crouch, '#D96B27');
  drawTigerLeg(ctx, 16 - legOffset, 12 + crouch, '#D96B27');

  // Antique Brass Story-Bell Collar (signature folklore boss motif!)
  ctx.strokeStyle = '#C9962C';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.arc(17, 0 + crouch, 11, -0.8, 1.3);
  ctx.stroke();
  if (isBoss) {
    ctx.fillStyle = '#FFD15C';
    ctx.beginPath();
    ctx.arc(24, 9 + crouch, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1A110B';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Proud Tiger Head
  ctx.save();
  ctx.translate(22, -7 + crouch * 0.7);
  ctx.fillStyle = '#0D0806';
  ctx.beginPath();
  ctx.arc(0, 0, 15.5, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#D96B27';
  ctx.beginPath();
  ctx.arc(-9, -12, 4.8, 0, Math.PI * 2);
  ctx.arc(5, -13, 4.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#E8772E';
  ctx.beginPath();
  ctx.arc(0, 0, 13.8, 0, Math.PI * 2);
  ctx.fill();

  // Cream muzzle
  ctx.fillStyle = '#F5E6CC';
  ctx.beginPath();
  ctx.ellipse(6, 5, 7.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Roaring jaw during telegraph / attack
  if (enemy.state === 'TELEGRAPH' || enemy.state === 'ATTACK') {
    ctx.fillStyle = '#5B1418';
    ctx.beginPath();
    ctx.ellipse(7, 9, 5, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Fangs
    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.moveTo(4, 6);
    ctx.lineTo(5.5, 10);
    ctx.lineTo(7, 6);
    ctx.moveTo(9, 6);
    ctx.lineTo(10.5, 10);
    ctx.lineTo(12, 6);
    ctx.fill();
  }

  // Nose
  ctx.fillStyle = '#B84A4A';
  ctx.beginPath();
  ctx.moveTo(9, 1);
  ctx.lineTo(13, 2);
  ctx.lineTo(10.5, 4.5);
  ctx.closePath();
  ctx.fill();

  // Piercing amber eyes
  ctx.fillStyle = enemy.state === 'TELEGRAPH' ? '#FF4528' : '#FFCA3A';
  ctx.beginPath();
  ctx.ellipse(5, -4, 3.4, 2.5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#120A07';
  ctx.beginPath();
  ctx.arc(5.8, -4, 1.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

function drawTigerLeg(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = '#0D0806';
  ctx.beginPath();
  ctx.roundRect(x - 4.5, y - 4, 9, 16, 4);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 3, y - 3, 6, 14, 3);
  ctx.fill();
}

function drawSilkCocoonOverlay(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
  const rx = enemy.w * 0.56;
  const ry = enemy.h * 0.56;
  ctx.save();
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 2.6;
  ctx.shadowColor = '#F5B731';
  ctx.shadowBlur = 10;

  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry * 0.45, i * 0.35 + Math.sin(time * 4) * 0.04, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
