import UIFrame from './UIFrame';
import { MessageBus } from '../../common/messaging/bus';
import { fighterTypeToString } from '../../common/engine/Enums';

class UILuchadorPortrait extends UIFrame {
  constructor(cornerX: number, cornerY: number, width: number, height: number, private luchador: number) {
    super(cornerX, cornerY, width, height, true);

    this.color = '#b5651d';
    this.colorHover = '#654321';

    this.borderColor = '#000000';
    this.borderColorHover = '#33bbff';

    this.renderStyle = this.color;
    this.borderColor = this.color;

    this.constrainAspect = true;

    this.image = new Image();
    this.image.src = `Portraits/${fighterTypeToString(luchador)}.png`;
  }

  onClick() {
    super.onClick();
    MessageBus.publish('UI_ClickLuchador', this.luchador);
  }
}

export { UILuchadorPortrait as default };