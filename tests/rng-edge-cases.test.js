import { describe, expect, test } from "bun:test";
import { RNG } from "../prelude.js";

describe("RNG - Edge Cases", () => {
  describe("constructor", () => {
    test("seed of 0 is valid and deterministic", () => {
      const rng1 = new RNG(0);
      const rng2 = new RNG(0);
      expect(rng1.uniform()).toBe(rng2.uniform());
    });

    test("negative seed is valid and deterministic", () => {
      const rng1 = new RNG(-42);
      const rng2 = new RNG(-42);
      const vals1 = Array.from({ length: 10 }, () => rng1.uniform());
      const vals2 = Array.from({ length: 10 }, () => rng2.uniform());
      expect(vals1).toEqual(vals2);
    });

    test("very large seed is valid", () => {
      const rng = new RNG(0xffffffff);
      const val = rng.uniform();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    });

    test("fractional seed is valid", () => {
      const rng1 = new RNG(3.14);
      const rng2 = new RNG(3.14);
      expect(rng1.uniform()).toBe(rng2.uniform());
    });
  });

  describe("uniform - state mutation", () => {
    test("state changes after each call", () => {
      const rng = new RNG(42);
      const state0 = rng.state;
      rng.uniform();
      const state1 = rng.state;
      rng.uniform();
      const state2 = rng.state;
      expect(state0).not.toBe(state1);
      expect(state1).not.toBe(state2);
    });

    test("produces many unique values in sequence", () => {
      const rng = new RNG(42);
      const values = new Set();
      for (let i = 0; i < 10000; i++) {
        values.add(rng.uniform());
      }
      // Should have essentially all unique values
      expect(values.size).toBe(10000);
    });
  });

  describe("uniformInt - edge cases", () => {
    test("single-value range returns that value", () => {
      const rng = new RNG(42);
      for (let i = 0; i < 100; i++) {
        expect(rng.uniformInt(5, 6)).toBe(5);
      }
    });

    test("large range works correctly", () => {
      const rng = new RNG(42);
      for (let i = 0; i < 100; i++) {
        const val = rng.uniformInt(0, 1000000);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1000000);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    test("min equal to zero works", () => {
      const rng = new RNG(42);
      const val = rng.uniformInt(0, 1);
      expect(val).toBe(0);
    });
  });

  describe("choice - edge cases", () => {
    test("works with boolean array", () => {
      const rng = new RNG(42);
      const arr = [true, false];
      const choice = rng.choice(arr);
      expect(typeof choice).toBe("boolean");
    });

    test("works with nested arrays", () => {
      const rng = new RNG(42);
      const arr = [[1, 2], [3, 4], [5, 6]];
      const choice = rng.choice(arr);
      expect(arr).toContain(choice);
    });

    test("distribution is roughly uniform across elements", () => {
      const rng = new RNG(42);
      const arr = ["a", "b", "c", "d"];
      const counts = {};
      for (const item of arr) counts[item] = 0;

      const n = 10000;
      for (let i = 0; i < n; i++) {
        counts[rng.choice(arr)]++;
      }

      // Each should be roughly 2500
      for (const item of arr) {
        expect(counts[item]).toBeGreaterThan(2000);
        expect(counts[item]).toBeLessThan(3000);
      }
    });
  });

  describe("gaussian - edge cases", () => {
    test("custom mean and standard deviation together", () => {
      const rng = new RNG(42);
      const n = 10000;
      const targetMean = 50;
      const targetSd = 10;
      let sum = 0;
      let sumSq = 0;

      for (let i = 0; i < n; i++) {
        const val = rng.gaussian(targetMean, targetSd);
        sum += val;
        sumSq += val * val;
      }

      const mean = sum / n;
      const variance = sumSq / n - mean * mean;
      const sd = Math.sqrt(variance);

      expect(mean).toBeGreaterThan(49);
      expect(mean).toBeLessThan(51);
      expect(sd).toBeGreaterThan(9);
      expect(sd).toBeLessThan(11);
    });

    test("sd of 0 always returns mean", () => {
      const rng = new RNG(42);
      for (let i = 0; i < 100; i++) {
        expect(rng.gaussian(5, 0)).toBe(5);
      }
    });

    test("negative mean works", () => {
      const rng = new RNG(42);
      const n = 5000;
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += rng.gaussian(-100, 1);
      }
      const mean = sum / n;
      expect(mean).toBeGreaterThan(-101);
      expect(mean).toBeLessThan(-99);
    });

    test("approximately 68% of values within 1 sd of mean", () => {
      const rng = new RNG(42);
      const n = 10000;
      let within1sd = 0;
      const mean = 0;
      const sd = 1;

      for (let i = 0; i < n; i++) {
        const val = rng.gaussian(mean, sd);
        if (val >= mean - sd && val <= mean + sd) within1sd++;
      }

      const proportion = within1sd / n;
      // Should be ~0.6827
      expect(proportion).toBeGreaterThan(0.65);
      expect(proportion).toBeLessThan(0.72);
    });
  });

  describe("poisson - edge cases", () => {
    test("lambda of 0 returns 0", () => {
      const rng = new RNG(42);
      // With lambda=0, exp(-0)=1, so p starts at 1, loop runs once
      // making k=1, then p *= uniform() which is < 1 <= L=1, so returns 0
      for (let i = 0; i < 100; i++) {
        expect(rng.poisson(0)).toBe(0);
      }
    });

    test("variance is approximately equal to lambda", () => {
      const rng = new RNG(42);
      const lambda = 7;
      const n = 10000;
      let sum = 0;
      let sumSq = 0;

      for (let i = 0; i < n; i++) {
        const val = rng.poisson(lambda);
        sum += val;
        sumSq += val * val;
      }

      const mean = sum / n;
      const variance = sumSq / n - mean * mean;

      // For Poisson, variance should equal lambda
      expect(variance).toBeGreaterThan(6);
      expect(variance).toBeLessThan(8);
    });

    test("lambda of 1 produces small values", () => {
      const rng = new RNG(42);
      const n = 1000;
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const val = rng.poisson(1);
        sum += val;
        expect(val).toBeGreaterThanOrEqual(0);
      }
      const mean = sum / n;
      expect(mean).toBeGreaterThan(0.7);
      expect(mean).toBeLessThan(1.3);
    });
  });

  describe("poissonDisc - edge cases", () => {
    test("very small area produces at least one point", () => {
      const rng = new RNG(42);
      const points = rng.poissonDisc(5, 5, 2);
      expect(points.length).toBeGreaterThanOrEqual(1);
    });

    test("all points have numeric coordinates", () => {
      const rng = new RNG(42);
      const points = rng.poissonDisc(50, 50, 8);
      for (const [x, y] of points) {
        expect(typeof x).toBe("number");
        expect(typeof y).toBe("number");
        expect(Number.isNaN(x)).toBe(false);
        expect(Number.isNaN(y)).toBe(false);
      }
    });

    test("non-square area works correctly", () => {
      const rng = new RNG(42);
      const width = 200;
      const height = 50;
      const points = rng.poissonDisc(width, height, 10);

      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(height);
      }

      expect(points.length).toBeGreaterThan(1);
    });

    test("different seeds produce different point layouts", () => {
      const rng1 = new RNG(1);
      const rng2 = new RNG(2);
      const points1 = rng1.poissonDisc(100, 100, 15);
      const points2 = rng2.poissonDisc(100, 100, 15);

      // At least one point should differ
      const firstDiffers =
        points1[0][0] !== points2[0][0] || points1[0][1] !== points2[0][1];
      expect(firstDiffers).toBe(true);
    });

    test("default k parameter produces points", () => {
      const rng = new RNG(42);
      // Call without k parameter - uses default k=30
      const points = rng.poissonDisc(100, 100, 10);
      expect(points.length).toBeGreaterThan(10);
    });
  });
});
