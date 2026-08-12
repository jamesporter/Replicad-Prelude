# Replicad Prelude API Documentation

Full documentation for all functions and classes exported by [`prelude.js`](./prelude.js).

---

## Shape Helpers

### `fuseAll(shapes)`

Fuses an array of shapes into a single shape by sequentially calling `.fuse()` on each pair.

- **Parameters:**
  - `shapes` — Array of Replicad shapes
- **Returns:** A single fused shape

```js
const merged = fuseAll([box1, box2, box3]);
```

---

### `cutAll(target, shapes)`

Cuts an array of shapes out of a target shape by sequentially calling `.cut()` on each one.

- **Parameters:**
  - `target` — The Replicad shape to cut from
  - `shapes` — Array of Replicad shapes to cut out of the target
- **Returns:** The resulting shape after all cuts

```js
const result = cutAll(block, [hole1, hole2, hole3]);
```

---

### `polarCopies(shape, count, radius)`

Creates `count` copies of a shape arranged in a circle. The shape is first translated along the Y axis by `radius`, then each copy is rotated evenly around the origin.

- **Parameters:**
  - `shape` — A Replicad shape
  - `count` — Number of copies
  - `radius` — Distance from the origin
- **Returns:** Array of shapes arranged in a polar pattern

```js
const pegs = polarCopies(cylinder, 6, 20);
// 6 copies evenly spaced in a circle of radius 20
```

---

### `drawPoints(pen, points)`

Draws a closed polygon through the given points using a Replicad drawing pen (from `draw()`).

- **Parameters:**
  - `pen` — A Replicad drawing pen
  - `points` — Array of `[x, y]` coordinate pairs
- **Returns:** Nothing (mutates the pen in place)

```js
const pen = draw();
drawPoints(pen, [[0, 0], [10, 0], [10, 10], [0, 10]]);
```

---

## RNG (Seeded Random Number Generator)

A deterministic pseudorandom number generator. Providing the same seed always produces the same sequence, which is useful for reproducible generative designs.

### `new RNG(seed?)`

Creates a new generator. If no seed is given, one is chosen randomly.

- **Parameters:**
  - `seed` *(optional)* — A number used to initialize the generator state

```js
const rng = new RNG(42);
```

### `rng.uniform()`

Returns a pseudorandom float in `[0, 1)`.

```js
rng.uniform(); // e.g. 0.7283...
```

### `rng.uniformInt(min, max)`

Returns a pseudorandom integer in `[min, max)`.

- **Parameters:**
  - `min` — Inclusive lower bound
  - `max` — Exclusive upper bound

```js
rng.uniformInt(1, 7); // e.g. 4
```

### `rng.choice(array)`

Returns a random element from the given array.

- **Parameters:**
  - `array` — A non-empty array

```js
rng.choice(["red", "green", "blue"]); // e.g. "green"
```

### `rng.gaussian(mean?, sd?)`

Returns a random number from a Gaussian (normal) distribution using the Box-Muller transform.

- **Parameters:**
  - `mean` *(optional, default `0`)* — The mean of the distribution
  - `sd` *(optional, default `1`)* — The standard deviation

```js
rng.gaussian();       // standard normal
rng.gaussian(10, 2);  // mean=10, sd=2
```

### `rng.poisson(lambda)`

Returns a random non-negative integer from a Poisson distribution using Knuth's algorithm.

- **Parameters:**
  - `lambda` — The expected average (mean) number of events

```js
rng.poisson(5); // e.g. 3
```

### `rng.poissonDisc(width, height, radius, k?)`

Generates a set of randomly but evenly-spaced 2D points using Bridson's Poisson disc sampling algorithm. No two points will be closer than `radius` apart.

- **Parameters:**
  - `width` — Width of the sampling area
  - `height` — Height of the sampling area
  - `radius` — Minimum distance between any two points
  - `k` *(optional, default `30`)* — Candidate attempts per active point before rejection
- **Returns:** Array of `[x, y]` points

```js
const points = rng.poissonDisc(100, 100, 5);
// points is e.g. [[12.3, 45.6], [23.1, 67.8], ...]
```

---

## Noise (Seeded Perlin Noise)

Smooth, continuous pseudorandom values: nearby inputs give nearby outputs. Where `RNG` gives you unrelated jumps, `Noise` gives you gentle drift, which is what you want for organic surfaces, wobbly outlines and natural looking variation. Like `RNG` it is deterministic — the same seed always gives the same field.

### `new Noise(seed?)`

Creates a noise generator.

- **Parameters:**
  - `seed` *(optional)* — A number, or an existing `RNG` to draw the permutation table from. Omit for a random seed.

```js
const noise = new Noise(42);
const shared = new Noise(rng); // reuse an existing RNG
```

### `noise.noise2D(x, y)`

Samples the 2D noise field. Returns a value in `[-1, 1]`, zero at integer lattice points, and repeating every 256 units.

```js
noise.noise2D(1.5, 2.5); // e.g. -0.312...

// Wobble the radius of a circle. Sampling the field *around* a circle keeps
// the wobble seamless where the outline joins back up.
const points = [];
for (let i = 0; i < 60; i++) {
  const theta = (i / 60) * 2 * Math.PI;
  const r = 20 + 3 * noise.noise2D(2 * Math.cos(theta), 2 * Math.sin(theta));
  points.push(polarToCartesian(r, theta));
}
drawPoints(draw(), points);
```

### `noise.noise3D(x, y, z)`

Samples the 3D noise field. Returns a value in `[-1, 1]`. Useful for varying something over a volume, or for animating a 2D field by sweeping `z`.

