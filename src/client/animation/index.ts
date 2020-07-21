import { Fighter } from '../../common/engine/fighters';
import { FighterType } from '../../common/engine/Enums';

import Animator from './Animator';
import AnimSheep from './Sheep';
import AnimDeer from './Deer';
import AnimFlamingo from './Flamingo';

import AnimSoccerball from './Soccerball';


function MakeAnimator(owner: Fighter): Animator {
  switch (owner.getCharacter()) {
    case FighterType.Sheep:
      return new AnimSheep(owner);
    case FighterType.Deer:
      return new AnimDeer(owner);
    case FighterType.Flamingo:
      return new AnimFlamingo(owner);
    case FighterType.Soccerball:
      return new AnimSoccerball(owner);
    default:
      return new Animator(owner);
  }
}


export {
  Animator,
  AnimSheep,
  AnimDeer,
  AnimFlamingo,
  AnimSoccerball,
  MakeAnimator,
};