// Client only -- Renders stuff to the screen
/* eslint-disable object-curly-newline */
import Vector from '../common/engine/Vector';
import { EntityType, ParticleType, ProjectileType, UIFrameType, FighterType } from '../common/engine/Enums';
import Entity from '../common/engine/Entity';
import { Fighter } from '../common/engine/fighters/index';
import Animator from './animation/Animator';
import { Projectile } from '../common/engine/projectiles/index';
import { Particle, PLightning } from './particles/index';
import { UIFrame, UITextBox, UIDeathNotification, UIPlayerInfo } from './ui/index';
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


function MeasureString(canvas: CanvasRenderingContext2D, str: string): number {
  return canvas.measureText(str).width;
}


function GetKillMethod(fighter: FighterType): string {
  switch (fighter) {
    case FighterType.Sheep: return ' bulldozed ';
    case FighterType.Deer: return ' gunned down ';
    case FighterType.Flamingo: return ' incinerated ';
    case FighterType.Toad: return ' electrocuted ';
    default: return ' died';
  }
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
    canvas.fillStyle = '#003001';
    canvas.fillRect(0, 0, camera.Width, camera.Height);

    // Username font settings
    canvas.font = '18px roboto';
    canvas.textBaseline = 'middle';
    canvas.textAlign = 'center';

    const offsetX = camera.Width / 2;
    const offsetY = camera.Height / 2;
    const zoom = camera.Zoom;

    const mapWidth = map.Width * zoom;
    const mapHeight = map.Height * zoom;

    // Draw arena boundaries
    const corners = GetArenaBounds(camera, map, fighters);
    canvas.drawImage(
      map.Texture,
      0, 0,
      3076, 3076,
      corners[0].x - mapWidth / 4,
      corners[0].y - mapHeight * (5 / 4),
      mapWidth * 1.5,
      mapHeight * 1.5,
    );
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

        if (a.DisplayName) {
          canvas.globalAlpha = 1;
          canvas.fillStyle = '#000000';

          canvas.fillText(
            a.DisplayName,
            offsetX - pos.x * camera.Zoom,
            (pos.y + pos.z - a.Height - 0.175) * camera.Zoom + offsetY,
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
    const startX = cam.Width * UIPlayerInfo.CORNERX_OFFSET;
    let startY = cam.Height * UIPlayerInfo.CORNERY_OFFSET;
    const width = cam.Width * UIPlayerInfo.LIST_WIDTH;
    const height = cam.Height * UIPlayerInfo.LIST_HEIGHT;

    canvas.fillStyle = '#ffffff';
    canvas.globalAlpha = 0.9;
    canvas.fillRect(startX, startY, width, height);

    canvas.fillStyle = '#000000';
    canvas.font = '48px flamenco';
    canvas.textBaseline = 'bottom';
    canvas.textAlign = 'center';
    canvas.fillText(data, startX + width / 2, startY, width);

    // Template organizer
    canvas.font = '18px roboto';
    canvas.textBaseline = 'middle';
    canvas.textAlign = 'right';

    startY += (cam.Height * UIPlayerInfo.HEIGHT) / 2;

    canvas.fillText('Kills', startX + width * 0.1, startY, width * 0.1);
    canvas.textAlign = 'left';
    canvas.fillText('Luchador', startX + width * 0.5, startY, width * 0.2);
    canvas.fillText('Player', startX + width * 0.15, startY, width * 0.3);
    canvas.fillText('Ping', startX + width * 0.9, startY, width * 0.1);

    canvas.lineWidth = 4;
    canvas.lineCap = 'butt';
    canvas.strokeStyle = '#000000';
    startY += (cam.Height * UIPlayerInfo.HEIGHT) / 2;
    canvas.beginPath();
    canvas.moveTo(startX, startY);
    canvas.lineTo(startX + width, startY);
    canvas.stroke();
  }

  public static DrawUIFrame(canvas: CanvasRenderingContext2D, cam: Camera, frame: UIFrame) {
    canvas.resetTransform();

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

      let fontSize = 48;
      if (text.textFontSize > 0) fontSize = text.textFontSize;
      canvas.font = `${fontSize}px ${text.textFont}`;
      canvas.textBaseline = text.textBase;
      canvas.textAlign = text.textAlignment;

      const indent = width * (1 - text.textInnerWidth);
      startX += (width * (1 - text.textInnerWidth)) / 2;
      width -= indent;

      let offsetX = 0;
      let offsetY = 0;
      if (text.textAlignment === 'center') offsetX = width / 2;
      if (text.textBase === 'middle') offsetY = height / 2;

      canvas.globalAlpha = text.textAlpha;
      canvas.fillStyle = text.textStyle;
      if (text.textWrapping) {
        const full = text.text;

        let index = 0;
        while (index < full.length) {
          let str = '';
          let len = 0;
          let lastSpace = -1;
          let surpassed = false;

          // Estimate how large this text line is and check for word cut-offs
          for (let i = index; i < full.length && len < width; i++) {
            str += full.substr(i, 1);
            len = MeasureString(canvas, str);
            if (full.substr(i, 1) === ' ') lastSpace = i;
            if (len > width) surpassed = true;
          }
          if (lastSpace === -1 || !surpassed) lastSpace = full.length;

          str = '';
          for (let i = index; i < lastSpace; i++) {
            str += full.substr(i, 1);
            index++;
          }
          if (index === lastSpace) index++; // Don't write space character if it ended on one

          canvas.fillText(str, startX + offsetX, startY + offsetY, width);
          startY += height;
        }
      } else {
        canvas.fillText(text.text, startX + offsetX, startY + offsetY, width);
      }

      if (text.drawCursor) {
        canvas.globalAlpha = text.cursorAlpha;
        canvas.strokeStyle = text.cursorStyle;
        canvas.lineWidth = text.cursorThickness;

        canvas.beginPath();
        canvas.moveTo(startX + offsetX + text.cursorPosition * cam.Width, startY + height * 0.15);
        canvas.lineTo(startX + offsetX + text.cursorPosition * cam.Width, startY + height * 0.85);
        canvas.stroke();
      }
    } else if (frame.type === UIFrameType.DeathNotification) {
      const notif = <UIDeathNotification>(frame);

      canvas.font = '18px roboto';
      canvas.textBaseline = 'top';
      canvas.textAlign = 'right';

      if (notif.killer) {
        if (notif.wasDeath) canvas.fillStyle = '#03ae0b';
        else canvas.fillStyle = '#ae0b03';
        canvas.fillText(notif.death, startX + width, startY, width);
        width -= MeasureString(canvas, notif.death);
      }

      canvas.fillStyle = '#ffffff';
      const msg = GetKillMethod(notif.method);
      canvas.fillText(msg, startX + width, startY, width);
      width -= MeasureString(canvas, msg);// + 64; // with two spaces added

      if (notif.wasKiller) canvas.fillStyle = '#03ae0b';
      else canvas.fillStyle = '#ae0b03';
      if (notif.killer) {
        canvas.fillText(notif.killer, startX + width, startY, width);
        width -= MeasureString(canvas, notif.killer);
      } else {
        if (notif.wasDeath) canvas.fillStyle = '#03ae0b';
        else canvas.fillStyle = '#ae0b03';
        canvas.fillText(notif.death, startX + width, startY, width);
      }
    } else if (frame.type === UIFrameType.PlayerInfo) {
      const card = <UIPlayerInfo>(frame);

      canvas.font = '18px roboto';
      canvas.textBaseline = 'middle';
      canvas.textAlign = 'right';
      canvas.fillStyle = '#000000';

      startY += height / 2;

      // Draw kills
      canvas.fillText(card.getOwner().getKills().toString(), startX + width * 0.1, startY, width * 0.1);

      // Selected character
      canvas.textAlign = 'left';
      canvas.fillText(card.fighter, startX + width * 0.5, startY, width * 0.2);

      // Draw username
      if (card.isClient) canvas.fillStyle = '#008a4a';
      canvas.fillText(card.getOwner().getUsername(), startX + width * 0.15, startY, width * 0.3);

      // Ping
      canvas.fillText(card.ping.toString(), startX + width * 0.9, startY, width * 0.1);
    }
  }

  public static GetTextWidth(canvas: CanvasRenderingContext2D, cam: Camera, text: UITextBox, fillSpaces: boolean = true): number {
    let fontSize = 48;
    if (text.textFontSize > 0) fontSize = text.textFontSize;
    canvas.font = `${fontSize}px ${text.textFont}`;
    canvas.textBaseline = 'middle';
    canvas.textAlign = text.textAlignment;

    if (fillSpaces) return canvas.measureText(text.text.replace(/ /g, '-')).actualBoundingBoxRight / cam.Width;
    return canvas.measureText(text.text).actualBoundingBoxRight / cam.Width;
  }

  public static DrawFPS(canvas: CanvasRenderingContext2D, cam: Camera, DeltaTime: number) {
    canvas.globalAlpha = 1;
    canvas.fillStyle = '#000000';
    canvas.font = '48px roboto';
    canvas.textBaseline = 'top';
    canvas.textAlign = 'left';

    const fps = Math.floor(10 / DeltaTime) / 10;
    let str = fps.toString();
    if (str.length === 2) str += '.0';

    canvas.fillText(`${str} FPS`, 0, 0, cam.Width * 0.1);
  }
  /* eslint-enable no-param-reassign */
}

export { Renderer as default };
