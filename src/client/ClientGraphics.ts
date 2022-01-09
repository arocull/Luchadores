import Client from './ClientState';
import UIManager from './ui/UIManager';
import Camera from './Camera';
import {
  Particle, PRosePetal, PSmashEffect, PConfetti, PMoveDash,
} from './particles';
import Render from './Render';
import RenderSettings from './RenderSettings';
import World from '../common/engine/World';
import { UIDeathNotification, UIPlayerInfo } from './ui';
import { MakeAnimator } from './animation';
import { Vector } from '../common/engine/math';
import AssetPreloader from './AssetPreloader';
import { ThreatObject } from '../common/engine/combat/FightObserver';
import Fighter from '../common/engine/Fighter';
import ProjectileGroup from '../common/engine/combat/ProjectileGroup';
import { RenderQuality } from '../common/engine/Enums';
import Map from '../common/engine/maps/Map';
import { MapClient } from './maps';
import { SubscriberContainer } from '../common/messaging/container';

class ClientGraphics {
  public uiManager: UIManager;
  public viewport: HTMLCanvasElement;
  public canvas: CanvasRenderingContext2D;
  public fpsCounter: number[];

  public particles: Particle[];
  private subscriptions: SubscriberContainer;

  constructor(private clientState: Client) {
    this.uiManager = new UIManager();

    this.clientState.uiManager = this.uiManager;

    this.viewport = <HTMLCanvasElement>document.getElementById('render');
    this.canvas = this.viewport.getContext('2d');
    Render.setContext(this.canvas); // Set drawing context for Render (since it won't be switching)
    this.fpsCounter = [];

    this.particles = [];

    // Attach MessageBus subscriptions
    this.subscriptions = new SubscriberContainer();
    this.subscriptions.attach('Effect_NewParticle', (msg) => {
      this.particles.push(msg as Particle);
    });
    this.subscriptions.attach('Effect_PlayerDied', (msg) => {
      PConfetti.Burst(this.particles, msg as Vector, 0.2, 4, 250); // Burst into confetti!
    });
    this.subscriptions.attach('LoadAsset_Prop', (msg) => {
      AssetPreloader.getImage(msg.texture).then((img) => {
        // eslint-disable-next-line no-param-reassign
        msg.prop.texture = img;
      });
    });
    this.subscriptions.attach('LoadAsset_Map', (msg) => {
      AssetPreloader.getImage(msg.texture).then((img) => {
        // eslint-disable-next-line no-param-reassign
        msg.map.Texture = img;
      });
    });
    this.subscriptions.attach('Effect_Smash', (msg) => {
      for (let j = 0; j < 3; j++) { // Smash effect particles
        this.particles.push(new PSmashEffect(msg.pos, msg.moment / 5000));
      }
    });
  }
  public deconstruct() {
    this.subscriptions.detachAll();
  }

  public tick(DeltaTime: number) {
    // Apply visual effects, such as smashing, rose petals, and animators
    for (let i = 0; i < this.world.Fighters.length; i++) {
      const a = this.world.Fighters[i];
      if (a) {
        // Tick animators, prune and generate new ones based off of need
        if (!a.Animator) a.Animator = MakeAnimator(a);
        else if (a.Animator) {
          a.Animator.Tick(DeltaTime);
          if (a.Animator.killEffectCountdown === 0) { // If a death effect is to occur, execute it
            PRosePetal.Burst(this.particles, a.Position, 0.2, 5, 100);
          }

          if (a.Animator.doMoveParticle) {
            PMoveDash.Burst(
              this.particles,
              Vector.Add(a.Position, new Vector(0, a.Height / 2, 0)),
              a.Velocity.length() / 25,
              Vector.UnitVector(Vector.Multiply(a.Velocity, -1)),
              a.Radius,
            );
          }
        }
      }
    }


    // Weather Effects
    if (RenderSettings.Quality >= RenderQuality.Medium) {
      this.mapClient.tickWeather(DeltaTime, this.particles);
    }


    // Tick and prune particles
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].Tick(DeltaTime);

      if (this.particles[i].Finished === true) {
        this.particles.splice(i, 1);
        i--;
      }
    }

    // Update camera scale, position, and zoom
    this.clientState.scaleScreen(this.viewport.width, this.viewport.height);
    this.clientState.camera.UpdateFocus(DeltaTime);

    // Draw screen
    Render.DrawScreen(this.camera, this.world, this.particles, this.mapClient);

    // Do interface actions and draw interface
    this.uiManager.tick(DeltaTime, this.camera, this.clientState.character, this.clientState.connected, this.clientState.respawning);

    // Draw player list and kill feed
    const playerList = this.clientState.getPlayerList();
    const killfeed = this.clientState.getKillFeed();

    if (this.uiManager.isPlayerListOpen() && !this.uiManager.inGUIMode()) {
      Render.DrawPlayerList(this.camera, 'Player List');
      for (let i = 0; i < playerList.length; i++) {
        playerList[i].update();
        playerList[i].cornerY = UIPlayerInfo.CORNERY_OFFSET + (i + 1) * UIPlayerInfo.HEIGHT;
        Render.DrawUIFrame(this.camera, playerList[i]);
      }
    }
    for (let i = 0; i < killfeed.length; i++) {
      killfeed[i].timeLeft -= DeltaTime;
      if (killfeed[i].timeLeft <= 0) {
        killfeed.splice(i, 1);
        i--;
      } else {
        killfeed[i].cornerY = i * UIDeathNotification.HEIGHT + UIDeathNotification.OFFSET;
        Render.DrawUIFrame(this.camera, killfeed[i]);
      }
    }

    // Draw FPS counter
    if (RenderSettings.FPScounter) {
      if (this.fpsCounter.length >= 30) this.fpsCounter.shift();
      this.fpsCounter.push(DeltaTime);

      let avgDT = 0;
      for (let i = 0; i < this.fpsCounter.length; i++) {
        avgDT += this.fpsCounter[i];
      }
      avgDT /= this.fpsCounter.length;

      Render.DrawFPS(this.camera, avgDT);
    }
  }

  /**
   * @function debugDraw
   * @summary Draws information gathered using the Threat Object data
   * @description Draws a blue collision box around the player,
   * blue-to-green-to-orange collision boxes around enemies (based off of threat level),
   * and bounding boxes for bullet groups and their corresponding threat level.
   * @param {number} deltaTime Change in time (in seconds) since last frame
   */
  protected debugDraw(deltaTime: number, observedFighters: ThreatObject[], observedBulletGroups: ThreatObject[]) {
    Render.drawCollision(this.clientState.character, Particle.RGBToHex(0, 128, 250), this.camera);

    for (let i = 0; i < observedFighters.length; i++) {
      Render.drawCollision(
        <Fighter> observedFighters[i].object,
        Particle.RGBToHex((observedFighters[i].threat / 7) * 255, 128, 50),
        this.camera,
      );
    }
    for (let i = 0; i < observedBulletGroups.length; i++) {
      const bgroup = <ProjectileGroup> observedBulletGroups[i].object;

      Render.drawBoundingBox(
        bgroup.projectiles,
        Particle.RGBToHex((observedBulletGroups[i].threat / 6) * 255, 128, 50),
        this.camera,
      );
    }
  }

  public get camera(): Camera {
    return this.clientState.camera;
  }
  private get world(): World {
    return this.clientState.getWorld();
  }
  private get map(): Map {
    return this.world.map;
  }
  private get mapClient(): MapClient {
    return <MapClient> <unknown> this.map;
  }
}

export { ClientGraphics as default };