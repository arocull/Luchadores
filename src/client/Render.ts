// Client only -- Renders stuff to the screen
/* eslint-disable object-curly-newline */
import Vector from '../common/engine/Vector';
import { EntityType, ParticleType, ProjectileType, MapPreset, UIFrameType, FighterType, RenderQuality, ColliderType } from '../common/engine/Enums';
import Entity from '../common/engine/Entity';
import { Fighter } from '../common/engine/fighters';
import Animator from './animation/Animator';
import { Projectile } from '../common/engine/projectiles';
import Prop from '../common/engine/props/Prop';
import { Particle, PLightning, PBulletFire } from './particles/index';
import { UIFrame, UITextBox, UIDeathNotification, UIPlayerInfo } from './ui/index';
import RenderSettings from './RenderSettings';
import Camera from './Camera';
import World from '../common/engine/World';
import Map from '../common/engine/Map';
/* eslint-enable object-curly-newline */

let ArenaBoundFrontPassIndex: number = 0;
let canvas: CanvasRenderingContext2D = null;

function DepthSort(a: Entity, b: Entity): number {
  if (a.Position.y < b.Position.y) return 1;
  if (a.Position.y > b.Position.y) return -1;
  return 0;
}


function MeasureString(str: string): number {
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
  const corners: Vector[] = [camera.PositionOffset(new Vector(0, 0, 0))]; // camera.PositionOffset(new Vector(0, 0, 0))

  const center = camera.GetFocusPosition();

  // Arena bottom
  if (camera.InFrame(new Vector(center.x, 0, 0))) { // Only worry about deformation if bound is in frame
    let furthest: Fighter = null;
    let furthestPos: number = 0;

    // Find fighter furthest out of arena--only they will cause deformation.
    // Looks a little awkward when multiple players are out of bounds, but better than arena bound snapping to each one
    for (let i = 0; i < fighters.length; i++) {
      const pos = fighters[i].Position.y; // Position determined by X or Y position, do not include radius as this is the visual bottom of the character
      if (((furthest && pos < furthestPos) || (!furthest && pos < 0)) && !fighters[i].riding) { // Are they out furthest? Are they past the bound?
        furthestPos = pos;
        furthest = fighters[i];
      }
    }

    if (furthest) { // If there was a player who was outside of the bound, take their point
      corners.push(camera.PositionOffset(furthest.Position));
    }
  }
  corners.push(camera.PositionOffset(new Vector(map.Width, 0, 0)));
  ArenaBoundFrontPassIndex = corners.length - 1; // Arena bottom always renders in front--separate from other bounds


  // Right arena bound
  if (camera.InFrame(new Vector(map.Width, center.y, 0))) {
    let furthest: Fighter = null;
    let furthestPos: number = 0;

    // Find fighter furthest out of arena--only they will cause deformation.
    // Looks a little awkward when multiple players are out of bounds, but better than arena bound snapping to each one
    for (let i = 0; i < fighters.length; i++) {
      const pos = fighters[i].Position.x + fighters[i].Radius; // Position determined by X or Y position +/- radius
      if (((furthest && pos > furthestPos) || (!furthest && pos > map.Width)) && !fighters[i].riding) { // Are they out furthest? Are they past the bound?
        furthestPos = pos;
        furthest = fighters[i];
      }
    }

    if (furthest) { // If there was a player who was outside of the bound, take their point
      corners.push(camera.PositionOffset(Vector.Add(
        furthest.Position,
        new Vector(furthest.Radius, 0, 0),
      )));
    }
  }

  // Top arena bound
  corners.push(camera.PositionOffset(new Vector(map.Width, map.Height, 0)));
  if (camera.InFrame(new Vector(center.x, map.Height, 0))) {
    let furthest: Fighter = null;
    let furthestPos: number = 0;

    // Find fighter furthest out of arena--only they will cause deformation.
    // Looks a little awkward when multiple players are out of bounds, but better than arena bound snapping to each one
    for (let i = 0; i < fighters.length; i++) {
      const pos = fighters[i].Position.y + fighters[i].Radius; // Position determined by X or Y position +/- radius
      if (((furthest && pos > furthestPos) || (!furthest && pos > map.Height)) && !fighters[i].riding) { // Are they out furthest? Are they past the bound?
        furthestPos = pos;
        furthest = fighters[i];
      }
    }

    if (furthest) { // If there was a player who was outside of the bound, take their point
      corners.push(camera.PositionOffset(Vector.Add(
        furthest.Position,
        new Vector(0, furthest.Radius, 0),
      )));
    }
  }

  // Left arena bound
  corners.push(camera.PositionOffset(new Vector(0, map.Height, 0)));
  if (camera.InFrame(new Vector(0, center.y, 0))) {
    let furthest: Fighter = null;
    let furthestPos: number = 0;

    // Find fighter furthest out of arena--only they will cause deformation.
    // Looks a little awkward when multiple players are out of bounds, but better than arena bound snapping to each one
    for (let i = 0; i < fighters.length; i++) {
      const pos = fighters[i].Position.x - fighters[i].Radius; // Position determined by X or Y position +/- radius
      if (((furthest && pos < furthestPos) || (!furthest && pos < 0)) && !fighters[i].riding) { // Are they out furthest? Are they past the bound?
        furthestPos = pos;
        furthest = fighters[i];
      }
    }

    if (furthest) { // If there was a player who was outside of the bound, take their point
      corners.push(camera.PositionOffset(Vector.Subtract(
        furthest.Position,
        new Vector(furthest.Radius, 0, 0),
      )));
    }
  }

  return corners;
}


