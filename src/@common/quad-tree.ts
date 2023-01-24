import { Vector } from "./vector";

export interface Spatial {
  pos: Vector;
}

export class QuadTree<T extends Spatial> {
  public nodeCount: number = 0;
  public nodes: T[] = [];
  public children: [QuadTree<T>, QuadTree<T>] | null;

  constructor(
    public depth: number,
    public tl: Vector,
    public br: Vector,
    public parent: QuadTree<T> | null = null
  ) {
    if (depth > 0) {
      if (depth % 2) {
        const mid = (tl.x + br.x) / 2;

        this.children = [
          new QuadTree(depth - 1, tl, new Vector(mid, br.y), this),
          new QuadTree(depth - 1, new Vector(mid, tl.y), br, this),
        ];
      } else {
        const mid = (tl.y + br.y) / 2;

        this.children = [
          new QuadTree(depth - 1, tl, new Vector(br.x, mid), this),
          new QuadTree(depth - 1, new Vector(tl.x, mid), br, this),
        ];
      }
    }
  }

  inBound(vector: Vector): boolean {
    return (
      this.tl.x < vector.x &&
      vector.x < this.br.x &&
      this.tl.y < vector.y &&
      vector.y < this.br.y
    );
  }

  shortestDistanceWithinHeuristic(
    vector: Vector,
    oerHeuristic: number
  ): boolean {
    if (this.inBound(vector)) return true;
    if (
      Math.abs(this.tl.x - vector.x) < oerHeuristic ||
      Math.abs(this.br.x - vector.x) < oerHeuristic ||
      Math.abs(this.tl.y - vector.y) < oerHeuristic ||
      Math.abs(this.br.y - vector.y) < oerHeuristic
    )
      return true;
    else return false;
  }

  // TODO: This needs to know if it includes self
  closestWithDst(
    el: T,
    oerHeuristic = Number.POSITIVE_INFINITY,
    canGoUp = true
  ): [number, T] | null {
    if (!this.shortestDistanceWithinHeuristic(el.pos, oerHeuristic))
      return null;

    if (this.nodeCount > +this.inBound(el.pos) && canGoUp)
      return this.parent && this.parent.closestWithDst(el, oerHeuristic);

    if (this.children != null) {
      const a = this.children[0].closestWithDst(el, oerHeuristic, false);
      const b = this.children[1].closestWithDst(
        el,
        a ? a[0] : oerHeuristic,
        false
      );

      if (b != null) return b;
      else return a;
    } else {
      let closest: T | null = null;

      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];
        if (node == el) continue;
        const dst = el.pos.sub(this.nodes[i].pos).norm;

        if (dst < oerHeuristic) {
          oerHeuristic = dst;
          closest = node;
        }
      }
      if (closest) return [oerHeuristic, closest];
      else return null;
    }
  }
  closest(el: T, oerHeuristic = Number.POSITIVE_INFINITY): T | null {
    const a = this.closestWithDst(el, oerHeuristic);
    if (a) return a[1];
    else return null;
  }

  insert(el: T): QuadTree<T> | null {
    if (!this.inBound(el.pos)) return this.parent && this.parent.insert(el);

    this.nodeCount++;
    if (this.children)
      if (this.children[0].inBound(el.pos)) return this.children[0].insert(el);
      else return this.children[1].insert(el);

    this.nodes.push(el);

    return this;
  }

  reduceUpwards(): void {
    this.nodeCount--;

    if (this.parent) return this.parent.reduceUpwards();
  }

  pop(el: T): void {
    if (!this.inBound(el.pos)) {
      return this.parent && this.parent.pop(el);
    }

    if (this.children)
      if (this.children[0].inBound(el.pos)) return this.children[0].pop(el);
      else return this.children[1].pop(el);

    const idx = this.nodes.findIndex((v) => v === el);

    if (idx == -1) return;

    this.nodes.splice(idx, 1);

    this.reduceUpwards();
  }

  clear(): void {
    if (this.children)
      return void [this.children[0].clear(), this.children[1].clear()];

    this.nodes = [];
  }
}
