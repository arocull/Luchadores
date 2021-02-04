import { FighterType, fighterTypeToString } from '../../common/engine/Enums';
import { MessageBus } from '../../common/messaging/bus';
import SoundManager from '../audio/SoundManager';

class UIClassSelect {
  private selected: FighterType;

  private base: HTMLElement = document.getElementById('character_select');
  private confirmButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById('character_confirm');

  constructor(rows: number, columns: number, private displayedLuchadors: number) {
    this.selected = FighterType.Sheep;


    let luchador: number = 0;
    const list = document.getElementById('character_list'); // Get table to add items too
    for (let y = 0; y < rows && luchador < displayedLuchadors; y++) {
      const row: HTMLTableRowElement = <HTMLTableRowElement>document.createElement('tr');
      list.appendChild(row); // Add row element to the table

      for (let x = 0; x < columns && luchador < displayedLuchadors; x++) {
        row.appendChild(this.buildPortrait(luchador));

        luchador++;
      }
    }

    // Displayed class portrait
    const portrait: HTMLImageElement = <HTMLImageElement>document.getElementById('character_portrait');

    const fighterName = document.getElementById('character_name');
    const flavorText = document.getElementById('character_flavor');
    const descript = document.getElementById('character_descript');

    // Select button action
    this.confirmButton.addEventListener('click', () => {
      this.confirmSelect();
    });

    MessageBus.subscribe('UI_ClickLuchador', (clickedLuchador: FighterType) => {
      this.selected = clickedLuchador;
      portrait.src = `Portraits/${fighterTypeToString(this.selected)}.png`;
      portrait.alt = fighterTypeToString(this.selected);

      SoundManager.playSound(`FighterName/${fighterTypeToString(this.selected)}`);

      switch (clickedLuchador) {
        default:
        case FighterType.Sheep:
          fighterName.textContent = 'La Oveja Grande';
          flavorText.textContent = 'She really, REALLY likes chocolate.';
          descript.textContent = 'Roll around and build momentum, before slamming into enemies and crushing them under your immense weight.';
          break;
        case FighterType.Deer:
          fighterName.textContent = 'El Ciervo Macabro';
          flavorText.textContent = 'Don\'t ask where he got the guns.';
          descript.textContent = 'Fire a constant stream of long-range bullets with precision, and dodge attacks with superior agility.';
          break;
        case FighterType.Flamingo:
          fighterName.textContent = 'El Flamenacre';
          flavorText.textContent = 'He\'s just really weird.';
          descript.textContent = 'Reign terror upon your foes by spewing fire upon them--just don\'t run out of breath.';
          break;
        case FighterType.Toad:
          fighterName.textContent = 'spanish pun about electricity + toad';
          flavorText.textContent = 'He\'s always feeling a bit ecstatic.';
          descript.textContent = 'Build up static charge by hopping around, before discharing massive voltage on opponents by wandering close.';
          break;
      }
    });

    MessageBus.publish('UI_ClickLuchador', FighterType.Sheep); // Use sheep defaults
  }

  private buildPortrait(fighter: FighterType): HTMLTableDataCellElement {
    const tableData: HTMLTableDataCellElement = <HTMLTableDataCellElement>document.createElement('td');

    const container: HTMLDivElement = <HTMLDivElement>document.createElement('div');
    container.className = 'portrait_container';

    const img: HTMLImageElement = <HTMLImageElement>document.createElement('img');
    img.className = 'portrait';
    img.src = `Portraits/${fighterTypeToString(fighter)}.png`;
    img.alt = fighterTypeToString(fighter);
    img.id = `charSelect_icon_${fighterTypeToString(fighter)}`;

    tableData.appendChild(container);
    container.appendChild(img);

    img.addEventListener('click', () => {
      MessageBus.publish('UI_ClickLuchador', fighter);
    });

    return tableData;
  }

  // Selects corresponding fighter - clamps number between 0 and number of displayed luchadores
  public quickSelect(fighter: FighterType) {
    MessageBus.publish('UI_ClickLuchador', Math.max(Math.min(fighter - 1, this.displayedLuchadors - 1), FighterType.Sheep));
  }
  // Clicks confirm button if possible
  public confirmSelect() {
    if (!this.confirmButton.hidden) {
      MessageBus.publish('PickCharacter', this.selected);
    }
  }

  // We hide the confirm button initially to prevent character selects while loading
  public addConfirmButton() {
    this.confirmButton.hidden = false;
  }

  public open() {
    this.base.hidden = false;
  }
  public close() {
    this.base.hidden = true;
  }
}

export { UIClassSelect as default };