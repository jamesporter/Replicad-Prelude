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

describe("Shape Utilities", () => {
  describe("fuseAll", () => {
    test("returns single shape unchanged (except for fuse call structure)", () => {
      const shape = createMockShape("A");
      const result = fuseAll([shape]);
      expect(result.id).toBe("A");
    });

    test("fuses two shapes together", () => {
      const shapes = [createMockShape("A"), createMockShape("B")];
      const result = fuseAll(shapes);
      expect(result.id).toBe("A+B");
    });

    test("fuses multiple shapes sequentially", () => {
      const shapes = [
        createMockShape("A"),
        createMockShape("B"),
        createMockShape("C"),
      ];
      const result = fuseAll(shapes);
      expect(result.id).toBe("A+B+C");
    });

    test("fuses many shapes", () => {
      const shapes = [
        createMockShape("A"),
        createMockShape("B"),
        createMockShape("C"),
        createMockShape("D"),
        createMockShape("E"),
      ];
      const result = fuseAll(shapes);
      expect(result.id).toBe("A+B+C+D+E");
    });

    test("preserves order of fusion", () => {
      const shapes = [
        createMockShape("1"),
        createMockShape("2"),
        createMockShape("3"),
      ];
      const result = fuseAll(shapes);
      // Should fuse in order: (1+2)+3
      expect(result.id).toBe("1+2+3");
    });
  });

  describe("polarCopies", () => {
    test("creates correct number of copies", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 4, 10);
      expect(copies.length).toBe(4);
    });

    test("translates base shape by radius", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 4, 10);
      // Each copy should have y translated by radius
      for (const copy of copies) {
        expect(copy.y).toBe(10);
      }
    });

    test("rotates copies evenly around circle", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 4, 10);
      expect(copies[0].rotation).toBe(0);
      expect(copies[1].rotation).toBe(90);
      expect(copies[2].rotation).toBe(180);
      expect(copies[3].rotation).toBe(270);
    });

    test("creates single copy at 0 degrees when count is 1", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 1, 10);
      expect(copies.length).toBe(1);
      expect(copies[0].rotation).toBe(0);
    });

    test("creates correct angles for 6 copies", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 6, 10);
      expect(copies[0].rotation).toBe(0);
      expect(copies[1].rotation).toBe(60);
      expect(copies[2].rotation).toBe(120);
      expect(copies[3].rotation).toBe(180);
      expect(copies[4].rotation).toBe(240);
      expect(copies[5].rotation).toBe(300);
    });

    test("works with different radius values", () => {
      const shape = createTranslatableShape("base");
      const copies5 = polarCopies(shape, 3, 5);
      const copies20 = polarCopies(shape, 3, 20);

      for (const copy of copies5) {
        expect(copy.y).toBe(5);
      }
      for (const copy of copies20) {
        expect(copy.y).toBe(20);
      }
    });

    test("creates 360 copies with 1 degree spacing", () => {
      const shape = createTranslatableShape("base");
      const copies = polarCopies(shape, 360, 10);
      expect(copies.length).toBe(360);
      expect(copies[0].rotation).toBe(0);
      expect(copies[1].rotation).toBe(1);
      expect(copies[359].rotation).toBe(359);
    });
  });

  describe("drawPoints", () => {
    test("moves to first point", () => {
      const pen = createMockPen();
      const points = [
        [0, 0],
        [10, 0],
        [10, 10],
      ];
      drawPoints(pen, points);

      expect(pen.operations[0]).toEqual({ type: "moveTo", point: [0, 0] });
    });

    test("draws lines to remaining points", () => {
      const pen = createMockPen();
      const points = [
        [0, 0],
        [10, 0],
        [10, 10],
      ];
      drawPoints(pen, points);

      expect(pen.operations[1]).toEqual({ type: "lineTo", point: [10, 0] });
      expect(pen.operations[2]).toEqual({ type: "lineTo", point: [10, 10] });
    });

    test("closes the path", () => {
      const pen = createMockPen();
      const points = [
        [0, 0],
        [10, 0],
        [10, 10],
      ];
      drawPoints(pen, points);

      expect(pen.operations[pen.operations.length - 1]).toEqual({
        type: "close",
      });
    });

    test("handles triangle (3 points)", () => {
      const pen = createMockPen();
      const points = [
        [0, 0],
        [5, 10],
        [10, 0],
      ];
      drawPoints(pen, points);

      expect(pen.operations.length).toBe(4); // moveTo, 2x lineTo, close
      expect(pen.operations[0].type).toBe("moveTo");
      expect(pen.operations[1].type).toBe("lineTo");
      expect(pen.operations[2].type).toBe("lineTo");
      expect(pen.operations[3].type).toBe("close");
    });

    test("handles square (4 points)", () => {
      const pen = createMockPen();
      const points = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ];
      drawPoints(pen, points);

      expect(pen.operations.length).toBe(5); // moveTo, 3x lineTo, close
    });

    test("handles pentagon (5 points)", () => {
      const pen = createMockPen();
      const points = [
        [5, 0],
        [10, 4],
        [8, 10],
        [2, 10],
        [0, 4],
      ];
      drawPoints(pen, points);

      expect(pen.operations.length).toBe(6); // moveTo, 4x lineTo, close
    });

    test("handles floating point coordinates", () => {
      const pen = createMockPen();
      const points = [
        [0.5, 0.5],
        [10.5, 0.5],
        [10.5, 10.5],
      ];
      drawPoints(pen, points);

      expect(pen.operations[0].point).toEqual([0.5, 0.5]);
      expect(pen.operations[1].point).toEqual([10.5, 0.5]);
      expect(pen.operations[2].point).toEqual([10.5, 10.5]);
    });

    test("handles negative coordinates", () => {
      const pen = createMockPen();
      const points = [
        [-5, -5],
        [5, -5],
        [0, 5],
      ];
      drawPoints(pen, points);

      expect(pen.operations[0].point).toEqual([-5, -5]);
      expect(pen.operations[1].point).toEqual([5, -5]);
      expect(pen.operations[2].point).toEqual([0, 5]);
    });

    test("handles many points", () => {
      const pen = createMockPen();
      const points = [];
      for (let i = 0; i < 100; i++) {
        points.push([i, i * 2]);
      }
      drawPoints(pen, points);

      // 1 moveTo + 99 lineTo + 1 close = 101
      expect(pen.operations.length).toBe(101);
    });
  });
});
