import { Vector } from "@common/vector";
import { drawCircle } from "@common/render-primitives";
import { Spatial } from "@common/quad-tree";
import {
  buildControls,
  button,
  hr,
  id,
  num,
  percent,
  range,
} from "@common/control-renderer/index";

const draw = document.getElementById("draw") as HTMLCanvasElement;

draw.width = window.innerWidth;
draw.height = window.innerHeight;

const ctx = draw.getContext("2d")!;

const area = new Vector(window.innerWidth, window.innerHeight);

const state = buildControls(
  { mu: 1, count: 100, center: true, gamma: 10, epsilon: 15, point_scale: 10 },
  [
    range("center", (v) => v > 0, 0, 1),
    hr(),
    num("gamma", id),
    num("epsilon", id),
    percent("mu", id),
    hr(),
    range("point_scale", id, 1, 10),
    hr(),
    num("count", id),

    button(regenerate, "Regenerate"),
  ]
);

function regenerate(_: unknown) {
  col.points = gen();
}

const NULL_VEC = new Vector(0, 0);

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
    this.vel = this.vel.add(acc).mul(state.mu);
  }

  draw() {
    ctx.beginPath();
    drawCircle(ctx, this.pos, state.point_scale);
    ctx.fill();
  }
}

class Collection {
  constructor(public points: Point[]) {}

  update() {
    let a_pos = Vector.zero();

    for (const a of this.points) {
      let f = Vector.zero();

      for (const b of this.points) {
        if (!a.eq(b)) {
          const b2a = b.pos.sub(a.pos);

          if (b2a.norm > state.epsilon) {
            f = f.add(
              b2a
                .normalize()
                .mul((a.mass * b.mass * state.gamma) / (b2a.norm * b2a.norm))
            );
          }
        }
      }
      a.update(f);
      a_pos = a_pos.add(a.pos);
    }
    if (state.center) {
      const avg = a_pos.mul(1 / this.points.length);

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
  [...Array(state.count)]
    .map(() => new Vector(Math.random() * area.x, Math.random() * area.y))
    .map((x) => new Point(1, x));
const col = new Collection(gen());

const render = () => {
  ctx.fillStyle = "#FFF1";
  ctx.fillRect(0, 0, 100_000, 100_000);
  ctx.fillStyle = "black";
  col.draw();
  col.update();

  requestAnimationFrame(render);
};

regenerate(null);

render();
