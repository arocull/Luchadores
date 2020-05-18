import UIFrame from './UIFrame';
import UITextBox from './UITextBox';
import RenderSettings from '../RenderSettings';
import { MessageBus } from '../../common/messaging/bus';

class UISettingsMenu {
  private static WIDTH = 0.75;
  private static HEIGHT = 0.8;

  private static TITLE_HEIGHT = 0.05;
  private static CLOSE_BUTTON_WIDTH = 0.125;
  private static RENDERQUALITY_OFFSET = (UISettingsMenu.WIDTH - (UISettingsMenu.WIDTH * (3 / 4))) / 2;

  private static BASECOLOR = '#737373';
  private static BASEBORDER = '#454545';
  private static HOVERCOLOR = '#646464';
  private static HOVERBORDER = '#373737';

  public frames: UIFrame[];

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
      base.cornerX + 0.05,
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
      base.cornerX + 0.025,
      base.cornerY + UISettingsMenu.HEIGHT * 0.1,
      UISettingsMenu.WIDTH * 0.95,
      UISettingsMenu.HEIGHT * 0.05,
      false,
      'Determines drawing of certain effects like arena bound stretching and depth sorting.',
    );
    qualityDescript.textFontSize = 18;
    qualityDescript.textStyle = '#ffffff';
    qualityDescript.alpha = 0;
    qualityDescript.textAlignment = 'left';
    qualityDescript.textWrapping = true;

    const qualityLow = new UITextBox(
      base.cornerX + UISettingsMenu.RENDERQUALITY_OFFSET,
      base.cornerY + UISettingsMenu.HEIGHT * 0.2,
      UISettingsMenu.WIDTH / 4,
      UISettingsMenu.HEIGHT * 0.075,
      true,
      'Low',
    );
    this.MakeButton(qualityLow);
    qualityLow.onClick = (() => {
      this.renderSettings.Quality = 1;
    });
    const qualityMedium = new UITextBox(
      base.cornerX + UISettingsMenu.RENDERQUALITY_OFFSET + (UISettingsMenu.WIDTH / 3),
      base.cornerY + UISettingsMenu.HEIGHT * 0.2,
      UISettingsMenu.WIDTH / 4,
      UISettingsMenu.HEIGHT * 0.075,
      true,
      'Medium',
    );
    this.MakeButton(qualityMedium);
    qualityMedium.onClick = (() => {
      this.renderSettings.Quality = 2;
    });
    const qualityHigh = new UITextBox(
      base.cornerX + UISettingsMenu.RENDERQUALITY_OFFSET + 2 * (UISettingsMenu.WIDTH / 3),
      base.cornerY + UISettingsMenu.HEIGHT * 0.2,
      UISettingsMenu.WIDTH / 4,
      UISettingsMenu.HEIGHT * 0.075,
      true,
      'High',
    );
    this.MakeButton(qualityHigh);
    qualityHigh.onClick = (() => {
      this.renderSettings.Quality = 3;
    });


    // Particle Amount Settings
    const particleText = new UITextBox(
      base.cornerX + 0.05,
      base.cornerY + 0.3,
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
      base.cornerX + 0.025,
      base.cornerY + 0.35,
      UISettingsMenu.WIDTH * 0.95,
      UISettingsMenu.HEIGHT * 0.05,
      false,
      'How many particles should be drawn. The more particles the prettier the game, but the more processing power it takes to draw them.',
    );
    particleDescript.textWrapping = true;
    particleDescript.textFontSize = 18;
    particleDescript.textStyle = '#ffffff';
    particleDescript.alpha = 0;
    particleDescript.textAlignment = 'left';

    this.frames = [base, title, close, qualityText, qualityDescript, qualityLow, qualityMedium, qualityHigh, particleText, particleDescript];
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
    button.borderThickness = 0.01;
  }
  /* eslint-enable no-param-reassign */
}

export { UISettingsMenu as default };