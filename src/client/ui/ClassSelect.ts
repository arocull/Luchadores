import UIFrame from './UIFrame';
import UITextBox from './UITextBox';
import UILuchadorPortrait from './LuchadorPortrait';
import { FighterType, fighterTypeToString } from '../../common/engine/Enums';
import { MessageBus } from '../../common/messaging/bus';

const SIDEBAR_WIDTH: number = 0.3;
const INNER_WIDTH: number = 1 - SIDEBAR_WIDTH;

class UIClassSelect {
  public frames: UIFrame[];
  private selected: FighterType;

  private confirmButton: UITextBox;
  private confirmButtonInList: boolean = false;

  constructor(rows: number, columns: number, private displayedLuchadors: number) {
    this.frames = [];
    this.selected = FighterType.Sheep;

    const sidebar = new UIFrame(INNER_WIDTH, 0, SIDEBAR_WIDTH, 1, false);
    sidebar.renderStyle = '#b5651d';
    sidebar.borderRenderStyle = '#a4540c';
    sidebar.borderThickness = 0.05;
    this.frames.push(sidebar);

    const scaleX = INNER_WIDTH / (columns + 1);
    const scaleY = 1 / (rows + 1);
    const scale = Math.max(scaleX, scaleY);

    const gapX = (INNER_WIDTH - scale * columns) / columns;
    const gapY = (1 - scale * rows) / rows;

    let luchador: number = 0;
    for (let y = 0; y < rows && luchador < displayedLuchadors; y++) {
      for (let x = 0; x < columns && luchador < displayedLuchadors; x++) {
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
    const portraitScale = scaleY * 1.3;
    const portrait = new UIFrame(
      INNER_WIDTH + (SIDEBAR_WIDTH - portraitScale) / 2,
      0.05,
      portraitScale,
      portraitScale,
      false,
    );
    portrait.image = new Image();
    portrait.image.src = `Portraits/${fighterTypeToString(this.selected)}.png`;
    portrait.constrainAspect = true;
    portrait.borderThickness = 0.1;
    this.frames.push(portrait);

    const fighterName = new UITextBox(INNER_WIDTH, portraitScale + 0.075, SIDEBAR_WIDTH, 0.05, false, 'Name');
    fighterName.textFontSize = 56;
    fighterName.alpha = 0;
    fighterName.textStyle = '#ffffff';
    fighterName.textFont = 'flamenco';
    this.frames.push(fighterName);

    const flavorText = new UITextBox(INNER_WIDTH, portraitScale + 0.1325, SIDEBAR_WIDTH, 0.025, false, 'Flavor Text');
    flavorText.textFontSize = 18;
    flavorText.alpha = 0;
    flavorText.textStyle = '#dddddd';
    flavorText.textFont = 'flamenco';
    this.frames.push(flavorText);

    const descript = new UITextBox(INNER_WIDTH, portraitScale + 0.16, SIDEBAR_WIDTH, 0.045, false, 'Description');
    descript.textFontSize = 24;
    descript.alpha = 0;
    descript.textStyle = '#eeeeee';
    descript.textWrapping = true;
    descript.textAlignment = 'left';
    descript.textInnerWidth = 0.95;
    this.frames.push(descript);

    // Select button
    const button = new UITextBox(
      INNER_WIDTH + SIDEBAR_WIDTH * 0.15,
      0.9,
      SIDEBAR_WIDTH * 0.7,
      0.075,
      true,
      'Please wait...',
    );
    button.borderThickness = 0.01;
    button.color = '#444444';
    button.colorHover = '#444444';
    button.borderColor = '#333333';
    button.borderColorHover = '#333333';
    this.confirmButton = button;
    this.frames.push(button);

    MessageBus.subscribe('UI_ClickLuchador', (clickedLuchador: FighterType) => {
      this.selected = clickedLuchador;
      portrait.image.src = `Portraits/${fighterTypeToString(this.selected)}.png`;

      switch (clickedLuchador) {
        default:
        case FighterType.Sheep:
          fighterName.text = 'La Oveja Grande';
          flavorText.text = 'She really, REALLY likes chocolate.';
          descript.text = '\tRoll around and build momentum, before slamming into enemies and crushing them under your immense weight.';
          break;
        case FighterType.Deer:
          fighterName.text = 'El Ciervo Macabro';
          flavorText.text = 'Don\'t ask where he got the guns.';
          descript.text = '\tFire a constant stream of long-range bullets with precision, and dodge attacks with superior agility.';
          break;
        case FighterType.Flamingo:
          fighterName.text = 'El Flamenacre';
          flavorText.text = 'He\'s just really weird.';
          descript.text = '\tReign terror upon your foes by spewing fire upon them--just don\'t run out of breath.';
          break;
        case FighterType.Toad:
          fighterName.text = 'spanish pun about electricity + toad';
          flavorText.text = 'He\'s always feeling a bit ecstatic.';
          descript.text = '\tBuild up static charge by hopping around, before discharing massive voltage on opponents by wandering close.';
          break;
      }
    });

    MessageBus.publish('UI_ClickLuchador', FighterType.Sheep); // Use sheep defaults
  }

  // Selects corresponding fighter - clamps number between 0 and number of displayed luchadores
  public quickSelect(fighter: FighterType) {
    MessageBus.publish('UI_ClickLuchador', Math.max(Math.min(fighter - 1, this.displayedLuchadors - 1), FighterType.Sheep));
  }
  // Clicks confirm button if possible
  public confirmSelect() {
    if (this.confirmButtonInList) {
      this.confirmButton.onHover(true); // Show hover effect
      this.confirmButton.onClick(); // Click button for same functionality
    }
  }

  public addConfirmButton() {
    if (!this.confirmButtonInList) {
      this.confirmButtonInList = true;

      this.confirmButton.color = '#11dd33';
      this.confirmButton.colorHover = '#22ee44';
      this.confirmButton.borderColor = '#22ee44';
      this.confirmButton.borderColorHover = '#33ff55';
      this.confirmButton.text = 'Select';
      this.confirmButton.onClick = (() => {
        MessageBus.publish('PickCharacter', this.selected);
      });
    }
  }
}

export { UIClassSelect as default };