import { UIFrameType, fighterTypeToString } from '../../common/engine/Enums';
import UIFrame from './UIFrame';
import Player from '../../common/engine/Player';

class UIPlayerInfo extends UIFrame {
  public static LIST_WIDTH = 0.8;
  public static LIST_HEIGHT = 0.9;
  public static HEIGHT = 0.05;

  public fighter: string = 'Selecting';
  public kills: number = 0;

  constructor(private owner: Player, public charID: number, public username: string) {
    super((1 - UIPlayerInfo.LIST_WIDTH) / 2, (1 - UIPlayerInfo.LIST_HEIGHT) / 2, UIPlayerInfo.LIST_WIDTH, UIPlayerInfo.HEIGHT, false);

    this.type = UIFrameType.PlayerInfo;
  }

  public update() {
    if (this.owner.getCharacter()) this.fighter = fighterTypeToString(this.owner.getCharacter().getCharacter());
    else this.fighter = 'Selecting';

    this.kills = this.owner.getKills();
  }

  public getOwner(): Player {
    return this.owner;
  }
}

export { UIPlayerInfo as default };