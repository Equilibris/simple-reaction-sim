import { Vector } from "@common/vector";
import { drawCircle } from "@common/render-primitives";
import { Spatial } from "@common/quad-tree";

const draw = document.getElementById("draw") as HTMLCanvasElement;

draw.width = window.innerWidth;
draw.height = window.innerHeight;

const ctx = draw.getContext("2d")!;

const area = new Vector(window.innerWidth, window.innerHeight);

const statePtr = { mu: 1, count: 100, center: true };

const NULL_VEC = new Vector(0, 0);
const SCALE = 1;
const SIZE = 10;
const GAMMA = 10;
const EPSILON = 15; // Strong force

const center = area.mul(0.5);

class Point {
  id: symbol;

  constructor(
    public mass: number = 1,
    public pos: Vector = NULL_VEC,
    public vel: Vector = NULL_VEC
  ) {
    this.id = Symbol();
  }

  eq(other: Point) {
    return other.id === this.id;
  }

  update(force: Vector) {
    const acc = force.mul(1 / this.mass);

    this.pos = this.pos.add(this.vel).add(area).mod(area);
    this.vel = this.vel.add(acc).mul(statePtr.mu);
  }

  draw() {
    const circle = new Path2D();
    circle.arc(this.pos.x * SCALE, this.pos.y * SCALE, SIZE, 0, 2 * Math.PI);

    ctx.fill(circle);
  }
}

class Collection {
  constructor(public points: Point[]) {}

  update() {
    let apos = Vector.zero();

    for (const a of this.points) {
      let f = Vector.zero();

      for (const b of this.points) {
        if (!a.eq(b)) {
          const b2a = b.pos.sub(a.pos);

          if (b2a.norm > EPSILON) {
            f = f.add(
              b2a
                .normalize()
                .mul((a.mass * b.mass * GAMMA) / (b2a.norm * b2a.norm))
            );
          }
        }
      }
      a.update(f);
      apos = apos.add(a.pos);
    }
    if (statePtr.center) {
      const avg = apos.mul(1 / this.points.length);

      for (const a of this.points) {
        a.pos = a.pos.sub(avg).add(center);
      }
    }
  }

  draw() {
    for (const p of this.points) {
      p.draw();
    }
  }
}

const gen = () =>
  [...Array(statePtr.count)]
    .map(() => new Vector(Math.random() * area.x, Math.random() * area.y))
    .map((x) => new Point(1, x));
const col = new Collection(gen());

const render = () => {
  ctx.clearRect(0, 0, 100_000, 100_000);
  col.draw();
  col.update();

  requestAnimationFrame(render);
};

const countEl = document.getElementById("count") as HTMLInputElement;
const muEl = document.getElementById("mu") as HTMLInputElement;
const centerEl = document.getElementById("center") as HTMLInputElement;
const restartEl = document.getElementById("restart") as HTMLButtonElement;

countEl.onchange = (e) => {
  const count = parseInt(countEl.value);

  console.log({ count });
  if (!isNaN(count)) statePtr.count = count;
};

muEl.onchange = (e) => {
  const mu = parseFloat(muEl.value);

  console.log({ mu });

  if (!isNaN(mu)) statePtr.mu = mu;
};

centerEl.onchange = (e) => {
  const center = centerEl.checked;

  console.log({ center });

  statePtr.center = center;
};

restartEl.onclick = (_) => {
  console.log(statePtr);
  col.points = gen();
};

console.log(countEl, muEl, centerEl, restartEl);

render();
