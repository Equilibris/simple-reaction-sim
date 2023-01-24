import { Vector } from "../../@common/vector";
import { drawCircle, drawLine } from "../../@common/render-primitives";
import { Spatial, QuadTree } from '../../@common/quad-tree'

// const COL_A = "#bf616a"
// const COL_B = "#a3be8c"
// const COL_AB = "#b48ead"
const COL_A = "red"
const COL_B = "blue"
const COL_AB = "green"
// const COL_A = "red"
// const COL_B = "white"
// const COL_AB = "green"

enum ParticleClass {
  A,
  B,
  AB,

  Disabled,
}

const draw = document.getElementById("draw") as HTMLCanvasElement;

draw.width = window.innerWidth;
draw.height = window.innerHeight;

const TOP_SIZE_PERCENT = 0.75;
const BALL_SIZE = .5;

const area = new Vector(window.innerWidth, window.innerHeight * TOP_SIZE_PERCENT)
const state = {
  dt: 1,
  tacc: 1.001,

  vel: 10,
  count: 10_000,
  aoverb: 0.5,

  mass_a: 50,
  mass_b: 10,

  merge_dst: .5,
  rand: .01,

  allowRender: false,
  area,
  draw_translation: Vector.zero(),
  game: new QuadTree<Particle>(20, Vector.zero(), area),

  ctx: draw.getContext("2d")!,
};

const mass_map: Record<ParticleClass, number> = {
  [ParticleClass.A]: state.mass_a,
  [ParticleClass.B]: state.mass_b,
  [ParticleClass.AB]: state.mass_b + state.mass_a,
  [ParticleClass.Disabled]: 1,
};

state.ctx.beginPath();
state.ctx.fillStyle = "black";
state.ctx.fillRect(0, 0, 100_000, 100_000);

class Particle implements Spatial {
  public cell: QuadTree<Particle> | null
  constructor(
    public cls: ParticleClass,
    public pos: Vector = new Vector(
      state.area.x * Math.random(),
      state.area.y * Math.random()
    ),
    public vel = Vector.angled(Math.random() * 2 * Math.PI, 1 / mass_map[cls]),
  ) {
        this.cell = state.game.insert(this)!
    }

  travel() {
    this.pos = this.pos
      .add(this.vel
           .add(Vector.angled(Math.PI * 2 * Math.random(), Math.random() * state.rand / mass_map[this.cls]))
           .mul(state.vel * state.dt)
          )
      .add(state.area)
      .mod(state.area);

    if (this.cell) this.cell.pop(this)

    this.cell = (this.cell ? this.cell: state.game).insert(this)
  }
  draw() {
    if (!state.allowRender) return
      // sqrt(A/pi) = r
    const mass = Math.sqrt(mass_map[this.cls] / Math.PI)

    state.ctx.beginPath();
    drawCircle(state.ctx, this.pos.add(state.draw_translation), mass * BALL_SIZE);

    switch (this.cls) {
      case ParticleClass.A:
        state.ctx.fillStyle = COL_A
        break;
      case ParticleClass.B:
        state.ctx.fillStyle = COL_B
        break;
      case ParticleClass.AB:
        state.ctx.fillStyle = COL_AB
        break;
      default:
    }
    state.ctx.fill();
  }
}

const particles: Particle[] = [];

let i = 0;

const update = () => {
  state.ctx.fillStyle = "#00000005";
  state.ctx.fillRect(0, 0, area.x, area.y);

  let a = 0;
  let b = 0;
  let ab = 0;

  a: for (const particle of particles) {
    particle.draw();
    particle.travel();

    switch (particle.cls) {
      case ParticleClass.A:
        a++;
        break;
      case ParticleClass.B:
        b++;
        break;
      case ParticleClass.AB:
        ab++;
        continue a
      default:
        continue a
    }

    if (!particle.cell) particle.cell = state.game.insert(particle)
    if (!particle.cell) continue

    const closest = particle.cell.closest(particle, state.vel * state.merge_dst)

    if (closest
        && closest.cls != ParticleClass.AB
        && closest.cls != ParticleClass.Disabled
        && closest.cls != particle.cls
       ) {
        const mi = mass_map[particle.cls];
        const mj = mass_map[closest.cls];

        const new_vel = closest.vel
          .mul(mj)
          .add(particle.vel.mul(mi))
          .mul(1 / (mi + mj));

        closest.cls = ParticleClass.Disabled;
        particle.cls = ParticleClass.AB;
        particle.vel = new_vel;

        if (closest.cell) closest.cell.pop(closest)
        particle.cell.pop(particle)
        closest.cell = null
        particle.cell = null
    }
  }

  i += 1;
  i %= area.x;

  const total = a + b + ab;

  const full = ((1 - TOP_SIZE_PERCENT) * area.y) / TOP_SIZE_PERCENT;
  let ch = area.y / TOP_SIZE_PERCENT;

  {
    let diff = (full * a) / total;
    state.ctx.beginPath();
    state.ctx.moveTo(i, ch);
    state.ctx.lineTo(i, ch - diff);
    ch -= diff;
    state.ctx.strokeStyle = COL_A
    state.ctx.stroke();
  }
  {
    let diff = (full * b) / total;
    state.ctx.beginPath();
    state.ctx.moveTo(i, ch);
    state.ctx.lineTo(i, ch - diff);
    ch -= diff;
    state.ctx.strokeStyle = COL_B
    state.ctx.stroke();
  }
  {
    let diff = (full * ab) / total;
    state.ctx.beginPath();
    state.ctx.moveTo(i, ch);
    state.ctx.lineTo(i, ch - diff);
    ch -= diff;
    state.ctx.strokeStyle = COL_AB
    state.ctx.stroke();
  }

  state.dt *= state.tacc;

  requestAnimationFrame(update);
};

requestAnimationFrame(update);

const attachListner = (id:string,onUpdate: (value: number) => void) => {
    const el = document.getElementById(id) as HTMLInputElement
    el.addEventListener("change",(e)=>{
        onUpdate(parseFloat((e.currentTarget as HTMLInputElement).value))
    })

    onUpdate(parseFloat(el.value))
}

attachListner("acc",    (v) => state.tacc      = 1 + v/1000)
attachListner("coldst", (v) => state.merge_dst = v/100)
attachListner("vel",    (v) => state.vel       = v)
attachListner("p",(p)=>{
    p /= 100

    state.allowRender = false;
    state.area = area.mul(p)
    state.draw_translation = area.sub(state.area).mul(1/2)

    requestAnimationFrame(()=>{
        state.allowRender = true;
    })
})
attachListner("ma",(a)=>{
    state.mass_a = a

    mass_map[ParticleClass.A] = a
    mass_map[ParticleClass.AB] = state.mass_b + a
})
attachListner("mb",(b)=>{
    state.mass_b = b

    mass_map[ParticleClass.B] = b
    mass_map[ParticleClass.AB] = state.mass_a + b
})
attachListner("chance",(c)=> state.aoverb = c/100)
attachListner("rand",(c)=> state.rand = c/10)
attachListner("count",(c)=>  state.count  = c)

const regen = () => {
    state.ctx.fillStyle = '#000E'
    state.ctx.fillRect(0,0,10000,10000)

    state.game.clear()

    state.dt = 1

    particles.splice(0,particles.length)


    for (let i = 0; i < state.count; i++)
      particles.push(
        new Particle(i > state.aoverb * state.count ? ParticleClass.A : ParticleClass.B)
      );
}

regen()

document.getElementById("controlls").addEventListener("submit",e => {
    e.preventDefault()

    regen()
})
