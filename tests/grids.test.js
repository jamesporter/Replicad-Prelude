import { describe, expect, test } from "bun:test";
import {
  centroid,
  hexGrid,
  hexPoints,
  magnitude,
  subtract,
  triangleGrid,
} from "../prelude.js";

const distance = (a, b) => magnitude(subtract(a, b));

describe("Grids", () => {
  describe("hexGrid", () => {
    test("creates cols * rows centres", () => {
      expect(hexGrid(4, 3, 10).length).toBe(12);
      expect(hexGrid(1, 1, 10).length).toBe(1);
    });

    test("returns an empty array for an empty grid", () => {
      expect(hexGrid(0, 0, 10)).toEqual([]);
      expect(hexGrid(5, 0, 10)).toEqual([]);
      expect(hexGrid(0, 5, 10)).toEqual([]);
    });

    test("starts at the origin by default", () => {
      expect(hexGrid(3, 3, 10)[0]).toEqual([0, 0]);
    });

    test("spaces pointy top columns by the hexagon width", () => {
      const centers = hexGrid(3, 1, 10);
      const width = Math.sqrt(3) * 10;

      expect(centers[1][0]).toBeCloseTo(width, 10);
      expect(centers[2][0]).toBeCloseTo(2 * width, 10);
      expect(centers[1][1]).toBe(0);
    });

    test("offsets alternate rows of pointy top hexagons", () => {
      const centers = hexGrid(2, 2, 10);
      const width = Math.sqrt(3) * 10;

      // Second row is half a hexagon across and three quarters of a hex up
      expect(centers[2][0]).toBeCloseTo(width / 2, 10);
      expect(centers[2][1]).toBeCloseTo(15, 10);
    });

    test("offsets alternate columns of flat top hexagons", () => {
      const centers = hexGrid(2, 2, 10, { orientation: "flat" });
      const height = Math.sqrt(3) * 10;

      expect(centers[1][0]).toBeCloseTo(15, 10);
      expect(centers[1][1]).toBeCloseTo(height / 2, 10);
    });

    test("neighbouring pointy top hexagons touch without overlapping", () => {
      const centers = hexGrid(3, 3, 10);
      const expected = Math.sqrt(3) * 10;

      for (const center of centers) {
        const others = centers.filter((other) => other !== center);
        const nearest = Math.min(...others.map((other) => distance(center, other)));
        expect(nearest).toBeCloseTo(expected, 10);
      }
    });

    test("neighbouring flat top hexagons touch without overlapping", () => {
      const centers = hexGrid(3, 3, 10, { orientation: "flat" });
      const expected = Math.sqrt(3) * 10;

      for (const center of centers) {
        const others = centers.filter((other) => other !== center);
        const nearest = Math.min(...others.map((other) => distance(center, other)));
        expect(nearest).toBeCloseTo(expected, 10);
      }
    });

    test("centred grids are symmetric about the origin", () => {
      const centers = hexGrid(4, 4, 10, { centered: true });
      const xs = centers.map(([x]) => x);
      const ys = centers.map(([, y]) => y);

      expect(Math.min(...xs)).toBeCloseTo(-Math.max(...xs), 10);
      expect(Math.min(...ys)).toBeCloseTo(-Math.max(...ys), 10);
    });

    test("centring only shifts the grid", () => {
      const plain = hexGrid(3, 3, 10);
      const centred = hexGrid(3, 3, 10, { centered: true });
      const [dx, dy] = subtract(centred[0], plain[0]);

      centred.forEach((center, i) => {
        expect(center[0]).toBeCloseTo(plain[i][0] + dx, 10);
        expect(center[1]).toBeCloseTo(plain[i][1] + dy, 10);
      });
    });

    test("scales with size", () => {
      const small = hexGrid(2, 2, 5);
      const large = hexGrid(2, 2, 10);

      expect(distance(large[0], large[3])).toBeCloseTo(
        2 * distance(small[0], small[3]),
        10
      );
    });
  });

  describe("hexPoints", () => {
    test("returns six corners", () => {
      expect(hexPoints([0, 0], 10).length).toBe(6);
    });

    test("every corner is size away from the centre", () => {
      for (const corner of hexPoints([3, -4], 7)) {
        expect(distance(corner, [3, -4])).toBeCloseTo(7, 10);
      }
    });

    test("edges are all the same length as the circumradius", () => {
      const points = hexPoints([0, 0], 10);

      for (let i = 0; i < 6; i++) {
        expect(distance(points[i], points[(i + 1) % 6])).toBeCloseTo(10, 10);
      }
    });

    test("pointy top hexagons have a corner straight up", () => {
      const points = hexPoints([0, 0], 10);
      const top = points.reduce((a, b) => (a[1] > b[1] ? a : b));

      expect(top[0]).toBeCloseTo(0, 10);
      expect(top[1]).toBeCloseTo(10, 10);
    });

    test("flat top hexagons have a corner straight out to the side", () => {
      const points = hexPoints([0, 0], 10, { orientation: "flat" });
      const right = points.reduce((a, b) => (a[0] > b[0] ? a : b));

      expect(right[0]).toBeCloseTo(10, 10);
      expect(right[1]).toBeCloseTo(0, 10);
    });

    test("pointy top hexagons are taller than they are wide", () => {
      const points = hexPoints([0, 0], 10);
      const xs = points.map(([x]) => x);
      const ys = points.map(([, y]) => y);

      expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(20, 10);
      expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(Math.sqrt(3) * 10, 10);
    });

    test("is centred on the given point", () => {
      const points = hexPoints([12, -5], 4);
      const [cx, cy] = centroid(points);

      expect(cx).toBeCloseTo(12, 10);
      expect(cy).toBeCloseTo(-5, 10);
    });

    test("tiles a hex grid without gaps", () => {
      // Adjacent hexagons should share two corners exactly
      const [a, b] = hexGrid(2, 1, 10);
      const cornersOfA = hexPoints(a, 10);
      const cornersOfB = hexPoints(b, 10);

      const shared = cornersOfA.filter((corner) =>
        cornersOfB.some((other) => distance(corner, other) < 1e-9)
      );

      expect(shared.length).toBe(2);
    });
  });

  describe("triangleGrid", () => {
    test("creates cols * rows triangles", () => {
      expect(triangleGrid(4, 3, 10).length).toBe(12);
    });

    test("returns an empty array for an empty grid", () => {
      expect(triangleGrid(0, 3, 10)).toEqual([]);
      expect(triangleGrid(3, 0, 10)).toEqual([]);
    });

    test("each triangle has three points", () => {
      for (const triangle of triangleGrid(3, 3, 10)) {
        expect(triangle.length).toBe(3);
        for (const point of triangle) {
          expect(point.length).toBe(2);
        }
      }
    });

    test("triangles are equilateral with the given edge length", () => {
      for (const triangle of triangleGrid(4, 3, 10)) {
        expect(distance(triangle[0], triangle[1])).toBeCloseTo(10, 10);
        expect(distance(triangle[1], triangle[2])).toBeCloseTo(10, 10);
        expect(distance(triangle[2], triangle[0])).toBeCloseTo(10, 10);
      }
    });

    test("alternates point up and point down", () => {
      const [up, down] = triangleGrid(2, 1, 10);
      const height = (Math.sqrt(3) / 2) * 10;

      // The odd one out is the apex: up points to the top, down to the bottom
      expect(up[2][1]).toBeCloseTo(height, 10);
      expect(down[2][1]).toBeCloseTo(0, 10);
    });

    test("neighbouring triangles share an edge", () => {
      const [up, down] = triangleGrid(2, 1, 10);
      const shared = up.filter((point) =>
        down.some((other) => distance(point, other) < 1e-9)
      );

      expect(shared.length).toBe(2);
    });

    test("stacks rows by the triangle height", () => {
      const triangles = triangleGrid(2, 2, 10);
      const height = (Math.sqrt(3) / 2) * 10;

      expect(triangles[2][0][1]).toBeCloseTo(height, 10);
    });

    test("centred grids are symmetric about the origin", () => {
      const points = triangleGrid(4, 4, 10, { centered: true }).flat();
      const xs = points.map(([x]) => x);
      const ys = points.map(([, y]) => y);

      expect(Math.min(...xs)).toBeCloseTo(-Math.max(...xs), 10);
      expect(Math.min(...ys)).toBeCloseTo(-Math.max(...ys), 10);
    });

    test("centring keeps the triangles the same shape", () => {
      for (const triangle of triangleGrid(3, 3, 10, { centered: true })) {
        expect(distance(triangle[0], triangle[1])).toBeCloseTo(10, 10);
        expect(distance(triangle[1], triangle[2])).toBeCloseTo(10, 10);
      }
    });

    test("scales with size", () => {
      const [triangle] = triangleGrid(1, 1, 25);
      expect(distance(triangle[0], triangle[1])).toBeCloseTo(25, 10);
    });
  });

  describe("centroid", () => {
    test("averages the corners of a square", () => {
      expect(
        centroid([
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
        ])
      ).toEqual([5, 5]);
    });

    test("finds the middle of a triangle", () => {
      const [cx, cy] = centroid([
        [0, 0],
        [6, 0],
        [3, 6],
      ]);

      expect(cx).toBeCloseTo(3, 10);
      expect(cy).toBeCloseTo(2, 10);
    });

    test("returns the point itself for a single point", () => {
      expect(centroid([[3, 4]])).toEqual([3, 4]);
    });

    test("works in 3D", () => {
      expect(
        centroid([
          [0, 0, 0],
          [2, 4, 6],
        ])
      ).toEqual([1, 2, 3]);
    });

    test("does not mutate the input", () => {
      const points = [
        [0, 0],
        [10, 10],
      ];
      centroid(points);

      expect(points).toEqual([
        [0, 0],
        [10, 10],
      ]);
    });
  });
});
