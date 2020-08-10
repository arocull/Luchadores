/* eslint-disable object-curly-newline */
import Random from '../common/engine/Random';
import World from '../common/engine/World';
import Player from '../common/engine/Player';
import { FighterType, GamePhase } from '../common/engine/Enums';
import { TeamManager, MakeGamemode, WinStatus } from '../common/engine/gamemode';
import { MessageBus } from '../common/messaging/bus';
/* eslint-enable object-curly-newline */

/**
 * @class
 * @name RoundManager
 * @classdesc Management system for gamemodes and rounds. Does all the computation behind gamemodes in an attempt to keep Clockwork and World simplified.
 */
class RoundManager {
  private world: World;
  private winStatus: WinStatus;

  constructor(
    private players: Player[], // Should share pointer to connections inside clockwork
  ) {
    this.setupRound(); // Initializes world
  }


  /**
   * @function forceRespawns
   * @summary Forces respawns on all players with existing fighters and resets player stats
   */
  private forceRespawns() {
    for (let i = 0; i < this.players.length; i++) {
      const plr = this.players[i];
      if (plr.getCharacter()) {
        const fighterClass: FighterType = plr.getCharacter().getCharacter();

        // Remove existing character from world
        const index = this.world.Fighters.indexOf(plr.getCharacter());
        if (index >= 0) {
          this.world.Fighters.splice(index, 1);
        }

        // Make sure they're dead and doesn't count as a kill
        plr.getCharacter().HP = 0;
        plr.getCharacter().LastHitBy = 0;
        plr.removeCharacter();

        // Respawn a new character for them ASAP
        plr.assignCharacter(this.world.spawnFighter(plr, fighterClass)); // Spawn them a fighter
      }
      plr.resetStats();
    }
  }


  /**
   * @function setupRound
   * @summary Selects a random map and gamemode, broadcasts a ruleset message, and sets up the round
   *
   * @todo Random gamemode picks based off of number of players
   * @todo Potentially add voting options in future?
   * @todo Servers dedicated to single gamemodes
   * @todo Custom game modes on private servers
   */
  private setupRound() {
    this.world = new World((Math.random() > 0.5) ? 0 : 1, (Math.random() > 0.6), false);
    this.world.doReaping = true;

    // Clear out all characters and clear out stats as this is a new match
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].removeCharacter();
      this.players[i].resetStats();
    }

    // Get match weights
    let weights: number[]; // Goes in order of Death, TeamDeath, Skirm, TeamSkirm, Zone, TeamZone, Soccer
    if (this.players.length > 5) weights = [3, 2, 2, 2, 0, 3, 3]; // Add great weight to team modes when there are 6+ players
    else if (this.players.length > 3) weights = [3, 0, 2, 1, 1, 1, 2]; // Start to add some slight weight to team modes when there are 4+ players
    else if (this.players.length > 1) weights = [3, 0, 2, 0, 1, 0, 0]; // Basic rounds that can be done with 2-3 players minimum
    else weights = [1]; // Stick to deathmatch if player is alone to let other players join (skirmish would cause instant win)

    // Select a random gamemode, apply ruleset, and broadcast it
    const ruleset = MakeGamemode(Random.pickIndexFromWeights(weights, Math.random()));
    this.world.applyRuleset(ruleset);

    // During join phase, players should all be neutral and player list should be updated
    TeamManager.assignTeams(this.players, 1);

    // Changes should finally be done--push world back to Clockwork for use
    MessageBus.publish('RoundManager_NewWorld', this.world);
  }

  /**
   * @function startRound
   * @summary Transition from player join phase to actual battle
   */
  private startRound() {
    this.world.Bullets = [];

    TeamManager.assignTeams(this.players, this.world.ruleset.teams);
    this.forceRespawns();

    MessageBus.publish('RoundManager_BeginBattle', this.world);
    // MessageBus.publish('Title', '¡Luchen!'); // Displays title message for clients, imperative tense, "FIGHT" for multiple subjects
  }


  /**
   * @function checkWinCondition
   * @summary Checks if any win conditions are met while in the battle game phase. Will also force a rotation in game phase if win is met.
   * @param {Player} players List of players to read scores off of
   * @returns {boolean} Returns true if a win occurred, false if conditions not met
   */
  public checkWinCondition(players: Player[]): boolean {
    switch (this.world.phase) {
      case GamePhase.Battle:
      case GamePhase.Overtime:
        this.winStatus = this.world.ruleset.checkWinCondition(players);
        break;
      default: // Nullify win status if it is not met
        this.winStatus = null;
    }
    return (this.winStatus && this.winStatus.gameWon);
  }


  /**
   * @function updateGameStatus
   * @summary Updates the game phase based off of the timer or current win status--server only
   * Will also broadcast to subscribers to RoundBegan and RoundEnded
   */
  // eslint-disable-next-line consistent-return
  public updateGameStatus() {
    if (this.world.timer === 0 || (this.winStatus && this.winStatus.gameWon)) {
      let newPhase: GamePhase;

      // Figure out where to go next
      switch (this.world.phase) {
        case GamePhase.Join:
          newPhase = GamePhase.Battle; break;

        case GamePhase.Battle:
          if (this.winStatus && this.winStatus.overtime) { // Induce overtime if necessary
            this.world.timer = 0;
            newPhase = GamePhase.Overtime;
          } else {
            newPhase = GamePhase.RoundFinish; // Otherwise run into finish
          }
          break;

        case GamePhase.Overtime:
          newPhase = GamePhase.RoundFinish; break;

        case GamePhase.RoundFinish:
          return this.setupRound(); // Scoreboard has finished displaying, generate a new world with new ruleset

        default: // Default to freeplay
          newPhase = GamePhase.Freeplay;
      }

      // Apply new game phase
      this.world.phase = newPhase;
      switch (newPhase) {
        case GamePhase.Battle:
          this.world.timer = this.world.ruleset.time;
          if (this.world.ruleset.time === 0) this.world.timer = -1; // If ruleset time is zero, timer should be infinite
          return this.startRound(); // Reset

        case GamePhase.Overtime: // Timer counts up from zero during overtime
          this.world.timer = 0;
          break;

        case GamePhase.Freeplay: // If freeplay was selected, do infinite freeplay
          this.world.timer = -1;
          break;

        default: // Default timer for other phases is 10 seconds
          this.world.timer = 10;
      }
    }
  }
}

export { RoundManager as default };