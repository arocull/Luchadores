import UIFrame from './UIFrame';
import UITextBox from './UITextBox';
import RenderSettings from '../RenderSettings';
import { MessageBus } from '../../common/messaging/bus';
import { RenderQuality } from '../../common/engine/Enums';
import { Particle } from '../particles';

class UISettingsMenu {
  private static WIDTH = 0.75;
  private static HEIGHT = 0.8;

  private static TITLE_HEIGHT = 0.05;
  private static CLOSE_BUTTON_WIDTH = 0.125;
  private static BUTTON_OFFSET = (UISettingsMenu.WIDTH / 4) / 4;
  private static BUTTON_SPACING = UISettingsMenu.BUTTON_OFFSET + (UISettingsMenu.WIDTH / 4);

  private static BASECOLOR = '#737373';
  private static BASEBORDER = '#454545';
  private static HOVERCOLOR = '#646464';
  private static HOVERBORDER = '#373737';

  private static BORDERTHICKNESS_SELECTED = 0.05;
  private static BORDERTHICKNESS_DEFAULT = 0.01;

  public frames: UIFrame[];
  private time: number = 0;

  private qualityLow: UIFrame;
  private qualityMedium: UIFrame;
  private qualityHigh: UIFrame;
  private particleLow: UIFrame;
  private particleMedium: UIFrame;
  private particleHigh: UIFrame;

