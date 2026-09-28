import { bucketTop, type World } from "@/game/world";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawSky(ctx: CanvasRenderingContext2D, world: World): void {
  const { w, h } = world;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#6EB6F0");
  sky.addColorStop(0.55, "#B9E4FF");
  sky.addColorStop(1, "#FFF3D4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const sunX = w * 0.8;
  const sunY = h * 0.14;
  ctx.fillStyle = "rgba(255, 214, 120, 0.35)";
  ctx.beginPath();
  ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFE08A";
  ctx.beginPath();
  ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.88)";
  for (const cloud of world.clouds) {
    const x = cloud.nx * w;
    const y = cloud.ny * h;
    const s = cloud.s;
    ctx.beginPath();
    ctx.ellipse(x, y, 30 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 24 * s, y + 4 * s, 22 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 22 * s, y + 6 * s, 18 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(ctx: CanvasRenderingContext2D, world: World): void {
  const y = world.h - 22;
  ctx.fillStyle = "#F3D7A1";
  ctx.fillRect(0, y, world.w, 22);
  ctx.fillStyle = "#E7C48A";
  ctx.fillRect(0, y, world.w, 3);
  for (const pebble of world.pebbles) {
    ctx.fillStyle = pebble.color;
    ctx.beginPath();
    ctx.ellipse(pebble.nx * world.w, world.h - 9, pebble.s, pebble.s * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShape(ctx: CanvasRenderingContext2D, item: World["items"][number]): void {
  ctx.save();
  ctx.translate(item.x, item.y + 6);
  ctx.fillStyle = "rgba(26, 35, 48, 0.12)";
  ctx.beginPath();
  ctx.ellipse(0, item.size * 0.42, item.size * 0.32, item.size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.rot);
  const s = item.size;
  ctx.fillStyle = item.color;
  if (item.kind === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
    ctx.fill();
    if (item.value > 1) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.stroke();
    }
  } else {
    roundRect(ctx, -s / 2, -s / 2, s, s, s * 0.2);
    ctx.fill();
    if (item.value > 1) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.stroke();
    }
  }
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.ellipse(-s * 0.12, -s * 0.16, s * 0.16, s * 0.09, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBucket(ctx: CanvasRenderingContext2D, world: World): void {
  const { bucket } = world;
  const bob = world.phase === "ready" ? Math.sin(world.clock * 2.2) * 3 : 0;
  const y = bucketTop(world) + bob;
  const { x, w, h, squash, tilt } = bucket;

  ctx.save();
  ctx.translate(x + 2, y + h + 8);
  ctx.fillStyle = "rgba(26, 35, 48, 0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.38, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x, y + h * 0.55);
  ctx.rotate(tilt);
  const sx = 1 + (1 - squash) * 0.42;
  ctx.scale(sx, squash);
  ctx.translate(-x, -(y + h * 0.55));

  ctx.beginPath();
  ctx.strokeStyle = "#E36B4A";
  ctx.lineWidth = Math.max(4, w * 0.045);
  ctx.lineCap = "round";
  ctx.arc(x, y + 6, w * 0.22, Math.PI, 0, true);
  ctx.stroke();

  const topW = w;
  const botW = w * 0.76;
  const lip = y + 8;
  const bot = y + h;
  ctx.beginPath();
  ctx.moveTo(x - topW / 2, lip);
  ctx.lineTo(x + topW / 2, lip);
  ctx.lineTo(x + botW / 2, bot);
  ctx.quadraticCurveTo(x, bot + 8, x - botW / 2, bot);
  ctx.closePath();
  ctx.fillStyle = "#F7F1E6";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - 7, lip + 4);
  ctx.lineTo(x - 4, bot - 4);
  ctx.lineTo(x + 8, bot - 4);
  ctx.lineTo(x + 5, lip + 4);
  ctx.closePath();
  ctx.fillStyle = "#F0A08A";
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x, lip, topW / 2, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#E36B4A";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, lip, topW / 2 - 7, 5.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#243140";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - 4, lip - 1, topW / 2 - 14, 2.4, 0, Math.PI, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function drawFx(ctx: CanvasRenderingContext2D, world: World): void {
  for (const particle of world.particles) {
    if (!particle.alive) continue;
    ctx.globalAlpha = Math.max(0, particle.life / particle.max);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 18px Outfit, system-ui, sans-serif";
  for (const floater of world.floaters) {
    if (!floater.alive) continue;
    ctx.globalAlpha = Math.max(0, floater.life / floater.max);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(20, 24, 28, 0.55)";
    ctx.strokeText(floater.text, floater.x, floater.y);
    ctx.fillStyle = floater.color;
    ctx.fillText(floater.text, floater.x, floater.y);
  }
  ctx.globalAlpha = 1;
}

export function drawWorld(ctx: CanvasRenderingContext2D, world: World): void {
  const shake = world.reduceMotion ? 0 : world.trauma * world.trauma;
  const ox = Math.sin(world.shakeT * 47) * 5 * shake;
  const oy = Math.cos(world.shakeT * 39) * 3 * shake;

  drawSky(ctx, world);
  drawGround(ctx, world);

  ctx.save();
  ctx.translate(ox, oy);
  for (const item of world.items) {
    if (item.alive) drawShape(ctx, item);
  }
  drawBucket(ctx, world);
  drawFx(ctx, world);
  ctx.restore();
}
