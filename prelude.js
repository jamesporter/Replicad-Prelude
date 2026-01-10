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
