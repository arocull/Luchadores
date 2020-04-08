// Client only -- Renders stuff to the screen
/* eslint-disable object-curly-newline */
import Vector from '../common/engine/Vector';
import { EntityType, ParticleType, ProjectileType, UIFrameType } from '../common/engine/Enums';
import Entity from '../common/engine/Entity';
import { Fighter } from '../common/engine/fighters/index';
import Animator from './animation/Animator';
import { Projectile } from '../common/engine/projectiles/index';
import { Particle, PLightning } from './particles/index';
import { UIFrame, UITextBox } from './ui/index';
import Camera from './Camera';
import Map from '../common/engine/Map';
/* eslint-enable object-curly-newline */

function GetArenaBounds(camera: Camera, map: Map, fighters: Fighter[]):Vector[] {
  const corners = [camera.PositionOffset(new Vector(0, 0, 0))];
  for (let i = 0; camera.Settings.Quality > 1 && i < fighters.length; i++) {
    const fi = fighters[i];
    if (fi.Position.y - fi.Radius < 0) {
      const pos = Vector.Clone(fi.Position);
      pos.y -= fi.Radius;
      corners.push(camera.PositionOffset(pos));
    }
  }
  corners.push(camera.PositionOffset(new Vector(map.Width, 0, 0)));
  for (let i = 0; camera.Settings.Quality > 1 && i < fighters.length; i++) {
    const fi = fighters[i];
    if (fi.Position.x + fi.Radius > map.Width) {
      const pos = Vector.Clone(fi.Position);
      pos.x += fi.Radius;
      corners.push(camera.PositionOffset(pos));
    }
  }
  corners.push(camera.PositionOffset(new Vector(map.Width, map.Height, 0)));
  for (let i = 0; camera.Settings.Quality > 1 && i < fighters.length; i++) {
    const fi = fighters[i];
    if (fi.Position.y + fi.Radius > map.Height) {
      const pos = Vector.Clone(fi.Position);
      pos.y += fi.Radius;
      corners.push(camera.PositionOffset(pos));
    }
  }
  corners.push(camera.PositionOffset(new Vector(0, map.Height, 0)));
  for (let i = 0; camera.Settings.Quality > 1 && i < fighters.length; i++) {
    const fi = fighters[i];
    if (fi.Position.x - fi.Radius < 0) {
      const pos = Vector.Clone(fi.Position);
      pos.x -= fi.Radius;
      corners.push(camera.PositionOffset(pos));
    }
  }
  return corners;
}


function DepthSort(a: Entity, b: Entity): number {
  if (a.Position.y < b.Position.y) return 1;
  if (a.Position.y > b.Position.y) return -1;
  return 0;
}


