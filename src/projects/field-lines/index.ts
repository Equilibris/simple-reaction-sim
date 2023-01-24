import { Vector } from "@common/vector";
import { drawLine } from "@common/render-primitives";

const draw = document.getElementById("draw") as HTMLCanvasElement;

draw.width = window.innerWidth;
draw.height = window.innerHeight;

const TOP_SIZE_PERCENT = 0.75;
const BALL_SIZE = .5;

const area = new Vector(window.innerWidth, window.innerHeight * TOP_SIZE_PERCENT)

const state = {
  k: 64,
  margin: 5,
  dt: 1,
  trackerCount: 64,
  killSpeed: 100,

  tacc: .1,

  thickness: 1,

  ctx: draw.getContext("2d")!,
};

state.ctx.beginPath();
state.ctx.fillStyle = "black";
state.ctx.fillRect(0, 0, 100_000, 100_000);

const globalTranslate = new Vector(0, 0);

class FieldTracker {
  constructor(public pos: Vector, public flow = 1) {}

  update(bodies: ChargedStaticBody[]) {
    let force_sum = Vector.zero();
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];

      force_sum = force_sum.add(body.calcForce(this.pos));
    }

    const oldPos = this.pos;
    this.pos = this.pos.add(force_sum.mul(state.dt * this.flow));

    if (oldPos.sub(this.pos).norm > state.killSpeed) {
      this.flow = 0;
      return;
    }

    state.ctx.beginPath();
    drawLine(
      state.ctx,
      oldPos.add(globalTranslate),
      this.pos.add(globalTranslate)
    );
    state.ctx.strokeStyle = `hsl(${state.dt},100%,50%)`;
    state.ctx.stroke();
    // drawCircle(state.ctx, this.pos.add(globalTranslate), 1);
  }
}

class ChargedStaticBody {
  constructor(public pos: Vector, public charge: number) {}

  calcForce(pos: Vector): Vector {
    const to = this.pos.sub(pos);

    return to.normalize().mul((state.k * this.charge) / to.norm ** 2);
  }

  emitTrackers(): FieldTracker[] {
    const out: FieldTracker[] = [];
    for (let i = 0; i < state.trackerCount; i++) {
      const pos = (i * Math.PI * 2) / state.trackerCount;

      out.push(
        new FieldTracker(
          this.pos.add(Vector.angled(pos, state.margin)),
          -this.charge
        )
      );
    }
    return out;
  }
}

const staticBodies: ChargedStaticBody[] = [
  // new ChargedStaticBody(new Vector(window.innerWidth /2+300, window.innerHeight /2), 1.0),
  // new ChargedStaticBody(new Vector(window.innerWidth /2-300, window.innerHeight /2), 1),
  // new ChargedStaticBody(new Vector(100, 100), -1),
  // new ChargedStaticBody(new Vector(400, 400), 1),
];
for (let i = 0; i < 100; i++)
  staticBodies.push(
    new ChargedStaticBody(
      new Vector(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight
      ),
      // 1
      2 * +(Math.random() > 0.5) - 1
    )
  );

const trackers = staticBodies.flatMap((v) => v.emitTrackers());

const update = () => {
  for (let i = 0; i < trackers.length; i++) trackers[i].update(staticBodies);

  state.dt = (state.dt**0.5 + state.tacc)**2

  requestAnimationFrame(update);
};

requestAnimationFrame(update);
