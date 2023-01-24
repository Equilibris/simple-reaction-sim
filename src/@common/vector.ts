export class Vector {
  static zero(): Vector {
    return new Vector(0, 0);
  }
  static angled(angle: number, mag: number): Vector {
    return new Vector(Math.cos(angle) * mag, Math.sin(angle) * mag);
  }

  constructor(public x: number, public y: number) {}

  add(other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y);
  }
  sub(other: Vector): Vector {
    return new Vector(this.x - other.x, this.y - other.y);
  }
  mul(other: number): Vector {
    return new Vector(this.x * other, this.y * other);
  }
  mod(other: Vector): Vector {
    return new Vector(this.x % other.x, this.y % other.y);
  }

  get norm(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  get neg(): Vector {
    return this.mul(-1);
  }

  normalize(): Vector {
    return this.mul(1 / this.norm);
  }
}
