const maxPointDistance = 0.5;

/** Bezier points for a seven point circle, to 3 decimal places */
// prettier-ignore
const sevenPointCircle = new Float64Array([
  -0.304, -1, 0, -1, 0.304, -1,
  0.592, -0.861, 0.782, -0.623, 0.972, -0.386,
  1.043, -0.074, 0.975, 0.223, 0.907, 0.519,
  0.708, 0.769, 0.434, 0.901, 0.16, 1.033,
  -0.16, 1.033, -0.434, 0.901, -0.708, 0.769,
  -0.907, 0.519, -0.975, 0.223, -1.043, -0.074,
  -0.972, -0.386, -0.782, -0.623, -0.592, -0.861,
]);
const entriesPerPoint = 6;

// This is reused for all blob points to reduce GC.
const blobPoints = new Float64Array(sevenPointCircle.length);

/*
// Here's how I created the above (although DOMMatrix isn't available in worklets):

function createBezierCirclePoints(points) {
  const anglePerPoint = 360 / points;
  const matrix = new DOMMatrix();
  const point = new DOMPoint();
  const controlDistance = (4 / 3) * Math.tan(Math.PI / (2 * points));
  return Array.from({ length: points }, (_, i) => {
    point.x = -controlDistance;
    point.y = -1;
    const cp1 = point.matrixTransform(matrix);
    point.x = 0;
    point.y = -1;
    const p = point.matrixTransform(matrix);
    point.x = controlDistance;
    point.y = -1;
    const cp2 = point.matrixTransform(matrix);
    const basePoint = [cp1.x, cp1.y, p.x, p.y, cp2.x, cp2.y];
    matrix.rotateSelf(0, 0, anglePerPoint);
    return basePoint;
  });
}
*/

function drawPoints(ctx) {
  ctx.beginPath();
  ctx.moveTo(blobPoints[2], blobPoints[3]);
  for (let i = 0; i < blobPoints.length; i += entriesPerPoint) {
    const nextI =
      i + entriesPerPoint === blobPoints.length ? 0 : i + entriesPerPoint;

    ctx.bezierCurveTo(
      blobPoints[i + 4],
      blobPoints[i + 5],
      blobPoints[nextI],
      blobPoints[nextI + 1],
      blobPoints[nextI + 2],
      blobPoints[nextI + 3],
    );
  }

  ctx.closePath();
}

function drawBlob(ctx, random, x, y, size, color) {
  // Reset points
  blobPoints.set(sevenPointCircle);

  // Randomly shift the points a bit
  for (let i = 0; i < blobPoints.length; i += entriesPerPoint) {
    const distance = random.next() * maxPointDistance;
    const angle = random.next() * Math.PI * 2;
    const xShift = Math.sin(angle) * distance;
    const yShift = Math.cos(angle) * distance;
    blobPoints[i] += xShift;
    blobPoints[i + 1] += yShift;
    blobPoints[i + 2] += xShift;
    blobPoints[i + 3] += yShift;
    blobPoints[i + 4] += xShift;
    blobPoints[i + 5] += yShift;
  }

  ctx.fillStyle = color;
  ctx.setTransform(size, 0, 0, size, x, y);
  drawPoints(ctx);
  ctx.fill();
  ctx.resetTransform();
}

class Mulberry32 {
  constructor(seed) {
    this.state = seed;
  }

  next() {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    var t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextBetween(from, to) {
    return from + (to - from) * this.next();
  }

  fork() {
    return new Mulberry32(this.next() * 2 ** 32);
  }
}

registerPaint(
  'fleck',
  class {
    static inputProperties = [
      '--fleck-seed',
      '--fleck-cell-size',
      '--fleck-density',
      '--fleck-size-base',
      '--fleck-colors',
    ];

    paint(ctx, size, props) {
      const width = size.width;
      const height = size.height;
      const seed = props.get('--fleck-seed').value;
      const cellSize = props.get('--fleck-cell-size').value;
      const count = props.get('--fleck-density').value;
      const baseSize = props.get('--fleck-size-base').value;
      const colors = props.getAll('--fleck-colors').map((s) => s.toString());

      const randomX = new Mulberry32(seed);

      for (let x = 0; x < width; x += cellSize) {
        const randomY = randomX.fork();

        for (let y = 0; y < height; y += cellSize) {
          const randomItem = randomY.fork();

          for (let i = 0; i < count; i++) {
            let radius = baseSize;
            if (randomItem.next() > 0.125) radius /= 2;
            if (randomItem.next() > 0.925) radius *= 4;
            radius = Math.max(1, Math.min(radius, 24));
            radius *= 0.7;

            const color =
              colors[Math.floor(randomItem.nextBetween(0, colors.length))];

            drawBlob(
              ctx,
              randomItem,
              x + randomItem.nextBetween(0, cellSize),
              y + randomItem.nextBetween(0, cellSize),
              radius,
              color,
            );
          }
        }
      }
    }
  },
);
