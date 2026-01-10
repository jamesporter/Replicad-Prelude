import { describe, expect, test } from "bun:test";
import { RNG } from "../prelude.js";

describe("RNG - Random Number Generator", () => {
  describe("constructor", () => {
    test("creates RNG with explicit seed", () => {
      const rng = new RNG(12345);
      expect(rng.state).toBe(12345);
    });

    test("creates RNG with default seed if not provided", () => {
      const rng = new RNG();
      expect(typeof rng.state).toBe("number");
    });

    test("same seed produces same sequence", () => {
      const rng1 = new RNG(42);
      const rng2 = new RNG(42);
      expect(rng1.uniform()).toBe(rng2.uniform());
      expect(rng1.uniform()).toBe(rng2.uniform());
      expect(rng1.uniform()).toBe(rng2.uniform());
    });

    test("different seeds produce different sequences", () => {
      const rng1 = new RNG(42);
      const rng2 = new RNG(43);
      expect(rng1.uniform()).not.toBe(rng2.uniform());
    });
  });

  describe("uniform", () => {
    test("returns values between 0 (inclusive) and 1 (exclusive)", () => {
      const rng = new RNG(12345);
      for (let i = 0; i < 1000; i++) {
        const value = rng.uniform();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    test("produces different values on successive calls", () => {
      const rng = new RNG(42);
      const first = rng.uniform();
      const second = rng.uniform();
      expect(first).not.toBe(second);
    });

    test("produces roughly uniform distribution", () => {
      const rng = new RNG(42);
      const n = 10000;
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += rng.uniform();
      }
      const mean = sum / n;
      // Mean should be close to 0.5 for uniform distribution
      expect(mean).toBeGreaterThan(0.45);
      expect(mean).toBeLessThan(0.55);
    });

    test("is deterministic with same seed", () => {
      const values1 = [];
      const values2 = [];
      const rng1 = new RNG(999);
      const rng2 = new RNG(999);

      for (let i = 0; i < 100; i++) {
        values1.push(rng1.uniform());
        values2.push(rng2.uniform());
      }

      expect(values1).toEqual(values2);
    });
  });

  describe("uniformInt", () => {
    test("returns integers within range [min, max)", () => {
      const rng = new RNG(42);
      for (let i = 0; i < 1000; i++) {
        const value = rng.uniformInt(0, 10);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(10);
      }
    });

    test("works with negative ranges", () => {
      const rng = new RNG(42);
      for (let i = 0; i < 100; i++) {
        const value = rng.uniformInt(-10, 0);
        expect(value).toBeGreaterThanOrEqual(-10);
        expect(value).toBeLessThan(0);
      }
    });

    test("works with ranges spanning zero", () => {
      const rng = new RNG(42);
      for (let i = 0; i < 100; i++) {
        const value = rng.uniformInt(-5, 5);
        expect(value).toBeGreaterThanOrEqual(-5);
        expect(value).toBeLessThan(5);
      }
    });

    test("covers the full range", () => {
      const rng = new RNG(42);
      const seen = new Set();
      for (let i = 0; i < 1000; i++) {
        seen.add(rng.uniformInt(0, 5));
      }
      expect(seen.has(0)).toBe(true);
      expect(seen.has(1)).toBe(true);
      expect(seen.has(2)).toBe(true);
      expect(seen.has(3)).toBe(true);
      expect(seen.has(4)).toBe(true);
      expect(seen.has(5)).toBe(false); // max is exclusive
    });

    test("produces roughly uniform distribution", () => {
      const rng = new RNG(42);
      const counts = [0, 0, 0, 0, 0];
      const n = 5000;
      for (let i = 0; i < n; i++) {
        counts[rng.uniformInt(0, 5)]++;
      }
      // Each bucket should have roughly n/5 = 1000 items
      for (const count of counts) {
        expect(count).toBeGreaterThan(800);
        expect(count).toBeLessThan(1200);
      }
    });
  });

  describe("choice", () => {
    test("returns an element from the array", () => {
      const rng = new RNG(42);
      const arr = ["a", "b", "c", "d", "e"];
      for (let i = 0; i < 100; i++) {
        const choice = rng.choice(arr);
        expect(arr).toContain(choice);
      }
    });

    test("works with single element array", () => {
      const rng = new RNG(42);
      expect(rng.choice(["only"])).toBe("only");
    });

    test("works with numbers", () => {
      const rng = new RNG(42);
      const arr = [1, 2, 3, 4, 5];
      const choice = rng.choice(arr);
      expect(arr).toContain(choice);
    });

    test("works with objects", () => {
      const rng = new RNG(42);
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const arr = [obj1, obj2];
      const choice = rng.choice(arr);
      expect(arr).toContain(choice);
    });

    test("covers all elements with enough iterations", () => {
      const rng = new RNG(42);
      const arr = ["a", "b", "c"];
      const seen = new Set();
      for (let i = 0; i < 1000; i++) {
        seen.add(rng.choice(arr));
      }
      expect(seen.size).toBe(3);
    });

    test("is deterministic with same seed", () => {
      const rng1 = new RNG(42);
      const rng2 = new RNG(42);
      const arr = ["a", "b", "c", "d", "e"];
      for (let i = 0; i < 10; i++) {
        expect(rng1.choice(arr)).toBe(rng2.choice(arr));
      }
    });
  });

  describe("gaussian", () => {
    test("generates values with default mean=0 and sd=1", () => {
      const rng = new RNG(42);
      const n = 10000;
      let sum = 0;
      let sumSq = 0;

      for (let i = 0; i < n; i++) {
        const value = rng.gaussian();
        sum += value;
        sumSq += value * value;
      }

      const mean = sum / n;
      const variance = sumSq / n - mean * mean;
      const sd = Math.sqrt(variance);

      // Mean should be close to 0
      expect(mean).toBeGreaterThan(-0.1);
      expect(mean).toBeLessThan(0.1);

      // Standard deviation should be close to 1
      expect(sd).toBeGreaterThan(0.9);
      expect(sd).toBeLessThan(1.1);
    });

    test("respects custom mean", () => {
      const rng = new RNG(42);
      const n = 10000;
      const targetMean = 100;
      let sum = 0;

      for (let i = 0; i < n; i++) {
        sum += rng.gaussian(targetMean, 1);
      }

      const mean = sum / n;
      expect(mean).toBeGreaterThan(99.5);
      expect(mean).toBeLessThan(100.5);
    });

    test("respects custom standard deviation", () => {
      const rng = new RNG(42);
      const n = 10000;
      const targetSd = 5;
      let sum = 0;
      let sumSq = 0;

      for (let i = 0; i < n; i++) {
        const value = rng.gaussian(0, targetSd);
        sum += value;
        sumSq += value * value;
      }

      const mean = sum / n;
      const variance = sumSq / n - mean * mean;
      const sd = Math.sqrt(variance);

      expect(sd).toBeGreaterThan(4.5);
      expect(sd).toBeLessThan(5.5);
    });

    test("is deterministic with same seed", () => {
      const rng1 = new RNG(42);
      const rng2 = new RNG(42);
      for (let i = 0; i < 10; i++) {
        expect(rng1.gaussian()).toBe(rng2.gaussian());
      }
    });

    test("can generate negative values", () => {
      const rng = new RNG(42);
      let hasNegative = false;
      for (let i = 0; i < 100; i++) {
        if (rng.gaussian() < 0) {
          hasNegative = true;
          break;
        }
      }
      expect(hasNegative).toBe(true);
    });
  });

  describe("poisson", () => {
    test("generates non-negative integers", () => {
      const rng = new RNG(42);
      for (let i = 0; i < 1000; i++) {
        const value = rng.poisson(5);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });

    test("mean is approximately equal to lambda", () => {
      const rng = new RNG(42);
      const lambda = 10;
      const n = 10000;
      let sum = 0;

      for (let i = 0; i < n; i++) {
        sum += rng.poisson(lambda);
      }

      const mean = sum / n;
      expect(mean).toBeGreaterThan(9.5);
      expect(mean).toBeLessThan(10.5);
    });

    test("works with small lambda", () => {
      const rng = new RNG(42);
      const n = 1000;
      let sum = 0;

      for (let i = 0; i < n; i++) {
        sum += rng.poisson(0.5);
      }

      const mean = sum / n;
      expect(mean).toBeGreaterThan(0.3);
      expect(mean).toBeLessThan(0.7);
    });

    test("works with large lambda", () => {
      const rng = new RNG(42);
      const lambda = 50;
      const n = 1000;
      let sum = 0;

      for (let i = 0; i < n; i++) {
        sum += rng.poisson(lambda);
      }

      const mean = sum / n;
      expect(mean).toBeGreaterThan(45);
      expect(mean).toBeLessThan(55);
    });

    test("is deterministic with same seed", () => {
      const rng1 = new RNG(42);
      const rng2 = new RNG(42);
      for (let i = 0; i < 10; i++) {
        expect(rng1.poisson(5)).toBe(rng2.poisson(5));
      }
    });
  });

  describe("poissonDisc", () => {
    test("returns an array of points", () => {
      const rng = new RNG(42);
      const points = rng.poissonDisc(100, 100, 10);
      expect(Array.isArray(points)).toBe(true);
      expect(points.length).toBeGreaterThan(0);
    });

    test("all points are within bounds", () => {
      const rng = new RNG(42);
      const width = 100;
      const height = 80;
      const points = rng.poissonDisc(width, height, 10);

      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(height);
      }
    });

    test("points are at least radius apart", () => {
      const rng = new RNG(42);
      const radius = 15;
      const points = rng.poissonDisc(100, 100, radius);

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const [x1, y1] = points[i];
          const [x2, y2] = points[j];
          const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          // Allow tiny floating point error
          expect(dist).toBeGreaterThanOrEqual(radius - 0.0001);
        }
      }
    });

    test("larger radius produces fewer points", () => {
      const rng1 = new RNG(42);
      const rng2 = new RNG(42);

      const pointsSmall = rng1.poissonDisc(100, 100, 5);
      const pointsLarge = rng2.poissonDisc(100, 100, 20);

      expect(pointsSmall.length).toBeGreaterThan(pointsLarge.length);
    });

    test("larger area produces more points", () => {
      const rng1 = new RNG(42);
      const rng2 = new RNG(42);

      const pointsSmall = rng1.poissonDisc(50, 50, 10);
      const pointsLarge = rng2.poissonDisc(200, 200, 10);

      expect(pointsLarge.length).toBeGreaterThan(pointsSmall.length);
    });

    test("is deterministic with same seed", () => {
      const rng1 = new RNG(42);
      const rng2 = new RNG(42);

      const points1 = rng1.poissonDisc(100, 100, 10);
      const points2 = rng2.poissonDisc(100, 100, 10);

      expect(points1).toEqual(points2);
    });

    test("respects k parameter for attempts", () => {
      // With k=1, we should get fewer points (more rejections)
      const rng1 = new RNG(42);
      const rng2 = new RNG(42);

      const pointsLowK = rng1.poissonDisc(100, 100, 10, 1);
      const pointsHighK = rng2.poissonDisc(100, 100, 10, 100);

      // High k should generally produce more points (but this isn't guaranteed)
      expect(pointsHighK.length).toBeGreaterThanOrEqual(pointsLowK.length);
    });

    test("each point is a 2D array", () => {
      const rng = new RNG(42);
      const points = rng.poissonDisc(100, 100, 10);

      for (const point of points) {
        expect(Array.isArray(point)).toBe(true);
        expect(point.length).toBe(2);
        expect(typeof point[0]).toBe("number");
        expect(typeof point[1]).toBe("number");
      }
    });
  });
});
