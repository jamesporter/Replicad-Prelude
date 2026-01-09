class RNG {
  /**
   * Creates a new seeded random number generator.
   * @param {number} [seed] - The initial seed.
   */
  constructor(seed = Math.random() * 0xFFFFFFFF) {
    this.state = seed;
  }

  /**
   * Generates a pseudorandom double between 0 (inclusive) and 1 (exclusive).
   * @returns {number} A value between 0 and 1.
   */
  uniform() {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
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
