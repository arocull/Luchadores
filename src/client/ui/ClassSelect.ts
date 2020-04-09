import UIFrame from './UIFrame';
import UITextBox from './UITextBox';
import UILuchadorPortrait from './LuchadorPortrait';
import { FighterType, fighterTypeToString } from '../../common/engine/Enums';
import { MessageBus } from '../../common/messaging/bus';

class UIClassSelect {
  private static SIDEBAR_WIDTH: number = 0.3;
  private static INNER_WIDTH: number = 1 - UIClassSelect.SIDEBAR_WIDTH;

  public frames: UIFrame[];
  private selected: FighterType;

  constructor(rows: number, columns: number, displayedLuchadors: number) {
    this.frames = [];
    this.selected = FighterType.Sheep;

    const sidebar = new UIFrame(UIClassSelect.INNER_WIDTH, 0, UIClassSelect.SIDEBAR_WIDTH, 1, false);
    sidebar.renderStyle = '#b5651d';
    sidebar.borderRenderStyle = '#ee0011';
    sidebar.borderThickness = 0.1;
    this.frames.push(sidebar);

    const scaleX = UIClassSelect.INNER_WIDTH / (columns + 1);
    const scaleY = 1 / (rows + 1);
    const scale = scaleY;

    const gapX = (UIClassSelect.INNER_WIDTH - scale * columns) / columns;
    const gapY = (1 - scale * rows) / rows;

    let luchador: number = 0;
    for (let x = 0; x < columns && luchador < displayedLuchadors; x++) {
      for (let y = 0; y < rows && luchador < displayedLuchadors; y++) {
        const portrait = new UILuchadorPortrait(
          (gapX / 2) + (gapX + scale) * x,
          (gapY / 2) + (gapY + scale) * y,
          scale,
          scale,
          luchador,
        );
        portrait.borderThickness = 0.1;

        this.frames.push(portrait);

        luchador++;
      }
    }

    // Displayed class portrait
    const portrait = new UIFrame(
      UIClassSelect.INNER_WIDTH + (UIClassSelect.SIDEBAR_WIDTH - scaleX) / 2,
      0.05,
      scaleX,
      scaleY,
      false,
    );
    portrait.image = new Image();
    portrait.image.src = `Portraits/${fighterTypeToString(this.selected)}.png`;
    portrait.restrainAspect = true;
    this.frames.push(portrait);

    // Select button
    const button = new UITextBox(
      UIClassSelect.INNER_WIDTH + UIClassSelect.SIDEBAR_WIDTH * 0.1,
      0.9,
      UIClassSelect.SIDEBAR_WIDTH * 0.8,
      0.05,
      true,
      'Select',
    );
    button.onClick = (() => {
      MessageBus.publish('PickCharacter', this.selected);
    });
    this.frames.push(button);

    MessageBus.subscribe('UI_ClickLuchador', (clickedLuchador: FighterType) => {
      this.selected = clickedLuchador;
      portrait.image.src = `Portraits/${fighterTypeToString(this.selected)}.png`;
    });
  }
}

export { UIClassSelect as default };