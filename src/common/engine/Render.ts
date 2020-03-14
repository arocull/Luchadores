// Client only -- Renders stuff to the screen
import Vector from './Vector';
import Fighter from './Fighter';
import Camera from './Camera';
import Map from './Map';
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
  ) {
    canvas.resetTransform();
    // canvas.clearRect(0, 0, camera.Width, camera.Height);
    // canvas.transform(camera.Zoom, 0, 0, camera.Zoom, 0, 0);

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
    canvas.strokeStyle = '#ff0000';
    canvas.globalAlpha = 1;
    canvas.lineWidth = zoom * 0.1;
    canvas.beginPath();
    canvas.moveTo(corner0.x, corner0.y);
    canvas.lineTo(corner1.x, corner1.y);
    canvas.lineTo(corner2.x, corner2.y);
    canvas.lineTo(corner3.x, corner3.y);
    canvas.lineTo(corner0.x, corner0.y);
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

      /* if (a.Flipped)
              canvas.scale(-1,1);
          else
              canvas.scale(1,1); */

      canvas.fillStyle = '#000000';
      canvas.globalAlpha = 1;
      canvas.fillRect(
        (-pos.x - a.Radius) * zoom + offsetX,
        (pos.y + pos.z) * zoom + offsetY, 2 * a.Radius * zoom,
        a.Height * zoom,
      );
    }
  }
  /* eslint-enable no-param-reassign */
}

export { Renderer as default };
