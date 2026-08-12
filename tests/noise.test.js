import { describe, expect, test } from "bun:test";
import { Noise, RNG } from "../prelude.js";

describe("Noise", () => {
  describe("determinism", () => {
    test("same seed gives the same 2D values", () => {
      const a = new Noise(42);
      const b = new Noise(42);

      for (let i = 0; i < 10; i++) {
        expect(a.noise2D(i * 0.37, i * 0.11)).toBe(b.noise2D(i * 0.37, i * 0.11));
      }
    });

    test("same seed gives the same 3D values", () => {
      const a = new Noise(7);
      const b = new Noise(7);

      for (let i = 0; i < 10; i++) {
        expect(a.noise3D(i * 0.3, i * 0.7, i * 0.2)).toBe(
          b.noise3D(i * 0.3, i * 0.7, i * 0.2)
        );
      }
    });

    test("different seeds give different values", () => {
      const a = new Noise(1);
      const b = new Noise(2);

      const differences = [];
      for (let i = 0; i < 20; i++) {
        differences.push(a.noise2D(i * 0.5, 0.25) !== b.noise2D(i * 0.5, 0.25));
      }

      expect(differences.some(Boolean)).toBe(true);
    });

    test("accepts an existing RNG as a seed", () => {
      const a = new Noise(new RNG(123));
      const b = new Noise(new RNG(123));

      expect(a.noise2D(1.5, 2.5)).toBe(b.noise2D(1.5, 2.5));
    });

    test("repeated sampling of the same point is stable", () => {
      const noise = new Noise(99);
      const first = noise.noise2D(3.3, 4.4);

      expect(noise.noise2D(3.3, 4.4)).toBe(first);
      expect(noise.noise2D(3.3, 4.4)).toBe(first);
    });
  });

  describe("range", () => {
    test("noise2D stays within [-1, 1]", () => {
      const noise = new Noise(5);

      for (let i = 0; i < 2000; i++) {
        const value = noise.noise2D(i * 0.13, i * 0.07);
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    test("noise3D stays within [-1, 1]", () => {
      const noise = new Noise(6);

      for (let i = 0; i < 2000; i++) {
        const value = noise.noise3D(i * 0.13, i * 0.07, i * 0.29);
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    test("produces both positive and negative values", () => {
      const noise = new Noise(11);
      const values = [];
      for (let i = 0; i < 500; i++) values.push(noise.noise2D(i * 0.21, 0.5));

      expect(values.some((v) => v > 0.1)).toBe(true);
      expect(values.some((v) => v < -0.1)).toBe(true);
    });

    test("is zero at integer lattice points", () => {
      const noise = new Noise(3);

      expect(noise.noise2D(1, 1)).toBeCloseTo(0, 10);
      expect(noise.noise2D(-4, 12)).toBeCloseTo(0, 10);
      expect(noise.noise3D(2, 3, 4)).toBeCloseTo(0, 10);
    });
  });

  describe("continuity", () => {
    test("nearby 2D points give nearby values", () => {
      const noise = new Noise(17);

      for (let i = 0; i < 100; i++) {
        const x = i * 0.43;
        const y = i * 0.19;
        const delta = Math.abs(noise.noise2D(x, y) - noise.noise2D(x + 0.001, y));
        expect(delta).toBeLessThan(0.05);
      }
    });

    test("nearby 3D points give nearby values", () => {
      const noise = new Noise(18);

      for (let i = 0; i < 100; i++) {
        const x = i * 0.43;
        const delta = Math.abs(
          noise.noise3D(x, 1.5, 2.5) - noise.noise3D(x, 1.5, 2.501)
        );
        expect(delta).toBeLessThan(0.05);
      }
    });

    test("handles negative coordinates", () => {
      const noise = new Noise(21);
      const value = noise.noise2D(-13.7, -200.2);

      expect(Number.isFinite(value)).toBe(true);
      expect(Math.abs(value)).toBeLessThanOrEqual(1);
    });

    test("wraps every 256 units", () => {
      const noise = new Noise(23);

      expect(noise.noise2D(0.5, 0.5)).toBeCloseTo(noise.noise2D(256.5, 0.5), 10);
      expect(noise.noise2D(0.5, 0.5)).toBeCloseTo(noise.noise2D(0.5, 256.5), 10);
    });
  });

  describe("fbm2D", () => {
    test("stays within [-1, 1]", () => {
      const noise = new Noise(31);

      for (let i = 0; i < 500; i++) {
        const value = noise.fbm2D(i * 0.13, i * 0.07);
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    test("a single octave matches plain noise", () => {
      const noise = new Noise(33);

      expect(noise.fbm2D(1.3, 2.7, { octaves: 1 })).toBeCloseTo(
        noise.noise2D(1.3, 2.7),
        10
      );
    });

    test("more octaves add detail", () => {
      const noise = new Noise(35);
      const smooth = noise.fbm2D(1.3, 2.7, { octaves: 1 });
      const detailed = noise.fbm2D(1.3, 2.7, { octaves: 6 });

      expect(detailed).not.toBe(smooth);
    });

    test("zero octaves gives zero", () => {
      const noise = new Noise(37);
      expect(noise.fbm2D(1.3, 2.7, { octaves: 0 })).toBe(0);
    });

    test("is deterministic", () => {
      const a = new Noise(39);
      const b = new Noise(39);

      expect(a.fbm2D(0.7, 1.9, { octaves: 5 })).toBe(
        b.fbm2D(0.7, 1.9, { octaves: 5 })
      );
    });

    test("respects persistence", () => {
      const noise = new Noise(41);
      const low = noise.fbm2D(1.3, 2.7, { octaves: 4, persistence: 0.1 });
      const high = noise.fbm2D(1.3, 2.7, { octaves: 4, persistence: 0.9 });

      expect(low).not.toBe(high);
    });

    test("respects lacunarity", () => {
      const noise = new Noise(43);
      const tight = noise.fbm2D(1.3, 2.7, { octaves: 4, lacunarity: 2 });
      const wide = noise.fbm2D(1.3, 2.7, { octaves: 4, lacunarity: 4 });

      expect(tight).not.toBe(wide);
    });
  });

  describe("fbm3D", () => {
    test("stays within [-1, 1]", () => {
      const noise = new Noise(45);

      for (let i = 0; i < 500; i++) {
        const value = noise.fbm3D(i * 0.13, i * 0.07, i * 0.23);
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    test("a single octave matches plain noise", () => {
      const noise = new Noise(47);

      expect(noise.fbm3D(1.3, 2.7, 0.4, { octaves: 1 })).toBeCloseTo(
        noise.noise3D(1.3, 2.7, 0.4),
        10
      );
    });

    test("zero octaves gives zero", () => {
      const noise = new Noise(49);
      expect(noise.fbm3D(1.3, 2.7, 0.4, { octaves: 0 })).toBe(0);
    });

    test("is deterministic", () => {
      const a = new Noise(51);
      const b = new Noise(51);

      expect(a.fbm3D(0.7, 1.9, 2.3)).toBe(b.fbm3D(0.7, 1.9, 2.3));
    });
  });

  describe("unseeded", () => {
    test("works without an explicit seed", () => {
      const noise = new Noise();
      const value = noise.noise2D(1.5, 2.5);

      expect(Number.isFinite(value)).toBe(true);
      expect(Math.abs(value)).toBeLessThanOrEqual(1);
    });
  });
});
