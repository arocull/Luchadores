import UIFrame from './UIFrame';
import UITextBox from './UITextBox';
import { MessageBus } from '../../common/messaging/bus';

class UIUsernameSelect {
  public frames: UIFrame[];

  private name: string;
  private selected: boolean;
  private holdingShift: boolean;

  private display: UITextBox;

  constructor() {
    this.frames = [];

    const title = new UITextBox(0, 0, 1, 0.2, false, 'LUCHADORES');
    title.alpha = 0;
    title.textAlpha = 1;
    title.textFontSize = 128;
    title.textFont = 'roboto';
    this.frames.push(title);

    this.name = '';
    this.selected = false;
    this.holdingShift = true;

    this.display = new UITextBox(0.3, 0.5, 0.4, 0.1, true, this.name);
    this.display.borderThickness = 0.1;
    this.display.onClick = (() => {
      this.selected = true;
    });
    this.frames.push(this.display);

    const confirm = new UITextBox(0.45, 0.8, 0.1, 0.075, true, 'Confirm');
    confirm.onClick = (() => {
      this.submitResponse();
    });
    this.frames.push(confirm);
  }

  private submitResponse() {
    this.selected = false;
    if (this.name.length > 2 && this.name.length <= 20) {
      MessageBus.publish('PickUsername', this.name);
    } // Otherwise, show error
  }

  public deselect() {
    this.selected = false;
  }
  public typeCharacter(char: string) {
    if (this.selected) {
      this.name += char;

      this.display.text = this.name;
    }
  }
  public shift(newShift: boolean) {
    this.holdingShift = newShift;
  }
  public backspace() {
    if (this.selected) {
      this.name = this.name.substr(0, this.name.length - 1);

      this.display.text = this.name;
    }
  }
  public enter() {
    if (this.selected) this.submitResponse();
  }
}

export { UIUsernameSelect as default };