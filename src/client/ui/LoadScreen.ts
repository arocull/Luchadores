import UIFrame from './UIFrame';
import UITextBox from './UITextBox';

const BAR_WIDTH: number = 0.995;
const BAR_HEIGHT: number = 0.9;

class UILoadScreen {
  public frames: UIFrame[];

  private bwid: number;
  private bar: UIFrame;
  private text: UITextBox;

  constructor() {
    this.frames = [];

    const base = new UIFrame(0.1, 0.45, 0.8, 0.1, false);
    base.renderStyle = '#777777'; // Should this be an image texture?

    this.bwid = base.width * BAR_WIDTH;
    const bhei = base.height * BAR_HEIGHT;

    const background = new UIFrame(0, 0, 1, 1, false);
    background.renderStyle = '#333333';

    const barBack = new UIFrame(
      base.cornerX + (base.width - this.bwid) / 2,
      base.cornerY + (base.height - bhei) / 2,
      this.bwid,
      bhei,
      false,
    );
    barBack.renderStyle = '#014423';

    this.bar = new UIFrame(barBack.cornerX, barBack.cornerY, 0, bhei, false);
    this.bar.renderStyle = '#11aa77';

    this.text = new UITextBox(base.cornerX, base.cornerY - 0.2, base.width, 0.2, false, '0% loaded...');
    this.text.textAlignment = 'right';
    this.text.textFontSize = 48;
    this.text.alpha = 0;
    this.text.textStyle = '#ffffff';

    this.frames.push(background);
    this.frames.push(base);
    this.frames.push(barBack);
    this.frames.push(this.bar);
    this.frames.push(this.text);
  }

  public update(percent: number) {
    this.bar.width = this.bwid * percent;
    this.text.text = `${Math.floor(percent * 100)}% loaded...`;
  }
}

export { UILoadScreen as default };