import { describe, expect, test } from "bun:test";
import { fuseAll, polarCopies, drawPoints } from "../prelude.js";

// Mock shape for testing fuseAll
const createMockShape = (id) => ({
  id,
  fusedWith: [],
  fuse(other) {
    const result = createMockShape(`${this.id}+${other.id}`);
    result.fusedWith = [...this.fusedWith, other.id];
    return result;
  },
});

// Mock shape for testing polarCopies
const createTranslatableShape = (name) => ({
  name,
  x: 0,
  y: 0,
  rotation: 0,
  translate(x, y) {
    const result = createTranslatableShape(name);
    result.x = this.x + x;
    result.y = this.y + y;
    result.rotation = this.rotation;
    return result;
  },
  clone() {
    const result = createTranslatableShape(name);
    result.x = this.x;
    result.y = this.y;
    result.rotation = this.rotation;
    return result;
  },
  rotate(angle) {
    this.rotation = angle;
    return this;
  },
});

// Mock pen for testing drawPoints
const createMockPen = () => {
  const operations = [];
  const pen = {
    operations,
    movePointerTo(point) {
      operations.push({ type: "moveTo", point: [...point] });
      return pen;
    },
    lineTo(point) {
      operations.push({ type: "lineTo", point: [...point] });
      return pen;
    },
    close() {
      operations.push({ type: "close" });
      return pen;
    },
  };
  return pen;
};

describe("Shape Utilities - Edge Cases", () => {
  describe("fuseAll - edge cases", () => {
    test("does not mutate the original shapes array", () => {
      const shapes = [
        createMockShape("A"),
        createMockShape("B"),
        createMockShape("C"),
      ];
      const originalLength = shapes.length;
      const originalIds = shapes.map((s) => s.id);
      fuseAll(shapes);
      expect(shapes.length).toBe(originalLength);
      expect(shapes.map((s) => s.id)).toEqual(originalIds);
    });

    test("does not mutate individual shape objects", () => {
      const shapeA = createMockShape("A");
      const shapeB = createMockShape("B");
      fuseAll([shapeA, shapeB]);
      expect(shapeA.id).toBe("A");
      expect(shapeB.id).toBe("B");
    });

    test("result is a new object, not a reference to input", () => {
      const shapes = [createMockShape("A"), createMockShape("B")];
      const result = fuseAll(shapes);
      expect(result).not.toBe(shapes[0]);
      expect(result).not.toBe(shapes[1]);
    });

    test("fuses 10 shapes sequentially", () => {
      const shapes = Array.from({ length: 10 }, (_, i) =>
        createMockShape(String(i))
      );
      const result = fuseAll(shapes);
      expect(result.id).toBe("0+1+2+3+4+5+6+7+8+9");
    });
  });

  describe("polarCopies - edge cases", () => {
    test("radius of 0 places copies at origin", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 3, 0);
      for (const copy of copies) {
        expect(copy.y).toBe(0);
      }
    });

    test("two copies are 180 degrees apart", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 2, 10);
      expect(copies[0].rotation).toBe(0);
      expect(copies[1].rotation).toBe(180);
    });

    test("three copies are 120 degrees apart", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 3, 10);
      expect(copies[0].rotation).toBe(0);
      expect(copies[1].rotation).toBe(120);
      expect(copies[2].rotation).toBe(240);
    });

    test("five copies are 72 degrees apart", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 5, 10);
      expect(copies[0].rotation).toBe(0);
      expect(copies[1].rotation).toBe(72);
      expect(copies[2].rotation).toBe(144);
      expect(copies[3].rotation).toBe(216);
      expect(copies[4].rotation).toBe(288);
    });

    test("does not mutate original shape", () => {
      const shape = createTranslatableShape("base");
      const originalX = shape.x;
      const originalY = shape.y;
      const originalRotation = shape.rotation;
      polarCopies(shape, 4, 10);
      expect(shape.x).toBe(originalX);
      expect(shape.y).toBe(originalY);
      expect(shape.rotation).toBe(originalRotation);
    });

    test("each copy is a distinct object", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 4, 10);
      for (let i = 0; i < copies.length; i++) {
        for (let j = i + 1; j < copies.length; j++) {
          expect(copies[i]).not.toBe(copies[j]);
        }
      }
    });

    test("large count produces correct number of copies", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 100, 10);
      expect(copies.length).toBe(100);
    });

    test("large count has correct angle increment", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 100, 10);
      const expectedAngle = 360 / 100;
      expect(copies[1].rotation).toBeCloseTo(expectedAngle, 10);
      expect(copies[99].rotation).toBeCloseTo(99 * expectedAngle, 10);
    });
  });

  describe("drawPoints - edge cases", () => {
    test("handles two points (line segment)", () => {
      const pen = createMockPen();
      const points = [
        [0, 0],
        [10, 10],
      ];
      drawPoints(pen, points);

      expect(pen.operations.length).toBe(3); // moveTo, lineTo, close
      expect(pen.operations[0]).toEqual({ type: "moveTo", point: [0, 0] });
      expect(pen.operations[1]).toEqual({ type: "lineTo", point: [10, 10] });
      expect(pen.operations[2]).toEqual({ type: "close" });
    });

    test("handles 3D points", () => {
      const pen = createMockPen();
      const points = [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ];
      drawPoints(pen, points);

      expect(pen.operations[0].point).toEqual([0, 0, 0]);
      expect(pen.operations[1].point).toEqual([1, 0, 0]);
      expect(pen.operations[2].point).toEqual([0, 1, 0]);
    });

    test("operations are in correct order: moveTo, lineTo..., close", () => {
      const pen = createMockPen();
      const points = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ];
      drawPoints(pen, points);

      // First operation is always moveTo
      expect(pen.operations[0].type).toBe("moveTo");
      // Middle operations are all lineTo
      for (let i = 1; i < pen.operations.length - 1; i++) {
        expect(pen.operations[i].type).toBe("lineTo");
      }
      // Last operation is always close
      expect(pen.operations[pen.operations.length - 1].type).toBe("close");
    });

    test("preserves exact point coordinates", () => {
      const pen = createMockPen();
      const points = [
        [1.23456789, -9.87654321],
        [0.00001, 99999.99999],
        [-0.5, -0.5],
      ];
      drawPoints(pen, points);

      expect(pen.operations[0].point).toEqual([1.23456789, -9.87654321]);
      expect(pen.operations[1].point).toEqual([0.00001, 99999.99999]);
      expect(pen.operations[2].point).toEqual([-0.5, -0.5]);
    });

    test("handles large polygon (hexagon)", () => {
      const pen = createMockPen();
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        points.push([Math.cos(angle), Math.sin(angle)]);
      }
      drawPoints(pen, points);

      expect(pen.operations.length).toBe(7); // moveTo + 5 lineTo + close
    });

    test("does not modify the input points array", () => {
      const pen = createMockPen();
      const points = [
        [0, 0],
        [1, 1],
        [2, 2],
      ];
      const originalLength = points.length;
      const originalPoints = points.map((p) => [...p]);
      drawPoints(pen, points);

      expect(points.length).toBe(originalLength);
      for (let i = 0; i < points.length; i++) {
        expect(points[i]).toEqual(originalPoints[i]);
      }
    });
  });
});
