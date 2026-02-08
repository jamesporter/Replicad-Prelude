import { describe, expect, test } from "bun:test";
import {
  RNG,
  add,
  subtract,
  scale,
  magnitude,
  normalize,
  polarToCartesian,
  pointAlong,
  dotProduct,
  drawPoints,
} from "../prelude.js";

describe("Integration Tests", () => {
  describe("vector composition", () => {
    test("add then subtract returns original vector", () => {
      const a = [3, 7, -2];
      const b = [5, -1, 4];
      expect(subtract(add(a, b), b)).toEqual(a);
    });

    test("subtract then add returns original vector", () => {
      const a = [3, 7, -2];
      const b = [5, -1, 4];
      expect(add(subtract(a, b), b)).toEqual(a);
    });

    test("scale up then scale down returns original", () => {
      const v = [3, 4, 5];
      const result = scale(scale(v, 5), 1 / 5);
      expect(result[0]).toBeCloseTo(3, 10);
      expect(result[1]).toBeCloseTo(4, 10);
      expect(result[2]).toBeCloseTo(5, 10);
    });

    test("normalize then scale to original magnitude restores vector", () => {
      const v = [3, 4];
      const mag = magnitude(v);
      const result = scale(normalize(v), mag);
      expect(result[0]).toBeCloseTo(v[0], 10);
      expect(result[1]).toBeCloseTo(v[1], 10);
    });
  });

  describe("polarToCartesian with vector operations", () => {
    test("magnitude of polarToCartesian result equals r", () => {
      const r = 10;
      const theta = Math.PI / 3;
      const point = polarToCartesian(r, theta);
      expect(magnitude(point)).toBeCloseTo(r, 10);
    });

    test("two perpendicular polar points have zero dot product", () => {
      const r = 5;
      const p1 = polarToCartesian(r, 0); // along x
      const p2 = polarToCartesian(r, Math.PI / 2); // along y
      expect(dotProduct(p1, p2)).toBeCloseTo(0, 10);
    });

    test("opposite polar points sum to zero", () => {
      const r = 7;
      const theta = Math.PI / 4;
      const p1 = polarToCartesian(r, theta);
      const p2 = polarToCartesian(r, theta + Math.PI);
      const sum = add(p1, p2);
      expect(sum[0]).toBeCloseTo(0, 10);
      expect(sum[1]).toBeCloseTo(0, 10);
    });
  });

  describe("pointAlong with vector operations", () => {
    test("distance from start to midpoint equals half total distance", () => {
      const a = [0, 0];
      const b = [10, 0];
      const mid = pointAlong(a, b, 0.5);
      const totalDist = magnitude(subtract(b, a));
      const halfDist = magnitude(subtract(mid, a));
      expect(halfDist).toBeCloseTo(totalDist / 2, 10);
    });

    test("pointAlong with normalized direction", () => {
      const start = [1, 1];
      const direction = normalize([1, 1]);
      const end = add(start, scale(direction, 10));
      const mid = pointAlong(start, end, 0.5);
      const expected = add(start, scale(direction, 5));
      expect(mid[0]).toBeCloseTo(expected[0], 10);
      expect(mid[1]).toBeCloseTo(expected[1], 10);
    });
  });

  describe("RNG with vector operations", () => {
    test("RNG generates random 2D points within unit square", () => {
      const rng = new RNG(42);
      for (let i = 0; i < 100; i++) {
        const point = [rng.uniform(), rng.uniform()];
        expect(point[0]).toBeGreaterThanOrEqual(0);
        expect(point[0]).toBeLessThan(1);
        expect(point[1]).toBeGreaterThanOrEqual(0);
        expect(point[1]).toBeLessThan(1);
      }
    });

    test("RNG generates random unit vectors via polar coordinates", () => {
      const rng = new RNG(42);
      for (let i = 0; i < 100; i++) {
        const theta = rng.uniform() * 2 * Math.PI;
        const point = polarToCartesian(1, theta);
        expect(magnitude(point)).toBeCloseTo(1, 10);
      }
    });

    test("poissonDisc points maintain minimum distance (verified with vector ops)", () => {
      const rng = new RNG(42);
      const radius = 10;
      const points = rng.poissonDisc(100, 100, radius);

      for (let i = 0; i < Math.min(points.length, 50); i++) {
        for (let j = i + 1; j < Math.min(points.length, 50); j++) {
          const diff = subtract(points[j], points[i]);
          const dist = magnitude(diff);
          expect(dist).toBeGreaterThanOrEqual(radius - 0.0001);
        }
      }
    });
  });

  describe("drawPoints with computed geometry", () => {
    test("draws regular polygon from polar coordinates", () => {
      const pen = {
        ops: [],
        movePointerTo(p) {
          this.ops.push({ type: "moveTo", point: [...p] });
          return this;
        },
        lineTo(p) {
          this.ops.push({ type: "lineTo", point: [...p] });
          return this;
        },
        close() {
          this.ops.push({ type: "close" });
          return this;
        },
      };

      const sides = 6;
      const radius = 5;
      const points = [];
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides;
        points.push(polarToCartesian(radius, angle));
      }

      drawPoints(pen, points);

      // Should have moveTo + 5 lineTo + close = 7 operations
      expect(pen.ops.length).toBe(7);

      // First point should be on the positive x-axis
      expect(pen.ops[0].point[0]).toBeCloseTo(radius, 10);
      expect(pen.ops[0].point[1]).toBeCloseTo(0, 10);
    });

    test("draws interpolated path between two endpoints", () => {
      const pen = {
        ops: [],
        movePointerTo(p) {
          this.ops.push({ type: "moveTo", point: [...p] });
          return this;
        },
        lineTo(p) {
          this.ops.push({ type: "lineTo", point: [...p] });
          return this;
        },
        close() {
          this.ops.push({ type: "close" });
          return this;
        },
      };

      const start = [0, 0];
      const end = [10, 10];
      const steps = 5;
      const points = [];
      for (let i = 0; i <= steps; i++) {
        points.push(pointAlong(start, end, i / steps));
      }

      drawPoints(pen, points);

      // 6 points: moveTo + 5 lineTo + close = 7
      expect(pen.ops.length).toBe(7);
      // First point at start
      expect(pen.ops[0].point).toEqual([0, 0]);
      // Last lineTo at end
      expect(pen.ops[5].point[0]).toBeCloseTo(10, 10);
      expect(pen.ops[5].point[1]).toBeCloseTo(10, 10);
    });
  });
});
