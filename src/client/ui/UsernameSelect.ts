import UIFrame from './UIFrame';
import UITextBox from './UITextBox';
import { MessageBus } from '../../common/messaging/bus';
import { Particle } from '../particles';

class UIUsernameSelect {
  public frames: UIFrame[];

  private name: string;
  private selected: boolean;
  private holdingShift: boolean;

  private display: UITextBox;
  private error: UITextBox;

  private time: number;

  constructor() {
    this.frames = [];

    const title = new UITextBox(0, 0, 1, 0.2, false, 'LUCHADORES');
    title.alpha = 0;
    title.textAlpha = 1;
    title.textFontSize = 128;
    title.textFont = 'roboto';
    title.textBase = 'hanging';
    this.frames.push(title);

    this.name = '';
    this.selected = true;
    this.holdingShift = true;
    this.time = 0;

    const instructions = new UITextBox(0, 0.3, 1, 0.075, false, 'Please type in a username.');
    instructions.alpha = 0;
    instructions.textStyle = '#ffffff';
    const instructions2 = new UITextBox(0, 0.4, 1, 0.075, false, 'It will last for this session only.');
    instructions2.alpha = 0;
    instructions2.textStyle = '#ffffff';
    this.frames.push(instructions);
    this.frames.push(instructions2);

    this.display = new UITextBox(0.3, 0.5, 0.4, 0.1, true, this.name);
    this.display.borderThickness = 0.1;
    this.display.textAlignment = 'left';
    this.display.textBase = 'middle';
    this.display.textInnerWidth = 0.95;
    this.display.onClick = (() => {
      this.selected = true;
      this.time = 0;
    });
    this.frames.push(this.display);

    this.error = new UITextBox(0, 0.65, 1, 0.1, false, 'Nicknames must be within 3 and 24 characters.');
    this.error.renderStyle = '#330000';
    this.error.alpha = 0;
    this.error.textStyle = '#ff2222';
    this.error.textAlpha = 0;
    this.frames.push(this.error);

    const confirm = new UITextBox(0.45, 0.8, 0.1, 0.075, true, 'Confirm');
    confirm.color = '#11dd33';
    confirm.colorHover = '#22ee44';
    confirm.borderColor = '#22ee44';
    confirm.borderColorHover = '#33ff55';
    confirm.borderThickness = 0.05;
    confirm.onClick = (() => {
      this.submitResponse();
    });
    this.frames.push(confirm);
  }

  private submitResponse() {
    this.selected = false;

    this.name = this.name.trimRight();
    this.display.text = this.name;

    if (this.name.length > 2 && this.name.length <= 24) {
      MessageBus.publish('PickUsername', this.name);
    } else { // Otherwise, show error
      this.error.alpha = 1;
      this.error.textAlpha = 1;
    }
  }

  public tick(DeltaTime: number) {
    this.time += DeltaTime;

    this.display.drawCursor = this.selected;

    if (this.selected) {
      const perc = (Math.sin(Math.PI * this.time) + 1) / 2;
      this.display.borderRenderStyle = Particle.RGBToHex(40, 100, 100 + 100 * perc);
      this.display.cursorAlpha = perc;
    }
  }

  public getTextBox(): UITextBox {
    return this.display;
  }
  public setCursorPosition(newPosition: number) {
    this.display.cursorPosition = Math.min(newPosition, this.display.width * this.display.textInnerWidth);
  }

  public deselect() {
    this.selected = false;
  }
  public typeCharacter(char: string) {
    if (this.selected) {
      this.name += char;
      this.name = this.name.trimLeft();

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