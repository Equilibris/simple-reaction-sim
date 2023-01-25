import { Vector } from "@common/vector";
import { drawLine } from "@common/render-primitives";
import {
  br,
  buildControls,
  button,
  hr,
  id,
  num,
  percent,
} from "@common/control-renderer/index";

const draw = document.getElementById("draw") as HTMLCanvasElement;

draw.width = window.innerWidth;
draw.height = window.innerHeight;

const state = buildControls(
  {
    k: 64,
    margin: 5,
    dt: 1,
    trackerCount: 64,
    killSpeed: 100,

    count: 100,

    tacc: 0.1,

    chargeProbability: 0.5,

    chromamod: 1,

    thickness: 1,

    ctx: draw.getContext("2d")!,
  },
  [
    num("count", id),
    num("trackerCount", id),
    percent("chargeProbability", id),
    hr(),
    percent("tacc", id),
    percent("chromamod", id),
    hr(),
    num("killSpeed", id),
    br(),
    button(regenerate, "Regenerate"),
  ]
);

const trackers: FieldTracker[] = [];
const staticBodies: ChargedStaticBody[] = [];

function regenerate(_: unknown) {
  console.log(state);

  state.ctx.beginPath();
  state.ctx.fillStyle = "black";
  state.ctx.fillRect(0, 0, 100_000, 100_000);

  state.dt = 1;

  trackers.splice(0, trackers.length);
  staticBodies.splice(0, staticBodies.length);

  for (let i = 0; i < state.count; i++) {
    const body = new ChargedStaticBody(
      new Vector(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight
      ),
      // 1
      2 * +(Math.random() > state.chargeProbability) - 1
    );
    staticBodies.push(body);

    for (const tracker of body.emitTrackers()) trackers.push(tracker);
  }
}

const globalTranslate = new Vector(0, 0);

class FieldTracker {
  public lastVel: Vector = Vector.zero();

  constructor(public pos: Vector, public flow = 1) {}

  update(bodies: ChargedStaticBody[]) {
    let force_sum = Vector.zero();
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];

      force_sum = force_sum.add(body.calcForce(this.pos));
    }

    force_sum = force_sum.mul(state.dt * this.flow);
    const oldPos = this.pos;
    this.pos = this.pos.add(force_sum);

    if (
      oldPos.sub(this.pos).norm > state.killSpeed ||
      this.lastVel.dot(force_sum) < 0
    ) {
      this.flow = 0;
      return;
    }

    this.lastVel = this.pos.sub(oldPos);

    state.ctx.beginPath();
    drawLine(
      state.ctx,
      oldPos.add(globalTranslate),
      this.pos.add(globalTranslate)
    );
    state.ctx.strokeStyle = `hsl(${state.chromamod * state.dt},100%,50%)`;
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

regenerate(null);

const update = () => {
  for (let i = 0; i < trackers.length; i++) trackers[i].update(staticBodies);

  state.dt = (state.dt ** 0.5 + state.tacc) ** 2;

  requestAnimationFrame(update);
};

requestAnimationFrame(update);
