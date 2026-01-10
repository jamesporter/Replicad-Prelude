/**
 * Replicad Prelude
 */

function fuseAll(shapes) {
  let result = shapes[0];
  shapes.slice(1).forEach((shape) => {
    result = result.fuse(shape);
  });
  return result;
}

function polarCopies(shape, count, radius) {
  const base = shape.translate(0, radius);
  const angle = 360 / count;

  const copies = [];
  for (let i = 0; i < count; i++) {
    copies.push(base.clone().rotate(i * angle));
  }
  return copies;
}

class RNG {
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

/**
 * Adds two vectors component-wise.
 * @param {number[]} point - First vector
 * @param {number[]} otherPoint - Second vector
 * @returns {number[]} The sum of the two vectors
 */
function add(point, otherPoint) {
  return point.map((value, index) => value + otherPoint[index]);
}

/**
 * Subtracts the second vector from the first component-wise.
 * @param {number[]} point - First vector
 * @param {number[]} otherPoint - Second vector to subtract
 * @returns {number[]} The difference of the two vectors
 */
function subtract(point, otherPoint) {
  return point.map((value, index) => value - otherPoint[index]);
}

/**
 * Calculates the dot product of two vectors.
 * @param {number[]} vector - First vector
 * @param {number[]} otherVector - Second vector
 * @returns {number} The dot product
 */
function dotProduct(vector, otherVector) {
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
function scale(vector, factor) {
  return vector.map((value) => value * factor);
}

/**
 * Calculates the magnitude (length) of a vector.
 * @param {number[]} vector - The vector
 * @returns {number} The magnitude
 */
function magnitude(vector) {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

/**
 * Normalizes a vector to unit length.
 * @param {number[]} vector - The vector to normalize
 * @returns {number[]} The normalized vector
 */
function normalize(vector) {
  const mag = magnitude(vector);
  return mag === 0 ? vector : scale(vector, 1 / mag);
}

/**
 * Converts polar coordinates to Cartesian coordinates.
 * @param {number} r - The radius (distance from origin)
 * @param {number} theta - The angle in radians
 * @returns {number[]} [x, y] Cartesian coordinates
 */
function polarToCartesian(r, theta) {
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

/**
 * Finds a point along the line between two vectors.
 * @param {number[]} vector1 - The start vector
 * @param {number[]} vector2 - The end vector
 * @param {number} proportion - The proportion along the line (0 = vector1, 1 = vector2)
 * @returns {number[]} The interpolated point
 */
function pointAlong(vector1, vector2, proportion) {
  return add(vector1, scale(subtract(vector2, vector1), proportion));
}

/**
 * Draws a polygon defined by a list of points using the provided pen.
 * @param {Object} pen - The drawing pen (call draw())
 * @param {number[][]} points - Array of points defining the polygon
 */
function drawPoints(pen, points) {
  let s = pen.movePointerTo(points[0]);
  for (let i = 1; i < points.length; i++) {
    s = s.lineTo(points[i]);
  }
  s.close();
}