// DRAW FUNCTIONS //
function drawFighter(a: Fighter, cam: Camera, offsetX: number, offsetY: number) {
  const pos = cam.PositionOffsetBasic(a.Position);

  let upscale = 0;
  if (a.Animator) upscale = a.Animator.Upscale;

  // First, draw shadow
  canvas.fillStyle = '#000000';
  canvas.globalAlpha = 0.3;
  canvas.fillRect(
    (-pos.x - a.Radius) * cam.Zoom + offsetX,
    (pos.y + (pos.z / 2)) * cam.Zoom + offsetY,
    2 * a.Radius * cam.Zoom,
    -((a.Height * upscale) * cam.Zoom) / 2,
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
      (-pos.x - (a.Height / 2) * b.Upscale) * cam.Zoom + offsetX, // Radius originally used in place of a.Height / 2
      (pos.y + pos.z) * cam.Zoom + offsetY,
      a.Height * b.Upscale * cam.Zoom, // 2 * Radius originally used in place of a.Height
      -a.Height * b.Upscale * cam.Zoom,
    );
  } else { // Otherwise, draw a box
    canvas.fillStyle = '#000000';
    canvas.fillRect(
      (-pos.x - a.Radius) * cam.Zoom + offsetX,
      (pos.y + pos.z) * cam.Zoom + offsetY,
      2 * a.Radius * cam.Zoom,
      -a.Height * cam.Zoom,
    );
  }

  if (a.DisplayName) {
    canvas.globalAlpha = 1;
    canvas.fillStyle = '#ffffff';

    canvas.fillText(
      a.DisplayName,
      offsetX - pos.x * cam.Zoom,
      (pos.y + pos.z - a.Height * upscale - 0.175) * cam.Zoom + offsetY,
    );
  }
}

