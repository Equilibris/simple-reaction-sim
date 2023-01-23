import { Vector } from "./vector";

export const drawCircle = (
  ctx: CanvasRenderingContext2D,
  pos: Vector,
  thickness = 1
) => {
  ctx.arc(pos.x, pos.y, thickness, 0, Math.PI * 2);
};

export const drawLine = (
  ctx: CanvasRenderingContext2D,
  f: Vector,
  t: Vector
) => {
  ctx.moveTo(f.x, f.y); // Move the pen to (30, 50)
  ctx.lineTo(t.x, t.y); // Draw a line to (150, 100)
};
