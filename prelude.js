/**
 * Replicad Prelude
 */

export function fuseAll(shapes) {
  let result = shapes[0];
  shapes.slice(1).forEach((shape) => {
    result = result.fuse(shape);
  });
  return result;
}

export function cutAll(target, shapes) {
  let result = target;
  shapes.forEach((shape) => {
    result = result.cut(shape);
  });
  return result;
}

export function polarCopies(shape, count, radius) {
  const base = shape.translate(0, radius);
  const angle = 360 / count;

  const copies = [];
  for (let i = 0; i < count; i++) {
    copies.push(base.clone().rotate(i * angle));
  }
  return copies;
}

export class RNG {
  /**
   * Creates a new seeded random number generator.
   * @param {number} [seed] - The initial seed.
   */
  constructor(seed = Math.random() * 0xffffffff) {
    this.state = seed;
  }

  /**
   * Generates a pseudorandom double between 0 (inclusive) and 1 (exclusive).
   * @returns {number} A value between 0 and 1.
   */
  uniform() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer between min (inclusive) and max (exclusive).
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  uniformInt(min, max) {
    return Math.floor(this.uniform() * (max - min) + min);
  }

  /**
   * Returns a random element from the provided array.
   * @template T
   * @param {T[]} array
   * @returns {T}
   */
  choice(array) {
    return array[this.uniformInt(0, array.length)];
  }

  /**
   * Generates a random number following a Gaussian distribution.
   * Uses the Box-Muller transform.
   * @param {number} [mean=0] - mean
   * @param {number} [sd=1] - standard deviation
   * @returns {number}
   */
  gaussian(mean = 0, sd = 1) {
    const u = 1 - this.uniform();
    const v = this.uniform();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * sd + mean;
  }

  /**
   * Generates a random number following a Poisson distribution.
   * Uses Knuth's algorithm.
   * @param {number} lambda - The average number of events (mean).
   * @returns {number}
   */
  poisson(lambda) {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= this.uniform();
    } while (p > L);
    return k - 1;
  }

  /**
   * Generates points using Poisson disc sampling (Bridson's algorithm).
   * Creates evenly-spaced random points with a minimum distance constraint.
   * @param {number} width - Width of the sampling area
   * @param {number} height - Height of the sampling area
   * @param {number} radius - Minimum distance between points
   * @param {number} [k=30] - Number of attempts before rejecting a point
   * @returns {number[][]} Array of [x, y] points
   */
  poissonDisc(width, height, radius, k = 30) {
    const cellSize = radius / Math.sqrt(2);
    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);
    const grid = new Array(gridWidth * gridHeight).fill(null);
    const points = [];
    const active = [];

    // Helper to convert point to grid coordinates
    const gridIndex = (x, y) => {
      const i = Math.floor(x / cellSize);
      const j = Math.floor(y / cellSize);
      return i + j * gridWidth;
    };

    // Helper to check if a point is valid
    const isValid = (x, y) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return false;

      const i = Math.floor(x / cellSize);
      const j = Math.floor(y / cellSize);

      // Check neighboring cells
      const i0 = Math.max(i - 2, 0);
      const i1 = Math.min(i + 3, gridWidth);
      const j0 = Math.max(j - 2, 0);
      const j1 = Math.min(j + 3, gridHeight);

      for (let jj = j0; jj < j1; jj++) {
        for (let ii = i0; ii < i1; ii++) {
          const neighbor = grid[ii + jj * gridWidth];
          if (neighbor !== null) {
            const [nx, ny] = points[neighbor];
            const dx = x - nx;
            const dy = y - ny;
            const distSq = dx * dx + dy * dy;
            if (distSq < radius * radius) return false;
          }
        }
      }

      return true;
    };

    // Add initial point
    const x0 = this.uniform() * width;
    const y0 = this.uniform() * height;
    const idx0 = 0;
    grid[gridIndex(x0, y0)] = idx0;
    points.push([x0, y0]);
    active.push(idx0);

    // Generate points
    while (active.length > 0) {
      const randomIndex = this.uniformInt(0, active.length);
      const pointIndex = active[randomIndex];
      const [px, py] = points[pointIndex];
      let found = false;

      for (let n = 0; n < k; n++) {
        const angle = this.uniform() * 2 * Math.PI;
        const r = radius + this.uniform() * radius;
        const x = px + r * Math.cos(angle);
        const y = py + r * Math.sin(angle);

        if (isValid(x, y)) {
          const idx = points.length;
          grid[gridIndex(x, y)] = idx;
          points.push([x, y]);
          active.push(idx);
          found = true;
          break;
        }
      }

      if (!found) {
        active.splice(randomIndex, 1);
      }
    }

    return points;
  }
}

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

