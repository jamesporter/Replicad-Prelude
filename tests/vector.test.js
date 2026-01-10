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

describe("Vector Operations", () => {
  describe("add", () => {
    test("adds two 2D vectors", () => {
      expect(add([1, 2], [3, 4])).toEqual([4, 6]);
    });

    test("adds two 3D vectors", () => {
      expect(add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9]);
    });

    test("handles negative values", () => {
      expect(add([1, -2], [-3, 4])).toEqual([-2, 2]);
    });

    test("handles zero vectors", () => {
      expect(add([0, 0], [0, 0])).toEqual([0, 0]);
    });

    test("identity: adding zero vector returns original", () => {
      expect(add([5, 10], [0, 0])).toEqual([5, 10]);
    });

    test("handles floating point values", () => {
      expect(add([1.5, 2.5], [0.5, 0.5])).toEqual([2, 3]);
    });
  });

  describe("subtract", () => {
    test("subtracts two 2D vectors", () => {
      expect(subtract([5, 7], [2, 3])).toEqual([3, 4]);
    });

    test("subtracts two 3D vectors", () => {
      expect(subtract([10, 20, 30], [1, 2, 3])).toEqual([9, 18, 27]);
    });

    test("handles negative results", () => {
      expect(subtract([1, 2], [3, 4])).toEqual([-2, -2]);
    });

    test("subtracting zero vector returns original", () => {
      expect(subtract([5, 10], [0, 0])).toEqual([5, 10]);
    });

    test("subtracting same vector returns zero", () => {
      expect(subtract([5, 10], [5, 10])).toEqual([0, 0]);
    });

    test("handles floating point values", () => {
      expect(subtract([3.5, 2.5], [1.5, 0.5])).toEqual([2, 2]);
    });
  });

  describe("dotProduct", () => {
    test("calculates dot product of 2D vectors", () => {
      expect(dotProduct([1, 2], [3, 4])).toBe(11); // 1*3 + 2*4 = 11
    });

    test("calculates dot product of 3D vectors", () => {
      expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32); // 1*4 + 2*5 + 3*6 = 32
    });

    test("perpendicular vectors have zero dot product", () => {
      expect(dotProduct([1, 0], [0, 1])).toBe(0);
    });

    test("parallel vectors", () => {
      expect(dotProduct([2, 0], [3, 0])).toBe(6);
    });

    test("handles negative values", () => {
      expect(dotProduct([1, -2], [-3, 4])).toBe(-11); // 1*(-3) + (-2)*4 = -11
    });

    test("dot product with zero vector is zero", () => {
      expect(dotProduct([5, 10], [0, 0])).toBe(0);
    });

    test("handles unit vectors", () => {
      const v = [1, 0];
      expect(dotProduct(v, v)).toBe(1);
    });
  });

  describe("scale", () => {
    test("scales a 2D vector", () => {
      expect(scale([2, 3], 2)).toEqual([4, 6]);
    });

    test("scales a 3D vector", () => {
      expect(scale([1, 2, 3], 3)).toEqual([3, 6, 9]);
    });

    test("scales by zero returns zero vector", () => {
      expect(scale([5, 10], 0)).toEqual([0, 0]);
    });

    test("scales by one returns same vector", () => {
      expect(scale([5, 10], 1)).toEqual([5, 10]);
    });

    test("scales by negative factor", () => {
      expect(scale([2, 3], -1)).toEqual([-2, -3]);
    });

    test("scales by fractional factor", () => {
      expect(scale([4, 8], 0.5)).toEqual([2, 4]);
    });
  });

  describe("magnitude", () => {
    test("calculates magnitude of 2D vector", () => {
      expect(magnitude([3, 4])).toBe(5); // 3-4-5 triangle
    });

    test("calculates magnitude of 3D vector", () => {
      expect(magnitude([2, 3, 6])).toBe(7); // sqrt(4 + 9 + 36) = 7
    });

    test("magnitude of zero vector is zero", () => {
      expect(magnitude([0, 0])).toBe(0);
    });

    test("magnitude of unit vector along x is 1", () => {
      expect(magnitude([1, 0])).toBe(1);
    });

    test("magnitude of unit vector along y is 1", () => {
      expect(magnitude([0, 1])).toBe(1);
    });

    test("handles negative components", () => {
      expect(magnitude([-3, 4])).toBe(5);
    });

    test("magnitude is always non-negative", () => {
      expect(magnitude([-3, -4])).toBe(5);
    });
  });

  describe("normalize", () => {
    test("normalizes a 2D vector", () => {
      const result = normalize([3, 4]);
      expect(result[0]).toBeCloseTo(0.6, 5);
      expect(result[1]).toBeCloseTo(0.8, 5);
    });

    test("normalized vector has magnitude 1", () => {
      const result = normalize([3, 4]);
      expect(magnitude(result)).toBeCloseTo(1, 10);
    });

    test("normalizes a 3D vector", () => {
      const result = normalize([1, 2, 2]);
      expect(magnitude(result)).toBeCloseTo(1, 10);
    });

    test("normalizing unit vector returns same vector", () => {
      const result = normalize([1, 0]);
      expect(result).toEqual([1, 0]);
    });

    test("normalizing zero vector returns zero vector", () => {
      const result = normalize([0, 0]);
      expect(result).toEqual([0, 0]);
    });

    test("direction is preserved after normalization", () => {
      const result = normalize([10, 0]);
      expect(result[0]).toBeCloseTo(1, 5);
      expect(result[1]).toBeCloseTo(0, 5);
    });

    test("handles negative components", () => {
      const result = normalize([-3, 4]);
      expect(result[0]).toBeCloseTo(-0.6, 5);
      expect(result[1]).toBeCloseTo(0.8, 5);
    });
  });

  describe("polarToCartesian", () => {
    test("converts origin (r=0)", () => {
      const result = polarToCartesian(0, 0);
      expect(result[0]).toBeCloseTo(0, 10);
      expect(result[1]).toBeCloseTo(0, 10);
    });

    test("converts point on positive x-axis (theta=0)", () => {
      const result = polarToCartesian(5, 0);
      expect(result[0]).toBeCloseTo(5, 10);
      expect(result[1]).toBeCloseTo(0, 10);
    });

    test("converts point on positive y-axis (theta=PI/2)", () => {
      const result = polarToCartesian(5, Math.PI / 2);
      expect(result[0]).toBeCloseTo(0, 10);
      expect(result[1]).toBeCloseTo(5, 10);
    });

    test("converts point on negative x-axis (theta=PI)", () => {
      const result = polarToCartesian(5, Math.PI);
      expect(result[0]).toBeCloseTo(-5, 10);
      expect(result[1]).toBeCloseTo(0, 10);
    });

    test("converts point on negative y-axis (theta=3*PI/2)", () => {
      const result = polarToCartesian(5, (3 * Math.PI) / 2);
      expect(result[0]).toBeCloseTo(0, 10);
      expect(result[1]).toBeCloseTo(-5, 10);
    });

    test("converts 45 degree angle", () => {
      const result = polarToCartesian(Math.sqrt(2), Math.PI / 4);
      expect(result[0]).toBeCloseTo(1, 10);
      expect(result[1]).toBeCloseTo(1, 10);
    });

    test("handles full rotation (theta=2*PI)", () => {
      const result = polarToCartesian(5, 2 * Math.PI);
      expect(result[0]).toBeCloseTo(5, 10);
      expect(result[1]).toBeCloseTo(0, 10);
    });

    test("handles negative angles", () => {
      const result = polarToCartesian(5, -Math.PI / 2);
      expect(result[0]).toBeCloseTo(0, 10);
      expect(result[1]).toBeCloseTo(-5, 10);
    });
  });

  describe("pointAlong", () => {
    test("returns start point at proportion 0", () => {
      expect(pointAlong([0, 0], [10, 10], 0)).toEqual([0, 0]);
    });

    test("returns end point at proportion 1", () => {
      expect(pointAlong([0, 0], [10, 10], 1)).toEqual([10, 10]);
    });

    test("returns midpoint at proportion 0.5", () => {
      expect(pointAlong([0, 0], [10, 10], 0.5)).toEqual([5, 5]);
    });

    test("works with 3D vectors", () => {
      expect(pointAlong([0, 0, 0], [10, 20, 30], 0.5)).toEqual([5, 10, 15]);
    });

    test("handles negative coordinates", () => {
      expect(pointAlong([-10, -10], [10, 10], 0.5)).toEqual([0, 0]);
    });

    test("works with proportion < 0 (extrapolation)", () => {
      expect(pointAlong([0, 0], [10, 0], -0.5)).toEqual([-5, 0]);
    });

    test("works with proportion > 1 (extrapolation)", () => {
      expect(pointAlong([0, 0], [10, 0], 1.5)).toEqual([15, 0]);
    });

    test("quarter way along", () => {
      expect(pointAlong([0, 0], [100, 0], 0.25)).toEqual([25, 0]);
    });

    test("three quarters along", () => {
      expect(pointAlong([0, 0], [100, 0], 0.75)).toEqual([75, 0]);
    });
  });
});
