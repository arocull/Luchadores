import UIFrame from './UIFrame';
import { MessageBus } from '../../common/messaging/bus';
import { fighterTypeToString } from '../../common/engine/Enums';
import AssetPreloader from '../AssetPreloader';

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

    AssetPreloader.getImage(`Portraits/${fighterTypeToString(luchador)}.png`).then((img) => {
      this.image = img;
    });
  }

  onClick() {
    super.onClick();
    MessageBus.publish('UI_ClickLuchador', this.luchador);
  }
}

export { UILuchadorPortrait as default };