const lerp = (a, b, t) => a + t * (b - a);

// 8 unit length gradients for 2D noise
const S = Math.SQRT1_2;
const GRADIENTS_2D = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [S, S],
  [-S, S],
  [S, -S],
  [-S, -S],
];

// The 12 classic Perlin gradients (cube edge midpoints), normalized
const GRADIENTS_3D = [
  [S, S, 0],
  [-S, S, 0],
  [S, -S, 0],
  [-S, -S, 0],
  [S, 0, S],
  [-S, 0, S],
  [S, 0, -S],
  [-S, 0, -S],
  [0, S, S],
  [0, -S, S],
  [0, S, -S],
  [0, -S, -S],
];

// With unit gradients Perlin noise is bounded by sqrt(dimensions) / 2, so
// these factors bring the output to (roughly) fill [-1, 1].
const SCALE_2D = Math.SQRT2;
const SCALE_3D = 2 / Math.sqrt(3);

const gradient2D = (hash, x, y) => {
  const [gx, gy] = GRADIENTS_2D[hash & 7];
  return gx * x + gy * y;
};

const gradient3D = (hash, x, y, z) => {
  const [gx, gy, gz] = GRADIENTS_3D[hash % 12];
  return gx * x + gy * y + gz * z;
};

export class Noise {
  /**
   * Creates a seeded Perlin noise generator. Noise is smooth and continuous:
   * nearby inputs give nearby outputs, which makes it useful for organic
   * surfaces, wobbly outlines and natural looking variation.
   * @param {number|RNG} [seed] - A seed, or an existing RNG to draw from.
   */
  constructor(seed) {
    const rng = seed instanceof RNG ? seed : new RNG(seed);

    const permutation = [];
    for (let i = 0; i < 256; i++) permutation.push(i);

    // Fisher-Yates shuffle, so the same seed always gives the same noise
    for (let i = 255; i > 0; i--) {
      const j = rng.uniformInt(0, i + 1);
      const temp = permutation[i];
      permutation[i] = permutation[j];
      permutation[j] = temp;
    }

    // Doubled so lookups can index past 255 without wrapping by hand
    this.perm = permutation.concat(permutation);
  }

  /**
   * Samples 2D Perlin noise.
   * @param {number} x
   * @param {number} y
   * @returns {number} A value in [-1, 1]
   */
  noise2D(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const X = xi & 255;
    const Y = yi & 255;
    const xf = x - xi;
    const yf = y - yi;
    const u = fade(xf);
    const v = fade(yf);

    const p = this.perm;
    const a = p[X] + Y;
    const b = p[X + 1] + Y;

    const bottom = lerp(
      gradient2D(p[a], xf, yf),
      gradient2D(p[b], xf - 1, yf),
      u
    );
    const top = lerp(
      gradient2D(p[a + 1], xf, yf - 1),
      gradient2D(p[b + 1], xf - 1, yf - 1),
      u
    );

    return SCALE_2D * lerp(bottom, top, v);
  }

  /**
   * Samples 3D Perlin noise.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {number} A value in [-1, 1]
   */
  noise3D(x, y, z) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const X = xi & 255;
    const Y = yi & 255;
    const Z = zi & 255;
    const xf = x - xi;
    const yf = y - yi;
    const zf = z - zi;
    const u = fade(xf);
    const v = fade(yf);
    const w = fade(zf);

    const p = this.perm;
    const a = p[X] + Y;
    const aa = p[a] + Z;
    const ab = p[a + 1] + Z;
    const b = p[X + 1] + Y;
    const ba = p[b] + Z;
    const bb = p[b + 1] + Z;