function drawProp(a: Prop, cam: Camera, offsetX: number, offsetY: number) {
  const pos = cam.PositionOffsetBasic(a.Position);
  canvas.globalAlpha = 1;
  switch (a.shape) {
    case ColliderType.Cylinder:
      canvas.drawImage(
        a.texture,
        (-pos.x - a.Radius * a.textureUpscale) * cam.Zoom + offsetX, // Radius originally used in place of a.Height / 2
        (pos.y + pos.z) * cam.Zoom + offsetY,
        2 * a.Radius * a.textureUpscale * cam.Zoom, // 2 * Radius originally used in place of a.Height
        -a.Height * a.textureUpscale * cam.Zoom,
      );
      break;
    default:
      canvas.drawImage(
        a.texture,
        (-pos.x - a.Width * a.textureUpscale) * cam.Zoom + offsetX, // Radius originally used in place of a.Height / 2
        (pos.y + pos.z) * cam.Zoom + offsetY,
        2 * a.Width * a.textureUpscale * cam.Zoom, // 2 * Radius originally used in place of a.Height
        (-a.Height - a.Depth) * a.textureUpscale * cam.Zoom,
      );
      break;
  }
}

function drawProjectile(a: Projectile, cam: Camera) {
  const pos1 = cam.PositionOffset(Vector.Subtract(a.Position, Vector.Multiply(Vector.UnitVector(a.Velocity), a.Length)));
  const pos2 = cam.PositionOffset(a.Position);

  if (a.projectileType === ProjectileType.Fire) { // Fire, despite being a bullet, needs to look cool, so generate its looks here on the client
    const perc = Math.min(a.getLifePercentage(), 1);
    canvas.globalAlpha = Math.sin(Math.PI * perc);
    canvas.strokeStyle = Particle.RGBToHex(255, 250 * perc, 30 * perc);
    canvas.lineWidth = cam.Zoom * a.Width * 2 * Math.sin(perc);
  } else { // Otherwise, follow standard-issue bullet draw rules
    canvas.strokeStyle = a.RenderStyle;
    canvas.globalAlpha = 1;
    canvas.lineWidth = cam.Zoom * a.Width;
  }

  canvas.lineCap = 'round';
  canvas.beginPath();
  canvas.moveTo(pos1.x, pos1.y);
  canvas.lineTo(pos2.x, pos2.y);
  canvas.stroke();
}