```js
noise.noise3D(1.5, 2.5, 0.5); // e.g. 0.204...
```

### `noise.fbm2D(x, y, options?)` / `noise.fbm3D(x, y, z, options?)`

Fractal (fractional Brownian motion) noise: several octaves of noise summed together so the field has both broad shape and fine detail. The result is normalized back into `[-1, 1]`.

- **Parameters:**
  - `options.octaves` *(default `4`)* — How many layers to sum. More octaves means more fine detail.
  - `options.persistence` *(default `0.5`)* — How much amplitude each successive octave keeps. Lower is smoother.
  - `options.lacunarity` *(default `2`)* — How much the frequency grows each octave.

```js
noise.fbm2D(x, y);                                  // 4 octaves
noise.fbm2D(x, y, { octaves: 6, persistence: 0.4 }); // rougher, more detail
noise.fbm3D(x, y, z, { octaves: 2 });
```

With `octaves: 1` this is identical to plain `noise2D`/`noise3D`.

---

## Grids

Helpers for laying shapes out on a hexagonal or triangular tiling. Both return plain coordinate arrays, so they compose with `drawPoints`, `fuseAll` and `cutAll`.

### `hexGrid(cols, rows, size, options?)`

Generates the centre points of a hexagonal grid. `size` is the circumradius — the distance from the centre of a hexagon to any of its corners — so neighbouring centres end up `√3 × size` apart and the cells tile without gaps.

- **Parameters:**
  - `cols` — Number of columns
  - `rows` — Number of rows
  - `size` — Distance from a hexagon's centre to its corners
  - `options.orientation` *(default `"pointy"`)* — `"pointy"` for a corner at the top (rows are offset), `"flat"` for a flat edge at the top (columns are offset)
  - `options.centered` *(default `false`)* — Centre the whole grid on the origin instead of starting at it
- **Returns:** Array of `[x, y]` centre points

```js
const centers = hexGrid(5, 5, 10, { centered: true });

// Punch a honeycomb out of a plate
const holes = centers.map(([x, y]) => drawCircle(8).translate(x, y).sketchOnPlane().extrude(5));
const plate = cutAll(basePlate, holes);
```

### `hexPoints(center, size, options?)`

The six corners of a single hexagon, ready to pass to `drawPoints`.

- **Parameters:**
  - `center` — The `[x, y]` centre of the hexagon
  - `size` — Distance from the centre to a corner
  - `options.orientation` *(default `"pointy"`)* — Matches the `hexGrid` orientations
- **Returns:** Array of six `[x, y]` points

```js
for (const center of hexGrid(4, 4, 10)) {
  drawPoints(draw(), hexPoints(center, 9)); // 9 leaves a 1 unit gap between cells
}
```

### `triangleGrid(cols, rows, size, options?)`

Generates a grid of equilateral triangles, alternating point up and point down along each row so that they tile the plane. Each triangle is an array of three `[x, y]` points, ready for `drawPoints`.

- **Parameters:**
  - `cols` — Number of triangles per row
  - `rows` — Number of rows
  - `size` — Edge length of each triangle
  - `options.centered` *(default `false`)* — Centre the whole grid on the origin
- **Returns:** Array of triangles, each an array of three points

```js
const triangles = triangleGrid(8, 6, 10, { centered: true });

// Vary each triangle by where it sits in a noise field
const noise = new Noise(1);
for (const triangle of triangles) {
  const [cx, cy] = centroid(triangle);
  const height = 2 + 3 * (noise.noise2D(cx / 30, cy / 30) + 1);
  // ...extrude the triangle by height
}
```

---

## Vector Math

All vector functions work with arrays of numbers (`number[]`) and support any dimensionality (2D, 3D, etc.) unless otherwise noted.

### `add(point, otherPoint)`

Component-wise addition of two vectors.

```js
add([1, 2], [3, 4]); // [4, 6]
```

### `subtract(point, otherPoint)`

Component-wise subtraction (`point - otherPoint`).

```js
subtract([5, 3], [1, 2]); // [4, 1]
```

### `dotProduct(vector, otherVector)`

Computes the dot product of two vectors.

```js
dotProduct([1, 2, 3], [4, 5, 6]); // 32
```

### `scale(vector, factor)`

Multiplies every component of a vector by a scalar.

```js
scale([2, 3], 4); // [8, 12]
```

### `magnitude(vector)`

Returns the Euclidean length of a vector.

```js
magnitude([3, 4]); // 5
```

### `normalize(vector)`

Returns a unit-length vector in the same direction. Returns the original vector unchanged if it has zero magnitude.

```js
normalize([3, 4]); // [0.6, 0.8]
```

### `polarToCartesian(r, theta)`

Converts polar coordinates to 2D Cartesian coordinates.

- **Parameters:**
  - `r` — Radius (distance from origin)
  - `theta` — Angle in radians

```js
polarToCartesian(1, Math.PI / 2); // [≈0, 1]
```

### `pointAlong(vector1, vector2, proportion)`

Linearly interpolates between two vectors. At `proportion = 0` returns `vector1`, at `1` returns `vector2`.

- **Parameters:**
  - `vector1` — Start point
  - `vector2` — End point
  - `proportion` — Interpolation factor (typically 0–1, but extrapolation works too)

```js
pointAlong([0, 0], [10, 10], 0.5); // [5, 5]
```

### `centroid(points)`

Returns the average of a list of points — the middle of a polygon. Handy for placing something at the centre of a triangle or hexagon from a grid.

- **Parameters:**
  - `points` — A non-empty array of points

```js
centroid([[0, 0], [6, 0], [3, 6]]); // [3, 2]
```
