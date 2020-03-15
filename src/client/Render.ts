// Client only -- Renders stuff to the screen
import Vector from '../common/engine/Vector';
import Fighter from '../common/engine/Fighter';

import Animator from './animation/Animator';

import Particle from './particles/Particle';
import PLightning from './particles/Lightning';

import Camera from '../common/engine/Camera';
import Map from '../common/engine/Map';
// Needs particle module
// Needs camera module??

// Particles should be ticked separately from physics as they are unused by the server
// --server notifies clients to render them but does not need to update them


class Renderer {
  /* eslint-disable no-param-reassign */
  public static DrawScreen(
    canvas: CanvasRenderingContext2D,
    camera: Camera,
    map: Map,
    fighters: Fighter[],
    animators: Animator[],
    particles: Particle[],
  ) {
    canvas.resetTransform();

    const offsetX = camera.Width / 2;
    const offsetY = camera.Height / 2;
    const zoom = camera.Zoom;

    // Draw arena boundaries
    const corner0 = camera.PositionOffsetMap(new Vector(0, 0, 0), offsetX, offsetY);
    const corner1 = camera.PositionOffsetMap(new Vector(map.Width, 0, 0), offsetX, offsetY);
    const corner2 = camera.PositionOffsetMap(
      new Vector(map.Width, map.Height, 0),
      offsetX, offsetY,
    );
    const corner3 = camera.PositionOffsetMap(new Vector(0, map.Height, 0), offsetX, offsetY);

    canvas.drawImage(map.Texture, 0, 0, 2048, 2048, corner0.x, corner0.y - map.Height * zoom, map.Width * zoom, map.Height * zoom);

    canvas.strokeStyle = '#ff0000';
    canvas.globalAlpha = 1;
    canvas.lineWidth = zoom * 0.1;
    canvas.lineCap = 'round';
    canvas.beginPath();
    canvas.moveTo(corner0.x, corner0.y);
    canvas.lineTo(corner1.x, corner1.y);
    canvas.lineTo(corner2.x, corner2.y);
    canvas.lineTo(corner3.x, corner3.y);
    canvas.closePath();
    canvas.stroke();

    // Draw in fighters
    for (let i = 0; i < fighters.length; i++) {
      const a = fighters[i];
      const pos = camera.PositionOffset(a.Position);

      // First, draw shadow
      canvas.fillStyle = '#000000';
      canvas.globalAlpha = 0.5;
      canvas.fillRect(
        (-pos.x - a.Radius * 1.1) * zoom + offsetX,
        (pos.y + a.Height / 1.5) * zoom + offsetY,
        2 * a.Radius * 1.1 * zoom, (a.Height * zoom) / 2,
      );
      canvas.globalAlpha = 1;

      if (animators[i]) { // If we can find an animator for this fighter, use it
        const b = animators[i];

        let row = b.row * 2;
        if (a.Flipped) row++;

        canvas.drawImage(
          b.SpriteSheet,
          b.FrameWidth * b.frame,
          b.FrameHeight * row,
          b.FrameWidth,
          b.FrameHeight,
          (-pos.x - a.Radius * b.Upscale) * zoom + offsetX,
          (pos.y + pos.z - (a.Height * (b.Upscale - 1))) * zoom + offsetY,
          2 * a.Radius * b.Upscale * zoom,
          a.Height * b.Upscale * zoom,
        );
        canvas.resetTransform();
      } else { // Otherwise, draw a box
        canvas.fillStyle = '#000000';
        canvas.fillRect(
          (-pos.x - a.Radius) * zoom + offsetX,
          (pos.y + pos.z) * zoom + offsetY,
          2 * a.Radius * zoom,
          a.Height * zoom,
        );
      }
    }
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      canvas.strokeStyle = a.RenderStyle;
      canvas.globalAlpha = a.Alpha;
      canvas.lineWidth = zoom * a.Width;

      const pos1 = camera.PositionOffsetMap(a.Beginning, offsetX, offsetY);
      const pos2 = camera.PositionOffsetMap(a.End, offsetX, offsetY);

      canvas.beginPath();
      canvas.moveTo(pos1.x, pos1.y);

      if (a.Type === 'Lightning') {
        const l = <PLightning>(a);
        for (let j = 0; j < l.Segments.length; j++) {
          const seg = camera.PositionOffsetMap(l.Segments[j], offsetX, offsetY);
          canvas.lineTo(seg.x, seg.y);
        }
      }

      canvas.lineTo(pos2.x, pos2.y);
      canvas.stroke();
      // canvas.closePath();
    }
  }
  /* eslint-enable no-param-reassign */
}

export { Renderer as default };