    const near = lerp(
      lerp(
        gradient3D(p[aa], xf, yf, zf),
        gradient3D(p[ba], xf - 1, yf, zf),
        u
      ),
      lerp(
        gradient3D(p[ab], xf, yf - 1, zf),
        gradient3D(p[bb], xf - 1, yf - 1, zf),
        u
      ),
      v
    );
    const far = lerp(
      lerp(
        gradient3D(p[aa + 1], xf, yf, zf - 1),
        gradient3D(p[ba + 1], xf - 1, yf, zf - 1),
        u
      ),
      lerp(
        gradient3D(p[ab + 1], xf, yf - 1, zf - 1),
        gradient3D(p[bb + 1], xf - 1, yf - 1, zf - 1),
        u
      ),
      v
    );

    return SCALE_3D * lerp(near, far, w);
  }

  /**
   * Fractal (fractional Brownian motion) 2D noise: several octaves of noise
   * summed together, giving detail at multiple scales.
   * @param {number} x
   * @param {number} y
   * @param {Object} [options]
   * @param {number} [options.octaves=4] - How many layers to sum
   * @param {number} [options.persistence=0.5] - Amplitude multiplier per octave
   * @param {number} [options.lacunarity=2] - Frequency multiplier per octave
   * @returns {number} A value in [-1, 1]
   */
  fbm2D(x, y, { octaves = 4, persistence = 0.5, lacunarity = 2 } = {}) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return maxAmplitude === 0 ? 0 : total / maxAmplitude;
  }

  /**
   * Fractal (fractional Brownian motion) 3D noise.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {Object} [options]
   * @param {number} [options.octaves=4] - How many layers to sum
   * @param {number} [options.persistence=0.5] - Amplitude multiplier per octave
   * @param {number} [options.lacunarity=2] - Frequency multiplier per octave
   * @returns {number} A value in [-1, 1]
   */
  fbm3D(x, y, z, { octaves = 4, persistence = 0.5, lacunarity = 2 } = {}) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
      total +=
        this.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return maxAmplitude === 0 ? 0 : total / maxAmplitude;
  }
}

/**
 * Adds two vectors component-wise.
 * @param {number[]} point - First vector
 * @param {number[]} otherPoint - Second vector
 * @returns {number[]} The sum of the two vectors
 */
export function add(point, otherPoint) {
  return point.map((value, index) => value + otherPoint[index]);
}

/**
 * Subtracts the second vector from the first component-wise.
 * @param {number[]} point - First vector
 * @param {number[]} otherPoint - Second vector to subtract
 * @returns {number[]} The difference of the two vectors
 */
export function subtract(point, otherPoint) {
  return point.map((value, index) => value - otherPoint[index]);
}

/**
 * Calculates the dot product of two vectors.
 * @param {number[]} vector - First vector
 * @param {number[]} otherVector - Second vector
 * @returns {number} The dot product
 */
export function dotProduct(vector, otherVector) {
  return vector.reduce(
    (sum, value, index) => sum + value * otherVector[index],
    0
  );
}

/**
 * Scales a vector by a scalar factor.
 * @param {number[]} vector - The vector to scale
 * @param {number} factor - The scaling factor
 * @returns {number[]} The scaled vector
 */
export function scale(vector, factor) {
  return vector.map((value) => value * factor);
}

/**
 * Calculates the magnitude (length) of a vector.
 * @param {number[]} vector - The vector
 * @returns {number} The magnitude
 */
