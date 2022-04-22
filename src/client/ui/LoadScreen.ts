import UIFrame from './UIFrame';
import UITextBox from './UITextBox';

const BAR_WIDTH: number = 0.995;
const BAR_HEIGHT: number = 0.9;

class UILoadScreen {
  public frames: UIFrame[];

  private bwid: number;
  private bar: UIFrame;
  private text: UITextBox;

  private htmlDiv: HTMLElement;

  constructor() {
    this.frames = [];

    const base = new UIFrame(0.1, 0.85, 0.8, 0.1, false);
    base.renderStyle = '#777777';

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
    barBack.renderStyle = '#7f0000';

    this.bar = new UIFrame(barBack.cornerX, barBack.cornerY, 0, bhei, false);
    this.bar.renderStyle = '#fea711';

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


    this.htmlDiv = document.getElementById('load_screen');
    this.htmlDiv.hidden = false;
  }

  public update(percent: number) {
    this.bar.width = this.bwid * percent;
    this.text.text = `${Math.floor(percent * 100)}% loaded...`;
  }

  public hide() {
    this.htmlDiv.hidden = true;
  }
}

export { UILoadScreen as default };