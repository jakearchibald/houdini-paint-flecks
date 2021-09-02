const maxPointDistance = 0.5;

function randomizePoint(point, random) {
  const distance = random.next() * maxPointDistance;
  const angle = random.next() * Math.PI * 2;
  const xShift = Math.sin(angle) * distance;
  const yShift = Math.cos(angle) * distance;
  return [
    point[0] + xShift,
    point[1] + yShift,
    point[2] + xShift,
    point[3] + yShift,
    point[4] + xShift,
    point[5] + yShift,
  ];
}

/** Bezier points for a seven point circle, to 3 decimal places */
const sevenPointCircle = [
  [-0.304, -1, 0, -1, 0.304, -1],
  [0.592, -0.861, 0.782, -0.623, 0.972, -0.386],
  [1.043, -0.074, 0.975, 0.223, 0.907, 0.519],
  [0.708, 0.769, 0.434, 0.901, 0.16, 1.033],
  [-0.16, 1.033, -0.434, 0.901, -0.708, 0.769],
  [-0.907, 0.519, -0.975, 0.223, -1.043, -0.074],
  [-0.972, -0.386, -0.782, -0.623, -0.592, -0.861],
];

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

function drawPoints(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][2], points[0][3]);
  for (let i = 0; i < points.length; i++) {
    const nextI = i === points.length - 1 ? 0 : i + 1;
    ctx.bezierCurveTo(
      points[i][4],
      points[i][5],
      points[nextI][0],
      points[nextI][1],
      points[nextI][2],
      points[nextI][3],
    );
  }
  ctx.closePath();
}

function drawBlob(ctx, { random, x, y, size, color }) {
  const points = sevenPointCircle.map((point) => randomizePoint(point, random));
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(x, y);
  ctx.scale(size, size);
  drawPoints(ctx, points);
  ctx.fill();
  ctx.restore();
}

function createRandom(seed) {
  let state = seed;

  const next = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    var t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    nextBetween: (from, to) => next() * (to - from) + from,
    fork: () => createRandom(next() * 2 ** 32),
  };
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

      const randomX = createRandom(seed);

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

            drawBlob(ctx, {
              random: randomItem,
              x: x + randomItem.nextBetween(0, cellSize),
              y: y + randomItem.nextBetween(0, cellSize),
              size: radius,
              color,
            });
          }
        }
      }
    }
  },
);
