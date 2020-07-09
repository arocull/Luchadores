import Client from './ClientState';
import UIManager from './ui/UIManager';
import Camera from './Camera';
import { Particle, PRosePetal } from './particles';
import Render from './Render';
import RenderSettings from './RenderSettings';
import World from '../common/engine/World';
import { UIDeathNotification, UIPlayerInfo } from './ui';
import { MakeAnimator } from './animation';

class ClientGraphics {
  public uiManager: UIManager;
  private camera: Camera;
  private world: World;

  public viewport: HTMLCanvasElement;
  public canvas: CanvasRenderingContext2D;
  public fpsCounter: number[];

  public particles: Particle[];

  constructor(private clientState: Client) {
    this.uiManager = new UIManager();
    this.camera = this.clientState.camera;
    this.world = this.clientState.getWorld();

    this.clientState.uiManager = this.uiManager;
    this.world.Map.loadTexture();

    this.viewport = <HTMLCanvasElement>document.getElementById('render');
    this.canvas = this.viewport.getContext('2d');
    this.fpsCounter = [];

    this.particles = [];
  }

  public tick(DeltaTime: number) {
    for (let i = 0; i < this.world.Fighters.length; i++) {
      const a = this.world.Fighters[i];
      if (a) {
        // Tick animators, prune and generate new ones based off of need
        if (!a.Animator) a.Animator = MakeAnimator(a);
        else if (a.Animator) {
          a.Animator.Tick(DeltaTime);
          if (a.Animator.killEffectCountdown === 0) {
            PRosePetal.Burst(this.particles, a.Position, 0.2, 5, 20 * RenderSettings.ParticleAmount);
          }
        }
      }
    }

    Render.DrawScreen(this.canvas, this.camera, this.world.Map, this.world.Fighters, this.world.Bullets, this.particles, this.world.Props);
    this.uiManager.tick(DeltaTime, this.canvas, this.camera, this.clientState.character, this.clientState.connected, this.clientState.respawning, this.clientState.input);

    const playerList = this.clientState.getPlayerList();
    const killfeed = this.clientState.getKillFeed();

    if (this.uiManager.isPlayerListOpen() && !this.uiManager.inGUIMode()) {
      Render.DrawPlayerList(this.canvas, this.camera, 'Player List');
      for (let i = 0; i < playerList.length; i++) {
        playerList[i].update();
        playerList[i].cornerY = UIPlayerInfo.CORNERY_OFFSET + (i + 1) * UIPlayerInfo.HEIGHT;
        Render.DrawUIFrame(this.canvas, this.camera, playerList[i]);
      }
    }
    for (let i = 0; i < killfeed.length; i++) {
      killfeed[i].timeLeft -= DeltaTime;
      if (killfeed[i].timeLeft <= 0) {
        killfeed.splice(i, 1);
        i--;
      } else {
        killfeed[i].cornerY = i * UIDeathNotification.HEIGHT + UIDeathNotification.OFFSET;
        Render.DrawUIFrame(this.canvas, this.camera, killfeed[i]);
      }
    }

    if (RenderSettings.FPScounter) {
      if (this.fpsCounter.length >= 30) this.fpsCounter.shift();
      this.fpsCounter.push(DeltaTime);

      let avgDT = 0;
      for (let i = 0; i < this.fpsCounter.length; i++) {
        avgDT += this.fpsCounter[i];
      }
      avgDT /= this.fpsCounter.length;

      Render.DrawFPS(this.canvas, this.camera, avgDT);
    }
  }
}

export { ClientGraphics as default };