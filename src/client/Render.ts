// Client only -- Renders stuff to the screen
/* eslint-disable object-curly-newline */
import Vector from '../common/engine/Vector';
import { EntityType, ParticleType, ProjectileType, MapPreset, UIFrameType, FighterType, RenderQuality } from '../common/engine/Enums';
import Entity from '../common/engine/Entity';
import { Fighter } from '../common/engine/fighters';
import Animator from './animation/Animator';
import { Projectile } from '../common/engine/projectiles';
import Prop from '../common/engine/props/Prop';
import { Particle, PLightning, PBulletFire } from './particles/index';
import { UIFrame, UITextBox, UIDeathNotification, UIPlayerInfo } from './ui/index';
import RenderSettings from './RenderSettings';
import Camera from './Camera';
import Map from '../common/engine/Map';
/* eslint-enable object-curly-newline */

let ArenaBoundFrontPassIndex: number = 0;
// let CanvasRotated: boolean = false;

function DepthSort(a: Entity, b: Entity): number {
  if (a.Position.y < b.Position.y) return 1;
  if (a.Position.y > b.Position.y) return -1;
  return 0;
}
function SortByYNegative(a: Entity, b: Entity): number {
  return -DepthSort(a, b);
}
function SortByXPositive(a: Entity, b: Entity): number {
  if (a.Position.x < b.Position.x) return -1;
  if (a.Position.x > b.Position.x) return 1;
  return 0;
}
function SortByXNegative(a: Entity, b: Entity): number {
  return -SortByXPositive(a, b);
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


function GetArenaBounds(camera: Camera, map: Map, fighters: Fighter[]):Vector[] {
  const f: Fighter[] = fighters.slice();
  const corners: Vector[] = [camera.PositionOffset(new Vector(0, 0, 0))]; // camera.PositionOffset(new Vector(0, 0, 0))

  const center = camera.GetFocusPosition();
  if (camera.InFrame(new Vector(center.x, 0, 0))) {
    f.sort(SortByXPositive);
    for (let i = 0; i < f.length; i++) {
      const fi = f[i];
      if (!fi.riding && fi.Position.y < 0) {
        const pos = Vector.Clone(fi.Position);
        corners.push(camera.PositionOffset(pos));
      }
    }
  }
  corners.push(camera.PositionOffset(new Vector(map.Width, 0, 0)));
  ArenaBoundFrontPassIndex = corners.length - 1;
  if (camera.InFrame(new Vector(map.Width, center.y, 0))) {
    f.sort(SortByYNegative);
    for (let i = 0; i < f.length; i++) {
      const fi = fighters[i];
      if (!fi.riding && fi.Position.x + fi.Radius > map.Width) {
        const pos = Vector.Clone(fi.Position);
        pos.x += fi.Radius;
        corners.push(camera.PositionOffset(pos));
      }
    }
  }
  corners.push(camera.PositionOffset(new Vector(map.Width, map.Height, 0)));
  if (camera.InFrame(new Vector(center.x, map.Height, 0))) {
    f.sort(SortByXNegative);
    for (let i = 0; i < f.length; i++) {
      const fi = fighters[i];
      if (!fi.riding && fi.Position.y + fi.Radius > map.Height) {
        const pos = Vector.Clone(fi.Position);
        pos.y += fi.Radius;
        corners.push(camera.PositionOffset(pos));
      }
    }
  }
  corners.push(camera.PositionOffset(new Vector(0, map.Height, 0)));
  if (camera.InFrame(new Vector(0, center.y, 0))) {
    f.sort(DepthSort);
    for (let i = 0; i < f.length; i++) {
      const fi = fighters[i];
      if (!fi.riding && fi.Position.x - fi.Radius < 0) {
        const pos = Vector.Clone(fi.Position);
        pos.x -= fi.Radius;
        corners.push(camera.PositionOffset(pos));
      }
    }
  }

  return corners;
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
    props: Prop[],
  ) {
    switch (map.mapID) {
      case MapPreset.Grassy: canvas.fillStyle = '#0d542f'; break;
      default: canvas.fillStyle = '#e3a324'; break;
    }
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

    const topLeft = camera.PositionOffset(new Vector(0, 0, 0));
    if (map.Texture) {
      canvas.drawImage( // Still draws entire map texture, but was extremely hard to try and it do it the other way
        map.Texture,
        0, 0,
        3076, 3076,
        topLeft.x - mapWidth / 4,
        topLeft.y - mapHeight * (5 / 4),
        mapWidth * 1.5,
        mapHeight * 1.5,
      );
    }

    // Draw arena floor and boundaries
    canvas.strokeStyle = '#ff0000';
    canvas.globalAlpha = 1;
    canvas.lineWidth = zoom * 0.1;
    canvas.lineCap = 'round';
    canvas.beginPath();
    let corners: Vector[] = null;
    if (RenderSettings.Quality > RenderQuality.Low) {
      corners = GetArenaBounds(camera, map, fighters);
      // Draw all arena boundaries except for frontmost
      canvas.moveTo(corners[ArenaBoundFrontPassIndex].x, corners[ArenaBoundFrontPassIndex].y);
      for (let i = ArenaBoundFrontPassIndex + 1; i < corners.length; i++) {
        canvas.lineTo(corners[i].x, corners[i].y);
      }
      canvas.lineTo(topLeft.x, topLeft.y);
    } else {
      const p1 = camera.PositionOffset(new Vector(map.Width, 0, 0));
      const p2 = camera.PositionOffset(new Vector(map.Width, map.Height, 0));
      const p3 = camera.PositionOffset(new Vector(0, map.Height, 0));

      canvas.moveTo(topLeft.x, topLeft.y);
      canvas.lineTo(p1.x, p1.y);
      canvas.lineTo(p2.x, p2.y);
      canvas.lineTo(p3.x, p3.y);
      canvas.closePath();
    }
    canvas.stroke();

    // Depth-Sort all entities before drawing
    let toDraw: Entity[] = [];
    // Go through each list and only add objects that are within the camera frame
    for (let i = 0; i < fighters.length; i++) {
      if (camera.InFrame(fighters[i].Position)) toDraw.push(fighters[i]);
    }
    for (let i = 0; i < projectiles.length; i++) {
      if (camera.InFrame(projectiles[i].Position)) toDraw.push(projectiles[i]);
    }
    for (let i = 0; i < particles.length; i++) {
      if (camera.InFrame(particles[i].Position)) toDraw.push(particles[i]);
    }
    for (let i = 0; i < props.length; i++) {
      if (camera.InFrame(props[i].Position)) toDraw.push(props[i]);
    }

    toDraw = toDraw.sort(DepthSort); // Do depth sorting

    // Draw in fighters
    for (let i = 0; i < toDraw.length; i++) {
      if (toDraw[i].type === EntityType.Fighter) {
        const a = <Fighter>(toDraw[i]);
        const pos = camera.PositionOffsetBasic(a.Position);

        let upscale = 0;
        if (a.Animator) upscale = a.Animator.Upscale;

        // First, draw shadow
        canvas.fillStyle = '#000000';
        canvas.globalAlpha = 0.3;
        canvas.fillRect(
          (-pos.x - a.Radius) * zoom + offsetX,
          (pos.y + (pos.z / 2)) * zoom + offsetY,
          2 * a.Radius * zoom,
          -((a.Height * upscale) * zoom) / 2,
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
            (pos.y + pos.z) * zoom + offsetY,
            a.Height * b.Upscale * zoom, // 2 * Radius originally used in place of a.Height
            -a.Height * b.Upscale * zoom,
          );
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
            (pos.y + pos.z - a.Height * upscale - 0.175) * camera.Zoom + offsetY,
          );
        }
      } else if (toDraw[i].type === EntityType.Prop) {
        const a = <Prop>toDraw[i];
        if (a.texture) {
          const pos = camera.PositionOffsetBasic(a.Position);
          canvas.globalAlpha = 1;
          canvas.drawImage(
            a.texture,
            (-pos.x - a.Radius * a.textureUpscale) * zoom + offsetX, // Radius originally used in place of a.Height / 2
            (pos.y + pos.z) * zoom + offsetY,
            2 * a.Radius * a.textureUpscale * zoom, // 2 * Radius originally used in place of a.Height
            -a.Height * a.textureUpscale * zoom,
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

        canvas.lineCap = 'round';
        canvas.beginPath();
        canvas.moveTo(pos1.x, pos1.y);
        canvas.lineTo(pos2.x, pos2.y);
        canvas.stroke();
      } else if (toDraw[i].type === EntityType.Particle) {
        const a = <Particle>toDraw[i];
        canvas.strokeStyle = a.RenderStyle;
        canvas.globalAlpha = a.Alpha;
        canvas.lineWidth = zoom * a.Width;

        switch (a.particleType) { // Changes how lines draw
          case ParticleType.BulletShell: // Bullet shells aren't round!
            canvas.lineCap = 'butt';
            break;
          default: // However, everything else is
            canvas.lineCap = 'round';
        }

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
        } else if (a.particleType === ParticleType.BulletFire) {
          canvas.fillStyle = a.RenderStyle;
          const f = <PBulletFire>(a);
          for (let j = 0; j < f.points.length; j++) {
            const seg = camera.PositionOffset(f.points[j]);
            canvas.lineTo(seg.x, seg.y);
          }
        }
        canvas.lineTo(pos2.x, pos2.y);
        if (a.particleType === ParticleType.BulletFire) {
          canvas.fill();
        } else {
          canvas.stroke();
        }
      }
    }

    // Finish up with the front arena bound
    if (RenderSettings.Quality > RenderQuality.Low) {
      canvas.strokeStyle = '#ff0000';
      canvas.globalAlpha = 1;
      canvas.lineWidth = zoom * 0.1;
      canvas.lineCap = 'round';
      canvas.beginPath();
      canvas.moveTo(topLeft.x, topLeft.y);
      for (let i = 1; i < ArenaBoundFrontPassIndex + 2; i++) {
        canvas.lineTo(corners[i].x, corners[i].y);
      }
      canvas.stroke();
    }
  }

  public static DrawPlayerList(canvas: CanvasRenderingContext2D, cam: Camera, data: string) {
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
    let startX = frame.cornerX * cam.Width;
    let startY = frame.cornerY * cam.Height;
    let width = frame.width * cam.Width;
    let height = frame.height * cam.Height;

    if (frame.constrainAspect) {
      const scale = Math.min(cam.Width, cam.Height);
      if (frame.constrainAspectCenterX) startX += (width - scale * frame.width) / 2;
      if (frame.constrainAspectCenterY) startY -= (height - scale * frame.height) / 2;
      width = scale * frame.width;
      height = scale * frame.height;
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
      else if (text.textAlignment === 'right') offsetX = width;
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
      canvas.fillText(card.getOwner().getPing().toString(), startX + width * 0.9, startY, width * 0.1);
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
    canvas.fillStyle = '#00ffff';
    canvas.font = '16px roboto';
    canvas.textBaseline = 'top';
    canvas.textAlign = 'left';

    const fps = Math.floor(10 / DeltaTime) / 10;
    let str = fps.toString();
    if (str.length === 2) str += '.0';

    canvas.fillText(`${str} FPS`, 5 + 0.03 * Math.min(cam.Width, cam.Height), 5, cam.Width);
  }
  /* eslint-enable no-param-reassign */
}

export { Renderer as default };
