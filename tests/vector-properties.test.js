import { describe, expect, test } from "bun:test";
import {
  add,
  subtract,
  dotProduct,
  scale,
  magnitude,
  normalize,
  polarToCartesian,
  pointAlong,
} from "../prelude.js";

describe("Vector Operations - Mathematical Properties", () => {
  describe("add - algebraic properties", () => {
    test("commutativity: a + b = b + a", () => {
      const a = [3, 7, -2];
      const b = [-1, 4, 8];
      expect(add(a, b)).toEqual(add(b, a));
    });

    test("associativity: (a + b) + c = a + (b + c)", () => {
      const a = [1, 2];
      const b = [3, 4];
      const c = [5, 6];
      expect(add(add(a, b), c)).toEqual(add(a, add(b, c)));
    });

    test("works with 1D vectors", () => {
      expect(add([5], [3])).toEqual([8]);
    });

    test("works with 4D vectors", () => {
      expect(add([1, 2, 3, 4], [5, 6, 7, 8])).toEqual([6, 8, 10, 12]);
    });
  });

  describe("subtract - algebraic properties", () => {
    test("anti-commutativity: a - b = -(b - a)", () => {
      const a = [3, 7];
      const b = [1, 4];
      expect(subtract(a, b)).toEqual(scale(subtract(b, a), -1));
    });

    test("self subtraction yields zero", () => {
      const v = [3.14, 2.72, 1.41];
      expect(subtract(v, v)).toEqual([0, 0, 0]);
    });

    test("works with 1D vectors", () => {
      expect(subtract([10], [3])).toEqual([7]);
    });

    test("works with 4D vectors", () => {
      expect(subtract([5, 6, 7, 8], [1, 2, 3, 4])).toEqual([4, 4, 4, 4]);
    });
  });

  describe("dotProduct - algebraic properties", () => {
    test("commutativity: a · b = b · a", () => {
      const a = [3, -7, 2];
      const b = [-1, 4, 8];
      expect(dotProduct(a, b)).toBe(dotProduct(b, a));
    });

    test("self dot product equals magnitude squared", () => {
      const v = [3, 4];
      expect(dotProduct(v, v)).toBeCloseTo(magnitude(v) ** 2, 10);
    });

    test("self dot product equals magnitude squared for 3D", () => {
      const v = [1, 2, 3];
      expect(dotProduct(v, v)).toBeCloseTo(magnitude(v) ** 2, 10);
    });

    test("distributivity: a · (b + c) = a · b + a · c", () => {
      const a = [2, 3];
      const b = [4, 5];
      const c = [6, 7];
      const lhs = dotProduct(a, add(b, c));
      const rhs = dotProduct(a, b) + dotProduct(a, c);
      expect(lhs).toBeCloseTo(rhs, 10);
    });

    test("scalar multiplication: (k*a) · b = k * (a · b)", () => {
      const a = [2, 3];
      const b = [4, 5];
      const k = 3;
      const lhs = dotProduct(scale(a, k), b);
      const rhs = k * dotProduct(a, b);
      expect(lhs).toBeCloseTo(rhs, 10);
    });

    test("works with 1D vectors", () => {
      expect(dotProduct([5], [3])).toBe(15);
    });
  });

  describe("scale - algebraic properties", () => {
    test("distributivity over vector addition: k*(a + b) = k*a + k*b", () => {
      const a = [2, 3];
      const b = [4, 5];
      const k = 3;
      expect(scale(add(a, b), k)).toEqual(add(scale(a, k), scale(b, k)));
    });

    test("distributivity over scalar addition: (j+k)*a = j*a + k*a", () => {
      const a = [2, 3];
      const j = 3;
      const k = 5;
      const lhs = scale(a, j + k);
      const rhs = add(scale(a, j), scale(a, k));
      expect(lhs[0]).toBeCloseTo(rhs[0], 10);
      expect(lhs[1]).toBeCloseTo(rhs[1], 10);
    });

    test("associativity: j*(k*a) = (j*k)*a", () => {
      const a = [2, 3, 4];
      const j = 3;
      const k = 5;
      const lhs = scale(scale(a, k), j);
      const rhs = scale(a, j * k);
      expect(lhs).toEqual(rhs);
    });

    test("scaling by -1 negates vector", () => {
      const v = [3, -7, 2];
      const result = scale(v, -1);
      expect(result).toEqual([-3, 7, -2]);
    });

    test("works with 1D vectors", () => {
      expect(scale([5], 3)).toEqual([15]);
    });
  });

  describe("magnitude - algebraic properties", () => {
    test("magnitude of scaled vector: |k*v| = |k| * |v|", () => {
      const v = [3, 4];
      const k = -3;
      expect(magnitude(scale(v, k))).toBeCloseTo(
        Math.abs(k) * magnitude(v),
        10
      );
    });

    test("triangle inequality: |a + b| <= |a| + |b|", () => {
      const a = [3, 4];
      const b = [-1, 2];
      expect(magnitude(add(a, b))).toBeLessThanOrEqual(
        magnitude(a) + magnitude(b) + 1e-10
      );
    });

    test("works with 1D vector", () => {
      expect(magnitude([5])).toBe(5);
      expect(magnitude([-5])).toBe(5);
    });

    test("works with 4D vector", () => {
      // |[1,1,1,1]| = sqrt(4) = 2
      expect(magnitude([1, 1, 1, 1])).toBeCloseTo(2, 10);
    });
  });

  describe("normalize - algebraic properties", () => {
    test("idempotent: normalizing twice equals normalizing once", () => {
      const v = [3, 4, 5];
      const once = normalize(v);
      const twice = normalize(once);
      expect(twice[0]).toBeCloseTo(once[0], 10);
      expect(twice[1]).toBeCloseTo(once[1], 10);
      expect(twice[2]).toBeCloseTo(once[2], 10);
    });

    test("result has magnitude 1 for various vectors", () => {
      const vectors = [
        [1, 0],
        [0, 1],
        [1, 1],
        [3, 4],
        [-3, 4],
        [1, 2, 3],
        [100, 200, 300],
        [0.001, 0.002],
      ];
      for (const v of vectors) {
        expect(magnitude(normalize(v))).toBeCloseTo(1, 10);
      }
    });

    test("direction preserved: normalized vector parallel to original", () => {
      const v = [6, 8];
      const n = normalize(v);
      // Cross product in 2D should be 0 for parallel vectors
      const cross = v[0] * n[1] - v[1] * n[0];
      expect(cross).toBeCloseTo(0, 10);
    });

    test("works with 1D vector", () => {
      expect(normalize([5])).toEqual([1]);
      expect(normalize([-5])).toEqual([-1]);
    });

    test("works with 4D vector", () => {
      const result = normalize([1, 1, 1, 1]);
      expect(magnitude(result)).toBeCloseTo(1, 10);
    });
  });

  describe("polarToCartesian - properties", () => {
    test("distance from origin equals r", () => {
      const r = 7;
      const angles = [0, Math.PI / 6, Math.PI / 3, Math.PI / 2, Math.PI, 1.5];
      for (const theta of angles) {
        const [x, y] = polarToCartesian(r, theta);
        expect(magnitude([x, y])).toBeCloseTo(r, 10);
      }
    });

    test("negative r produces point in opposite direction", () => {
      const theta = Math.PI / 4;
      const [x1, y1] = polarToCartesian(5, theta);
      const [x2, y2] = polarToCartesian(-5, theta);
      expect(x2).toBeCloseTo(-x1, 10);
      expect(y2).toBeCloseTo(-y1, 10);
    });

    test("r of 0 always returns origin regardless of angle", () => {
      const angles = [0, 1, 2, 3, Math.PI, -1];
      for (const theta of angles) {
        const [x, y] = polarToCartesian(0, theta);
        expect(x).toBeCloseTo(0, 10);
        expect(y).toBeCloseTo(0, 10);
      }
    });

    test("angle of PI/6 (30 degrees)", () => {
      const [x, y] = polarToCartesian(2, Math.PI / 6);
      expect(x).toBeCloseTo(Math.sqrt(3), 10);
      expect(y).toBeCloseTo(1, 10);
    });
  });

  describe("pointAlong - properties", () => {
    test("symmetry: pointAlong(a, b, t) relates to pointAlong(b, a, 1-t)", () => {
      const a = [2, 3];
      const b = [8, 11];
      const t = 0.3;
      const result1 = pointAlong(a, b, t);
      const result2 = pointAlong(b, a, 1 - t);
      expect(result1[0]).toBeCloseTo(result2[0], 10);
      expect(result1[1]).toBeCloseTo(result2[1], 10);
    });

    test("same start and end returns that point for any proportion", () => {
      const p = [5, 10];
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        expect(pointAlong(p, p, t)).toEqual(p);
      }
    });

    test("works with 1D vectors", () => {
      expect(pointAlong([0], [10], 0.5)).toEqual([5]);
    });

    test("works with 4D vectors", () => {
      expect(pointAlong([0, 0, 0, 0], [10, 20, 30, 40], 0.5)).toEqual([
        5, 10, 15, 20,
      ]);
    });

    test("result lies on the line between two points", () => {
      const a = [1, 2];
      const b = [5, 10];
      const t = 0.7;
      const result = pointAlong(a, b, t);
      // Check collinearity: (result - a) should be parallel to (b - a)
      const dr = subtract(result, a);
      const db = subtract(b, a);
      // Cross product should be 0
      const cross = dr[0] * db[1] - dr[1] * db[0];
      expect(cross).toBeCloseTo(0, 10);
    });
  });
});