export function magnitude(vector) {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

/**
 * Normalizes a vector to unit length.
 * @param {number[]} vector - The vector to normalize
 * @returns {number[]} The normalized vector
 */
export function normalize(vector) {
  const mag = magnitude(vector);
  return mag === 0 ? vector : scale(vector, 1 / mag);
}

/**
 * Converts polar coordinates to Cartesian coordinates.
 * @param {number} r - The radius (distance from origin)
 * @param {number} theta - The angle in radians
 * @returns {number[]} [x, y] Cartesian coordinates
 */
export function polarToCartesian(r, theta) {
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

/**
 * Finds a point along the line between two vectors.
 * @param {number[]} vector1 - The start vector
 * @param {number[]} vector2 - The end vector
 * @param {number} proportion - The proportion along the line (0 = vector1, 1 = vector2)
 * @returns {number[]} The interpolated point
 */
export function pointAlong(vector1, vector2, proportion) {
  return add(vector1, scale(subtract(vector2, vector1), proportion));
}

/**
 * Draws a polygon defined by a list of points using the provided pen.
 * @param {Object} pen - The drawing pen (call draw())
 * @param {number[][]} points - Array of points defining the polygon
 */
export function drawPoints(pen, points) {
  let s = pen.movePointerTo(points[0]);
  for (let i = 1; i < points.length; i++) {
    s = s.lineTo(points[i]);
  }
  s.close();
}

/**
 * Offset that moves the bounding box of a set of points onto the origin.
 * @param {number[][]} points
 * @returns {number[]} [dx, dy]
 */
const centeringOffset = (points) => {
  if (points.length === 0) return [0, 0];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return [-(minX + maxX) / 2, -(minY + maxY) / 2];
};

/**
 * Generates the centre points of a hexagonal grid.
 *
 * `size` is the circumradius: the distance from the centre of a hexagon to any
 * of its corners. Pointy top hexagons are offset row by row, flat top ones
 * column by column, so the cells tile without gaps.
 *
 * @param {number} cols - Number of columns
 * @param {number} rows - Number of rows
 * @param {number} size - Distance from a hexagon's centre to its corners
 * @param {Object} [options]
 * @param {"pointy"|"flat"} [options.orientation="pointy"] - Hexagon orientation
 * @param {boolean} [options.centered=false] - Centre the grid on the origin
 * @returns {number[][]} Array of `[x, y]` centre points
 */
export function hexGrid(
  cols,
  rows,
  size,
  { orientation = "pointy", centered = false } = {}
) {
  const width = Math.sqrt(3) * size;
  const centers = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (orientation === "flat") {
        centers.push([
          col * 1.5 * size,
          row * width + (col % 2 === 0 ? 0 : width / 2),
        ]);
      } else {
        centers.push([
          col * width + (row % 2 === 0 ? 0 : width / 2),
          row * 1.5 * size,
        ]);
      }
    }
  }

  if (!centered) return centers;

  const [dx, dy] = centeringOffset(centers);
  return centers.map(([x, y]) => [x + dx, y + dy]);
}

/**
 * The six corners of a hexagon, ready to pass to {@link drawPoints}.
 * @param {number[]} center - The `[x, y]` centre of the hexagon
 * @param {number} size - Distance from the centre to a corner
 * @param {Object} [options]
 * @param {"pointy"|"flat"} [options.orientation="pointy"] - Hexagon orientation
 * @returns {number[][]} Array of six `[x, y]` corner points
 */
export function hexPoints(center, size, { orientation = "pointy" } = {}) {
  const [cx, cy] = center;
  // Pointy top hexagons have a corner straight up, so their corners sit half a
  // step round from the flat top ones.
  const offset = orientation === "flat" ? 0 : Math.PI / 6;

  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = offset + (i * Math.PI) / 3;
    points.push([cx + size * Math.cos(angle), cy + size * Math.sin(angle)]);
  }
  return points;
}

/**
 * Generates a grid of triangles, alternating point up and point down so that
 * they tile the plane. Each triangle is an array of three `[x, y]` points that
 * can be passed straight to {@link drawPoints}.
 *
 * @param {number} cols - Number of triangles per row
 * @param {number} rows - Number of rows
 * @param {number} size - Edge length of each triangle
 * @param {Object} [options]
 * @param {boolean} [options.centered=false] - Centre the grid on the origin
 * @returns {number[][][]} Array of triangles
 */
export function triangleGrid(cols, rows, size, { centered = false } = {}) {
  const height = (Math.sqrt(3) / 2) * size;
  const half = size / 2;
  const triangles = [];

  for (let row = 0; row < rows; row++) {
    const bottom = row * height;
    const top = bottom + height;

    for (let col = 0; col < cols; col++) {
      const left = col * half;
      const middle = left + half;
      const right = left + size;

      if (col % 2 === 0) {
        triangles.push([
          [left, bottom],
          [right, bottom],
          [middle, top],
        ]);
      } else {
        triangles.push([
          [left, top],
          [right, top],
          [middle, bottom],
        ]);
      }
    }
  }

  if (!centered) return triangles;

  const [dx, dy] = centeringOffset(triangles.flat());
  return triangles.map((triangle) =>
    triangle.map(([x, y]) => [x + dx, y + dy])
  );
}

/**
 * The centroid (average of the corners) of a polygon, useful for placing
 * something at the middle of a triangle or hexagon from a grid.
 * @param {number[][]} points - Array of `[x, y]` points
 * @returns {number[]} The `[x, y]` centroid
 */
export function centroid(points) {
  const total = points.reduce((sum, point) => add(sum, point));
  return scale(total, 1 / points.length);
}
