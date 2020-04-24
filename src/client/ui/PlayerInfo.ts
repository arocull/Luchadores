import { UIFrameType, fighterTypeToString } from '../../common/engine/Enums';
import UIFrame from './UIFrame';
import Player from '../../common/engine/Player';

class UIPlayerInfo extends UIFrame {
  public static LIST_WIDTH = 0.6;
  public static LIST_HEIGHT = 0.8;
  public static HEIGHT = 0.05;
  public static CORNERX_OFFSET = (1 - UIPlayerInfo.LIST_WIDTH) / 2;
  public static CORNERY_OFFSET = (1 - UIPlayerInfo.LIST_HEIGHT) / 2;

  public fighter: string = 'Selecting';

  constructor(private owner: Player, public isClient = false) {
    super(UIPlayerInfo.CORNERX_OFFSET, 0, UIPlayerInfo.LIST_WIDTH, UIPlayerInfo.HEIGHT, false);

    this.type = UIFrameType.PlayerInfo;

    this.alpha = 0;
  }

  public update() {
    if (this.owner.getCharacter() && this.owner.getCharacter().HP > 0) this.fighter = fighterTypeToString(this.owner.getCharacter().getCharacter());
    else this.fighter = 'Selecting';
  }

  public getOwner(): Player {
    return this.owner;
  }

  public static SORT(a: UIPlayerInfo, b: UIPlayerInfo): number {
    if (a.getOwner().getKills() < b.getOwner().getKills()) return 1;
    if (a.getOwner().getKills() > b.getOwner().getKills()) return -1;
    return 0;
  }
}

export { UIPlayerInfo as default };