  constructor(private renderSettings: RenderSettings) {
    const base = new UIFrame(
      (1 - UISettingsMenu.WIDTH) / 2, // Center X
      (1 - UISettingsMenu.HEIGHT) / 2, // Center Y
      UISettingsMenu.WIDTH,
      UISettingsMenu.HEIGHT,
      false,
    );
    base.color = UISettingsMenu.BASECOLOR;
    base.borderColor = UISettingsMenu.BASEBORDER;
    base.renderStyle = base.color; base.borderRenderStyle = base.borderColor;
    base.borderThickness = 0.1;

    const title = new UITextBox(
      base.cornerX,
      base.cornerY - UISettingsMenu.TITLE_HEIGHT,
      UISettingsMenu.WIDTH,
      UISettingsMenu.TITLE_HEIGHT,
      false,
      'Settings',
    );
    title.textFont = 'flamenco';
    title.textFontSize = 24;
    title.textStyle = '#ffffff';
    title.alpha = 0;

    const close = new UITextBox(
      base.cornerX + UISettingsMenu.WIDTH / 2 - (UISettingsMenu.WIDTH * UISettingsMenu.CLOSE_BUTTON_WIDTH) / 2,
      base.cornerY + UISettingsMenu.HEIGHT,
      UISettingsMenu.WIDTH * UISettingsMenu.CLOSE_BUTTON_WIDTH,
      UISettingsMenu.HEIGHT * 0.05,
      true,
      'Close',
    );
    this.MakeButton(close);
    close.borderThickness = 0;
    close.onClick = (() => {
      MessageBus.publish('UI_SettingsClose', null);
    });


    // Render Quality Settings
    const qualityText = new UITextBox(
      base.cornerX + UISettingsMenu.WIDTH * 0.05,
      base.cornerY + UISettingsMenu.HEIGHT * 0.05,
      UISettingsMenu.WIDTH,
      UISettingsMenu.HEIGHT * 0.05,
      false,
      'Render Quality',
    );
    qualityText.textFontSize = 24;
    qualityText.textStyle = '#ffffff';
    qualityText.alpha = 0;
    qualityText.textAlignment = 'left';

    const qualityDescript = new UITextBox(
      base.cornerX + UISettingsMenu.WIDTH * 0.025,
      base.cornerY + UISettingsMenu.HEIGHT * 0.1,
      UISettingsMenu.WIDTH * 0.95,
      UISettingsMenu.HEIGHT * 0.05,
      false,
      'Determines drawing of certain special effects like arena bound stretching and rotations. Performance impact varies by platform.',
    );
    qualityDescript.textFontSize = 18;
    qualityDescript.textStyle = '#ffffff';
    qualityDescript.alpha = 0;
    qualityDescript.textAlignment = 'left';
    qualityDescript.textWrapping = true;

    const qualityLow = new UITextBox(
      base.cornerX + UISettingsMenu.BUTTON_OFFSET,
      base.cornerY + UISettingsMenu.HEIGHT * 0.15,
      UISettingsMenu.WIDTH / 4,
      UISettingsMenu.HEIGHT * 0.075,
      true, 'Fast',
    );
    const qualityMedium = new UITextBox(
      base.cornerX + UISettingsMenu.BUTTON_OFFSET + UISettingsMenu.BUTTON_SPACING,
      qualityLow.cornerY, qualityLow.width, qualityLow.height, true, 'Balanced',
    );
    const qualityHigh = new UITextBox(
      base.cornerX + UISettingsMenu.BUTTON_OFFSET + 2 * UISettingsMenu.BUTTON_SPACING,
      qualityLow.cornerY, qualityLow.width, qualityLow.height, true, 'Pretty',
    );
    this.MakeButton(qualityLow);
    this.MakeButton(qualityMedium);
    this.MakeButton(qualityHigh);
    qualityLow.onClick = (() => {
      this.renderSettings.Quality = RenderQuality.Low;
    });
    qualityMedium.onClick = (() => {
      this.renderSettings.Quality = RenderQuality.Medium;
    });
    qualityHigh.onClick = (() => {
      this.renderSettings.Quality = RenderQuality.High;
    });


    // Particle Amount Settings
    const particleText = new UITextBox(
      base.cornerX + UISettingsMenu.WIDTH * 0.05,
      base.cornerY + UISettingsMenu.HEIGHT * 0.3,
      UISettingsMenu.WIDTH,
      UISettingsMenu.HEIGHT * 0.05,
      false,
      'Particles',
    );
    particleText.textFontSize = 24;
    particleText.textStyle = '#ffffff';
    particleText.alpha = 0;
    particleText.textAlignment = 'left';

    const particleDescript = new UITextBox(
      base.cornerX + UISettingsMenu.WIDTH * 0.025,
      base.cornerY + UISettingsMenu.HEIGHT * 0.35,
      UISettingsMenu.WIDTH * 0.95,
      UISettingsMenu.HEIGHT * 0.05,
      false,
      'How many particles should be simulated. The more particles the prettier the game, but the more processing power each frame takes.',
    );
    particleDescript.textWrapping = true;
    particleDescript.textFontSize = 18;
    particleDescript.textStyle = '#ffffff';
    particleDescript.alpha = 0;
    particleDescript.textAlignment = 'left';

    const particleLow = new UITextBox(
      base.cornerX + UISettingsMenu.BUTTON_OFFSET,
      base.cornerY + UISettingsMenu.HEIGHT * 0.4,
      UISettingsMenu.WIDTH / 4,
      UISettingsMenu.HEIGHT * 0.075,
      true, 'Minimal',
    );
    const particleMedium = new UITextBox(
      base.cornerX + UISettingsMenu.BUTTON_OFFSET + UISettingsMenu.BUTTON_SPACING,
      particleLow.cornerY, particleLow.width, particleLow.height, true, 'Medium',
    );
    const particleHigh = new UITextBox(
      base.cornerX + UISettingsMenu.BUTTON_OFFSET + 2 * UISettingsMenu.BUTTON_SPACING,
      particleLow.cornerY, particleLow.width, particleLow.height, true, 'Excessive',
    );
    this.MakeButton(particleLow);
    this.MakeButton(particleMedium);
    this.MakeButton(particleHigh);
    particleLow.onClick = (() => {
      this.renderSettings.ParticleAmount = 1;
    });
    particleMedium.onClick = (() => {
      this.renderSettings.ParticleAmount = 3;
    });
    particleHigh.onClick = (() => {
      this.renderSettings.ParticleAmount = 5;
    });

    this.qualityLow = qualityLow;
    this.qualityMedium = qualityMedium;
    this.qualityHigh = qualityHigh;
    this.particleLow = particleLow;
    this.particleMedium = particleMedium;
    this.particleHigh = particleHigh;

    // Booleans
    const cameraShakeText = new UITextBox(
      base.cornerX + UISettingsMenu.WIDTH * 0.05,
      base.cornerY + UISettingsMenu.HEIGHT * 0.6,
      UISettingsMenu.WIDTH,
      UISettingsMenu.HEIGHT * 0.05,
      false,
      'Camera Shake',
    );
    cameraShakeText.textFontSize = 24;
    cameraShakeText.textStyle = '#ffffff';
    cameraShakeText.alpha = 0;
    cameraShakeText.textAlignment = 'left';

    const cameraShake = new UITextBox(
      base.cornerX + UISettingsMenu.BUTTON_OFFSET,
      base.cornerY + UISettingsMenu.HEIGHT * 0.65,
      UISettingsMenu.WIDTH / 4,
      UISettingsMenu.HEIGHT * 0.075,
      true, 'Enabled',
    );
    this.MakeButton(cameraShake);
    cameraShake.onClick = (() => {
      this.renderSettings.EnableCameraShake = !this.renderSettings.EnableCameraShake;
      if (this.renderSettings.EnableCameraShake) {
        cameraShake.text = 'Enabled';
      } else {
        cameraShake.text = 'Disabled';
      }
    });

    const fpsCounterText = new UITextBox(
      base.cornerX + UISettingsMenu.WIDTH * 0.05 + 2 * UISettingsMenu.BUTTON_SPACING,
      base.cornerY + UISettingsMenu.HEIGHT * 0.6,
      UISettingsMenu.WIDTH,
      UISettingsMenu.HEIGHT * 0.05,
      false,
      'FPS Counter',
    );
    fpsCounterText.textFontSize = 24;
    fpsCounterText.textStyle = '#ffffff';
    fpsCounterText.alpha = 0;
    fpsCounterText.textAlignment = 'left';

    const fpsCounter = new UITextBox(
      base.cornerX + UISettingsMenu.BUTTON_OFFSET + 2 * UISettingsMenu.BUTTON_SPACING,
      base.cornerY + UISettingsMenu.HEIGHT * 0.65,
      UISettingsMenu.WIDTH / 4,
      UISettingsMenu.HEIGHT * 0.075,
      true, 'Disabled',
    );
    this.MakeButton(fpsCounter);
    fpsCounter.onClick = (() => {
      this.renderSettings.FPScounter = !this.renderSettings.FPScounter;
      if (this.renderSettings.FPScounter) {
        fpsCounter.text = 'Enabled';
      } else {
        fpsCounter.text = 'Disabled';
      }
    });

    this.frames = [base, title, close, qualityText, qualityDescript, qualityLow, qualityMedium, qualityHigh, particleText, particleDescript, particleLow, particleMedium, particleHigh, cameraShakeText, cameraShake, fpsCounterText, fpsCounter];
  }

