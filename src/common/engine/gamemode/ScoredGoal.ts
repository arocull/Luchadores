import { Team } from '../Enums';
import Fighter from '../Fighter';

class ScoredGoal {
  constructor(public ball: Fighter, public scorer: Fighter, public teamScored: Team) {
  }
}

export { ScoredGoal as default };