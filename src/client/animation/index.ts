import { Fighter } from '../../common/engine/fighters';
import RenderSettings from '../RenderSettings';
import { FighterType } from '../../common/engine/Enums';

import Animator from './Animator';
import AnimSheep from './Sheep';
import AnimDeer from './Deer';
import AnimFlamingo from './Flamingo';


function MakeAnimator(owner: Fighter, settings: RenderSettings): Animator {
  switch (owner.getCharacter()) {
    case FighterType.Sheep:
      return new AnimSheep(owner, settings);
    case FighterType.Deer:
      return new AnimDeer(owner, settings);
    case FighterType.Flamingo:
      return new AnimFlamingo(owner, settings);
    default:
      return new Animator(owner, settings);
  }
}


export {
  Animator,
  AnimSheep,
  AnimDeer,
  AnimFlamingo,
  MakeAnimator,
};