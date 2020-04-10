import UIFrame from './UIFrame';
import { UIFrameType } from '../../common/engine/Enums';

class UITextBox extends UIFrame {
  public text: string;
  public textStyle: string = '#000000';
  public textAlpha: number = 1;
  public textFont: string = 'roboto';
  public textFontSize: number = 0;
  public textAlignment: CanvasTextAlign = 'center';

  constructor(cornerX: number, cornerY: number, width: number, height: number, onHoverEffect: boolean, text: string) {
    super(cornerX, cornerY, width, height, onHoverEffect);

    this.text = text;
    this.type = UIFrameType.Text;
  }
}

export { UITextBox as default };