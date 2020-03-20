// Client only -- Renders stuff to the screen
import Vector from '../common/engine/Vector';
import Fighter from '../common/engine/Fighter';

import Animator from './animation/Animator';

import Projectile from '../common/engine/projectiles/Projectile';

import Particle from './particles/Particle';
import PLightning from './particles/Lightning';

import Camera from './Camera';
import Map from '../common/engine/Map';

function GetArenaBounds(camera: Camera, map: Map, fighters: Fighter[]):Vector[] {
  const corners = [camera.PositionOffset(new Vector(0, 0, 0))];
  for (let i = 0; i < fighters.length; i++) {
    const fi = fighters[i];
    if (fi.Position.y - (fi.Radius * 2) < 0) {
      const pos = Vector.Clone(fi.Position);
      pos.y -= fi.Radius * 2;
      corners.push(camera.PositionOffset(pos));
    }
  }
  corners.push(camera.PositionOffset(new Vector(map.Width, 0, 0)));
  for (let i = 0; i < fighters.length; i++) {
    const fi = fighters[i];
    if (fi.Position.x + fi.Radius > map.Width) {
      const pos = Vector.Clone(fi.Position);
      pos.x += fi.Radius;
      corners.push(camera.PositionOffset(pos));
    }
  }
  corners.push(camera.PositionOffset(new Vector(map.Width, map.Height, 0)));
  for (let i = 0; i < fighters.length; i++) {
    if (fighters[i].Position.y > map.Height) corners.push(camera.PositionOffset(fighters[i].Position));
  }
  corners.push(camera.PositionOffset(new Vector(0, map.Height, 0)));
  for (let i = 0; i < fighters.length; i++) {
    const fi = fighters[i];
    if (fi.Position.x - fi.Radius < 0) {
      const pos = Vector.Clone(fi.Position);
      pos.x -= fi.Radius;
      corners.push(camera.PositionOffset(pos));
    }
  }
  return corners;
}


function DepthSortAnimators(a: any, b: any): number {
  if (a.GetOwner().Position.y < b.GetOwner().Position.y) return 1;
  if (a.GetOwner().Position.y > b.GetOwner().Position.y) return -1;
  return 0;
}


class Renderer {
  /* eslint-disable no-param-reassign */
  public static DrawScreen(
    canvas: CanvasRenderingContext2D,
    camera: Camera,
    map: Map,
    fighters: Fighter[],
    animators: Animator[],
    projectiles: Projectile[],
    particles: Particle[],
  ) {
    canvas.resetTransform();

    const offsetX = camera.Width / 2;
    const offsetY = camera.Height / 2;
    const zoom = camera.Zoom;

    // Draw arena boundaries
    const corners = GetArenaBounds(camera, map, fighters);
    canvas.drawImage(map.Texture, 0, 0, 2048, 2048, corners[0].x, corners[0].y - map.Height * zoom, map.Width * zoom, map.Height * zoom);
    canvas.strokeStyle = '#ff0000';
    canvas.globalAlpha = 1;
    canvas.lineWidth = zoom * 0.1;
    canvas.lineCap = 'round';
    canvas.beginPath();
    canvas.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      canvas.lineTo(corners[i].x, corners[i].y);
    }
    canvas.closePath();
    canvas.stroke();


    // Depth-Sort fighters
    const drawFighters = animators.slice(0).sort(DepthSortAnimators);

    // Draw in fighters
    for (let i = 0; i < drawFighters.length; i++) {
      const a = drawFighters[i].GetOwner();
      const pos = camera.PositionOffsetBasic(a.Position);

      // First, draw shadow
      canvas.fillStyle = '#000000';
      canvas.globalAlpha = 0.5;
      canvas.fillRect(
        (-pos.x - a.Radius * 1.1) * zoom + offsetX,
        (pos.y + a.Height / 1.5) * zoom + offsetY,
        2 * a.Radius * 1.1 * zoom, (a.Height * zoom) / 2,
      );
      canvas.globalAlpha = 1;

      if (drawFighters[i].SpriteSheet) { // If we can find an animator for this fighter, use it
        const b = drawFighters[i];

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


    // Draw Projectiles
    canvas.globalAlpha = 1;
    for (let i = 0; i < projectiles.length; i++) {
      const a = projectiles[i];
      canvas.strokeStyle = a.RenderStyle;
      canvas.lineWidth = zoom * a.Width;

      const pos1 = camera.PositionOffset(Vector.Subtract(a.Position, Vector.Multiply(Vector.UnitVector(a.Velocity), a.Length)));
      const pos2 = camera.PositionOffset(a.Position);

      canvas.beginPath();
      canvas.moveTo(pos1.x, pos1.y);
      canvas.lineTo(pos2.x, pos2.y);
      canvas.stroke();
    }


    // Draw Particles
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      canvas.strokeStyle = a.RenderStyle;
      canvas.globalAlpha = a.Alpha;
      canvas.lineWidth = zoom * a.Width;

      const pos1 = camera.PositionOffset(a.Beginning);
      const pos2 = camera.PositionOffset(a.End);

      canvas.beginPath();
      canvas.moveTo(pos1.x, pos1.y);

      if (a.Type === 'Lightning') {
        const l = <PLightning>(a);
        for (let j = 0; j < l.Segments.length; j++) {
          const seg = camera.PositionOffset(l.Segments[j]);
          canvas.lineTo(seg.x, seg.y);
        }
      }

      canvas.lineTo(pos2.x, pos2.y);
      canvas.stroke();
    }
  }

  public static DrawPlayerList(canvas: CanvasRenderingContext2D, cam: Camera, data: string) {
    canvas.resetTransform();
    const cornerX = cam.Width / 6;
    const cornerY = cam.Height / 6;
    const sizeX = cam.Width * (2 / 3);
    const sizeY = cam.Height * (2 / 3);

    const fontSize = 48; // sizeX / 100;

    canvas.fillStyle = '#ffffff';
    canvas.globalAlpha = 0.9;
    canvas.fillRect(cornerX, cornerY, sizeX, sizeY);

    canvas.fillStyle = '#000000';
    canvas.font = `${fontSize}px roboto`;
    canvas.textBaseline = 'hanging';
    canvas.fillText(data, cornerX, cornerY, sizeX);
  }
  /* eslint-enable no-param-reassign */
}

export { Renderer as default };
