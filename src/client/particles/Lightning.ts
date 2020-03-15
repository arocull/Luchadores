import Vector from '../../common/engine/Vector';
import Particle from './Particle';

class PLightning extends Particle {
  public Segments: Vector[];

  constructor(public SegmentLength: number, beginning: Vector, end: Vector) {
    super('Lightning', 0.2, '#88bbff', beginning, end);

    let pos = beginning;
    this.Segments = [];
    this.Width = 0.1;

    for (let i = 0; i < Math.floor(Vector.DistanceXY(beginning, end) / SegmentLength) - 1; i++) {
      const dir = Vector.UnitVectorXY(Vector.Subtract(end, pos));
      const d = new Vector(
        dir.x + ((Math.random() * 2) - 1) * SegmentLength,
        dir.y + ((Math.random() * 2) - 1) * SegmentLength,
        0,
      );

      pos = Vector.Add(pos, Vector.Multiply(d, SegmentLength));
      this.Segments.push(pos);
    }
  }
}

export { PLightning as default };
