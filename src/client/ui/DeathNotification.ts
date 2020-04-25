import { FighterType, UIFrameType } from '../../common/engine/Enums';
import UIFrame from './UIFrame';

class UIDeathNotification extends UIFrame {
  public static OFFSET = 0.015;
  public static HEIGHT = 0.02;

  public timeLeft: number = 10;

  constructor(
    public death: string,
    public killer: string,
    public method: FighterType,
    public wasDeath: boolean,
    public wasKiller: boolean,
  ) {
    super(0.5, 0, 0.5 - UIDeathNotification.OFFSET, UIDeathNotification.HEIGHT, false);
    this.alpha = 0;

    this.type = UIFrameType.DeathNotification;
  }
}

export { UIDeathNotification as default };