  /* eslint-disable no-param-reassign */
  private MakeButton(button: UITextBox) {
    button.textFont = 'roboto';
    button.textFontSize = 16;
    button.textStyle = '#ffffff';
    button.color = UISettingsMenu.BASECOLOR;
    button.borderColor = UISettingsMenu.BASEBORDER;
    button.colorHover = UISettingsMenu.HOVERCOLOR;
    button.borderColorHover = UISettingsMenu.HOVERBORDER;
    button.renderStyle = button.color; button.borderRenderStyle = button.borderColor;
    button.borderThickness = UISettingsMenu.BORDERTHICKNESS_DEFAULT;
  }

  private SetBorder(button: UIFrame, selected: boolean) {
    if (selected) {
      button.borderColor = Particle.RGBToHex(75, 200, 100 + 50 * (Math.sin(Math.PI * this.time) + 1)); // 1 to 2
      button.borderColorHover = button.borderColor;
      button.borderThickness = UISettingsMenu.BORDERTHICKNESS_SELECTED;
    } else {
      button.borderColor = UISettingsMenu.BASEBORDER;
      button.borderColorHover = UISettingsMenu.HOVERBORDER;
      button.borderThickness = UISettingsMenu.BORDERTHICKNESS_DEFAULT;
    }
  }
  /* eslint-enable no-param-reassign */

  public Tick(DeltaTime: number) {
    this.time += DeltaTime;

    switch (this.renderSettings.Quality) {
      case RenderQuality.Low:
        this.SetBorder(this.qualityLow, true);
        this.SetBorder(this.qualityMedium, false);
        this.SetBorder(this.qualityHigh, false);
        break;
      case RenderQuality.Medium:
        this.SetBorder(this.qualityLow, false);
        this.SetBorder(this.qualityMedium, true);
        this.SetBorder(this.qualityHigh, false);
        break;
      case RenderQuality.High:
      default:
        this.SetBorder(this.qualityLow, false);
        this.SetBorder(this.qualityMedium, false);
        this.SetBorder(this.qualityHigh, true);
        break;
    }

    switch (this.renderSettings.ParticleAmount) {
      case 1:
        this.SetBorder(this.particleLow, true);
        this.SetBorder(this.particleMedium, false);
        this.SetBorder(this.particleHigh, false);
        break;
      case 2:
      case 3:
        this.SetBorder(this.particleLow, false);
        this.SetBorder(this.particleMedium, true);
        this.SetBorder(this.particleHigh, false);
        break;
      case 4:
      case 5:
      default:
        this.SetBorder(this.particleLow, false);
        this.SetBorder(this.particleMedium, false);
        this.SetBorder(this.particleHigh, true);
        break;
    }
  }
}

export { UISettingsMenu as default };