class Renderer {
  /* eslint-disable no-param-reassign */
  public static DrawScreen(
    canvas: CanvasRenderingContext2D,
    camera: Camera,
    map: Map,
    fighters: Fighter[],
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

    // Depth-Sort all entities before drawing
    const toDraw: Entity[] = [].concat(fighters, particles, projectiles).sort(DepthSort);

    // Draw in fighters
    for (let i = 0; i < toDraw.length; i++) {
      if (toDraw[i].type === EntityType.Fighter) {
        const a = <Fighter>(toDraw[i]);
        const pos = camera.PositionOffsetBasic(a.Position);

        let upscaleoffset = 0;
        if (a.Animator) upscaleoffset = Math.max(0, a.Animator.Upscale - 1);

        // First, draw shadow
        canvas.fillStyle = '#000000';
        canvas.globalAlpha = 0.5;
        canvas.fillRect(
          (-pos.x - a.Radius * 1.1) * zoom + offsetX,
          (pos.y + (pos.z / 2) + upscaleoffset) * zoom + offsetY,
          2 * a.Radius * 1.1 * zoom,
          -(a.Height / 2) * zoom,
        );
        canvas.globalAlpha = 1;

        if (a.Animator && a.Animator.SpriteSheet) { // If we can find an animator for this fighter, use it
          const b: Animator = a.Animator;

          let row = b.row * 2;
          if (a.Flipped) row++;

          canvas.drawImage(
            b.SpriteSheet,
            b.FrameWidth * b.frame,
            b.FrameHeight * row,
            b.FrameWidth,
            b.FrameHeight,
            (-pos.x - (a.Height / 2) * b.Upscale) * zoom + offsetX, // Radius originally used in place of a.Height / 2
            (pos.y + pos.z + (a.Height * (b.Upscale - 1))) * zoom + offsetY,
            a.Height * b.Upscale * zoom, // 2 * Radius originally used in place of a.Height
            -a.Height * b.Upscale * zoom,
          );
          canvas.resetTransform();
        } else { // Otherwise, draw a box
          canvas.fillStyle = '#000000';
          canvas.fillRect(
            (-pos.x - a.Radius) * zoom + offsetX,
            (pos.y + pos.z) * zoom + offsetY,
            2 * a.Radius * zoom,
            -a.Height * zoom,
          );
        }
      } else if (toDraw[i].type === EntityType.Projectile) {
        const a = <Projectile>toDraw[i];

        const pos1 = camera.PositionOffset(Vector.Subtract(a.Position, Vector.Multiply(Vector.UnitVector(a.Velocity), a.Length)));
        const pos2 = camera.PositionOffset(a.Position);

        if (a.projectileType === ProjectileType.Fire) { // Fire, despite being a bullet, needs to look cool, so generate its looks here on the client
          const perc = Math.min(a.getLifePercentage(), 1);
          canvas.globalAlpha = Math.sin(Math.PI * perc);
          canvas.strokeStyle = Particle.RGBToHex(255, 250 * perc, 30 * perc);
          canvas.lineWidth = zoom * a.Width * 2 * Math.sin(perc);
        } else { // Otherwise, follow standard-issue bullet draw rules
          canvas.strokeStyle = a.RenderStyle;
          canvas.globalAlpha = 1;
          canvas.lineWidth = zoom * a.Width;
        }

        canvas.beginPath();
        canvas.moveTo(pos1.x, pos1.y);
        canvas.lineTo(pos2.x, pos2.y);
        canvas.stroke();
      } else if (toDraw[i].type === EntityType.Particle) {
        const a = <Particle>toDraw[i];
        canvas.strokeStyle = a.RenderStyle;
        canvas.globalAlpha = a.Alpha;
        canvas.lineWidth = zoom * a.Width;

        const pos1 = camera.PositionOffset(a.Position);
        const pos2 = camera.PositionOffset(a.End);

        canvas.beginPath();
        canvas.moveTo(pos1.x, pos1.y);
        if (a.particleType === ParticleType.Lightning) { // If it is lightning, draw all segments in center of path
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
    canvas.textAlign = 'left';
    canvas.fillText(data, cornerX, cornerY, sizeX);
  }

  public static DrawUIFrame(canvas: CanvasRenderingContext2D, cam: Camera, frame: UIFrame) {
    canvas.resetTransform();
    canvas.font = '48px roboto';
    canvas.textBaseline = 'hanging';
    canvas.textAlign = 'center';

    let startX = frame.cornerX * cam.Width;
    let startY = frame.cornerY * cam.Height;
    let width = frame.width * cam.Width;
    let height = frame.height * cam.Height;

    if (frame.restrainAspect) {
      const scale = Math.min(frame.width * cam.Width, frame.height * cam.Height);
      startX += (width - scale) / 2;
      startY -= (height - scale) / 2;
      width = scale;
      height = scale;
    }

    if (frame.alpha > 0) {
      canvas.globalAlpha = frame.alpha;
      canvas.fillStyle = frame.renderStyle;
      canvas.fillRect(startX, startY, width, height);

      if (frame.borderThickness > 0) {
        canvas.strokeStyle = frame.borderRenderStyle;
        canvas.lineWidth = frame.borderThickness * cam.Zoom;
        canvas.strokeRect(startX, startY, width, height);
      }
    }

    if (frame.image) {
      canvas.globalAlpha = frame.imageAlpha;

      canvas.drawImage(frame.image, startX, startY, width, height);
    }

    if (frame.type === UIFrameType.Text) {
      const text = <UITextBox>(frame);
      canvas.globalAlpha = frame.alpha;
      canvas.fillStyle = text.textStyle;
      canvas.fillText(text.text, startX + width / 2, startY, width);
    }
  }

  public static DrawFPS(canvas: CanvasRenderingContext2D, cam: Camera, DeltaTime: number) {
    canvas.globalAlpha = 1;
    canvas.fillStyle = '#000000';
    canvas.font = '48px roboto';
    canvas.textBaseline = 'hanging';
    canvas.textAlign = 'left';

    const fps = Math.floor(10 / DeltaTime) / 10;
    let str = fps.toString();
    if (str.length === 2) str += '.0';

    canvas.fillText(`${str} FPS`, 0, 0, cam.Width * 0.1);
  }
  /* eslint-enable no-param-reassign */
}

export { Renderer as default };
