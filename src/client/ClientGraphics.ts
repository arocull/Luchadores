import Client from './ClientState';
import UIManager from './ui/UIManager';
import Camera from './Camera';
import {
  Particle, PRosePetal, PSmashEffect, PConfetti, PMoveDash, PSnowfall,
} from './particles';
import Render from './Render';
import RenderSettings from './RenderSettings';
import World from '../common/engine/World';
import { UIDeathNotification, UIPlayerInfo } from './ui';
import { MakeAnimator } from './animation';
import { Vector } from '../common/engine/math';
import { MessageBus } from '../common/messaging/bus';
import AssetPreloader from './AssetPreloader';
import { MapPreset, RenderQuality } from '../common/engine/Enums';

class ClientGraphics {
  public uiManager: UIManager;
  private camera: Camera;
  private world: World;

  public viewport: HTMLCanvasElement;
  public canvas: CanvasRenderingContext2D;
  public fpsCounter: number[];

  public particles: Particle[];

  public weatherParticleTimer: number; // Used for keeping track of the next weather particle spawn

  constructor(private clientState: Client) {
    this.uiManager = new UIManager();
    this.camera = this.clientState.camera;
    this.world = this.clientState.getWorld();

    this.clientState.uiManager = this.uiManager;

    this.viewport = <HTMLCanvasElement>document.getElementById('render');
    this.canvas = this.viewport.getContext('2d');
    Render.setContext(this.canvas); // Set drawing context for Render (since it won't be switching)
    this.fpsCounter = [];

    this.particles = [];

    this.weatherParticleTimer = 0;

    MessageBus.subscribe('Effect_NewParticle', (msg) => {
      this.particles.push(msg as Particle);
    });
    MessageBus.subscribe('Effect_PlayerDied', (msg) => {
      PConfetti.Burst(this.particles, msg as Vector, 0.2, 4, 250); // Burst into confetti!
    });
    MessageBus.subscribe('LoadAsset_Prop', (msg) => {
      AssetPreloader.getImage(msg.texture).then((img) => {
        // eslint-disable-next-line no-param-reassign
        msg.prop.texture = img;
      });
    });
    MessageBus.subscribe('LoadAsset_Map', (msg) => {
      AssetPreloader.getImage(msg.texture).then((img) => {
        // eslint-disable-next-line no-param-reassign
        msg.map.Texture = img;
      });
    });

    // Load textures after events are hooked up
    this.world.Map.loadTexture();
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

        // Collision effects
        if (a.JustHitMomentum > 700) {
          for (let j = 0; j < 3; j++) { // Smash effect particles
            this.particles.push(new PSmashEffect(a.JustHitPosition, a.JustHitMomentum / 5000));
          }

          // Camera shake upon impact or nearby impact
          if (this.clientState.character && Vector.Distance(a.Position, this.clientState.character.Position) <= 2) {
            this.camera.Shake += a.JustHitMomentum / 1500;
          }

          a.JustHitMomentum = 0; // Reset fighter momentums (only used for visual effects)
        }
      }
    }


    // Weather Effects
    if (RenderSettings.Quality === RenderQuality.High) {
      this.weatherParticles(DeltaTime, this.world.Map.mapID);
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
    Render.DrawScreen(this.camera, this.world, this.particles);
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
   * @function weatherParticles
   * @summary Spawns weather particles
   * @param {number} DeltaTime Change in time (in seconds) since last frame
   * @param {MaPreset} mapID The map that is being played
   * @todo Derive corners from camera bounds and anticipated position (possible with FightObserver branch)
   */
  private weatherParticles(DeltaTime: number, mapID: MapPreset) {
    // TODO: Derive corners from camera bounds + anticipated position?
    // Note: This is doable in the FightObserver branch (Camera.ScreenToWorld)
    // Branch needs to be merged before this feature can be used
    const topLeftCorner = new Vector(-10, -10, 10);
    const bottomRightCorner = new Vector(this.world.Map.Width + 10, this.world.Map.Height + 10, 12);

    switch (mapID) {
      case MapPreset.Snowy:
        this.weatherParticleTimer += 200 * DeltaTime; // Spawn around 200 particles per second
        PSnowfall.Spawn(this.particles, topLeftCorner, bottomRightCorner, Math.floor(this.weatherParticleTimer), 1); // Spawn integer amount
        break;
      default:
        return;
    }

    this.weatherParticleTimer -= Math.floor(this.weatherParticleTimer); // Subtract integer amount spawned
  }
}

export { ClientGraphics as default };