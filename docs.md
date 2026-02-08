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