function drawParticle(a: Particle, cam: Camera) {
  canvas.strokeStyle = a.RenderStyle;
  canvas.globalAlpha = a.Alpha;
  canvas.lineWidth = cam.Zoom * a.Width;

  switch (a.particleType) { // Changes how lines draw
    case ParticleType.BulletShell: // Bullet shells aren't round!
      canvas.lineCap = 'butt';
      break;
    default: // However, everything else is
      canvas.lineCap = 'round';
  }

  const pos1 = cam.PositionOffset(a.Position);
  const pos2 = cam.PositionOffset(a.End);

  canvas.beginPath();

  canvas.moveTo(pos1.x, pos1.y);
  if (a.particleType === ParticleType.Lightning) { // If it is lightning, draw all segments in center of path
    const l = <PLightning>(a);
    for (let j = 0; j < l.Segments.length; j++) {
      const seg = cam.PositionOffset(l.Segments[j]);
      canvas.lineTo(seg.x, seg.y);
    }
  } else if (a.particleType === ParticleType.BulletFire) {
    canvas.fillStyle = a.RenderStyle;
    const f = <PBulletFire>(a);
    for (let j = 0; j < f.points.length; j++) {
      const seg = cam.PositionOffset(f.points[j]);
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


class Renderer {
  public static setContext(context: CanvasRenderingContext2D) {
    canvas = context;
  }

  /* eslint-disable no-param-reassign */
  public static DrawScreen(
    camera: Camera,
    world: World,
    particles: Particle[],
  ) {
    const map = world.Map;
    const fighters = world.Fighters;
    const projectiles = world.Bullets;
    const props = world.Props;


    switch (map.mapID) {
      case MapPreset.Grassy: canvas.fillStyle = '#0d542f'; break;
      case MapPreset.Snowy: canvas.fillStyle = '#eefcfc'; break;
      case MapPreset.Sandy:
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

    // Draw in fighters, props, projectiles, particles
    for (let i = 0; i < toDraw.length; i++) {
      switch (toDraw[i].type) {
        case EntityType.Fighter:
          drawFighter(<Fighter>(toDraw[i]), camera, offsetX, offsetY);
          break;
        case EntityType.Prop:
          if ((<Prop>(toDraw[i])).texture) {
            drawProp(<Prop>(toDraw[i]), camera, offsetX, offsetY);
          }
          break;
        case EntityType.Projectile:
          drawProjectile(<Projectile>toDraw[i], camera);
          break;
        case EntityType.Particle:
          drawParticle(<Particle>toDraw[i], camera);
          break;
        default: // No default case
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

  public static DrawPlayerList(cam: Camera, data: string) {
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

    canvas.fillText('Kills', startX + width * 0.05, startY, width * 0.05);
    canvas.textAlign = 'center';
    canvas.fillText('Streak', startX + width * 0.125, startY, width * 0.05);
    canvas.textAlign = 'left';
    canvas.fillText('Player', startX + width * 0.2, startY, width * 0.2);
    canvas.fillText('Luchador', startX + width * 0.6, startY, width * 0.2);
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

  public static DrawUIFrame(cam: Camera, frame: UIFrame) {
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
            len = MeasureString(str);
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
        width -= MeasureString(notif.death);
      }

      canvas.fillStyle = '#ffffff';
      const msg = GetKillMethod(notif.method);
      canvas.fillText(msg, startX + width, startY, width);
      width -= MeasureString(msg);// + 64; // with two spaces added

      if (notif.wasKiller) canvas.fillStyle = '#03ae0b';
      else canvas.fillStyle = '#ae0b03';
      if (notif.killer) {
        canvas.fillText(notif.killer, startX + width, startY, width);
        width -= MeasureString(notif.killer);
      } else {
        if (notif.wasDeath) canvas.fillStyle = '#03ae0b';
        else canvas.fillStyle = '#ae0b03';
        canvas.fillText(notif.death, startX + width, startY, width);
      }
    } else if (frame.type === UIFrameType.PlayerInfo) {
      const card = <UIPlayerInfo>(frame);

      if (card.isClient) {
        canvas.fillStyle = '#2afbaa';
        canvas.globalAlpha = 0.5;
        canvas.fillRect(startX, startY, width, height);
        canvas.globalAlpha = 1;
      }

      canvas.font = '18px roboto';
      canvas.textBaseline = 'middle';
      canvas.textAlign = 'right';
      canvas.fillStyle = '#000000';

      startY += height / 2;

      // Draw kills
      canvas.fillText(card.getOwner().getKills().toString(), startX + width * 0.05, startY, width * 0.05);
      canvas.textAlign = 'center';
      canvas.fillText(card.getOwner().getKillstreak().toString(), startX + width * 0.125, startY, width * 0.05);

      // Selected character
      canvas.textAlign = 'left';
      canvas.fillText(card.fighter, startX + width * 0.6, startY, width * 0.2);

      // Draw username
      canvas.fillText(card.getOwner().getUsername(), startX + width * 0.2, startY, width * 0.3);

      // Ping
      canvas.fillText(card.getOwner().getPing().toString(), startX + width * 0.9, startY, width * 0.1);

      canvas.lineWidth = 0.01 * cam.Zoom;
      canvas.lineCap = 'butt';
      canvas.strokeStyle = '#333333';
      canvas.beginPath();
      canvas.moveTo(startX + width * 0.025, startY + height / 2);
      canvas.lineTo(startX + width * 0.975, startY + height / 2);
      canvas.stroke();
    }
  }

  public static GetTextWidth(cam: Camera, text: UITextBox, fillSpaces: boolean = true): number {
    let fontSize = 48;
    if (text.textFontSize > 0) fontSize = text.textFontSize;
    canvas.font = `${fontSize}px ${text.textFont}`;
    canvas.textBaseline = 'middle';
    canvas.textAlign = text.textAlignment;

    if (fillSpaces) return canvas.measureText(text.text.replace(/ /g, '-')).actualBoundingBoxRight / cam.Width;
    return canvas.measureText(text.text).actualBoundingBoxRight / cam.Width;
  }

  public static DrawFPS(cam: Camera, DeltaTime: number) {
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
