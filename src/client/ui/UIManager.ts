// eslint-disable-next-line object-curly-newline
import { UIFrame, UITextBox, UIClassSelect, UIUsernameSelect, UISettingsMenu, UIHealthbar } from './index';
import Camera from '../Camera';
import Renderer from '../Render';
import { MessageBus } from '../../common/messaging/bus';
import { Fighter } from '../../common/engine/fighters';
import { FighterType, GamePhase } from '../../common/engine/Enums';
import AssetPreloader from '../AssetPreloader';

// UI Manager - Class used for UI management and settings
class UIManager {
  private backdrop: UIFrame;

  private classSelectOpen: boolean;
  private usernameSelectOpen: boolean;
  private settingsMenuOpen: boolean;
  private playerListOpen: boolean;

  private classSelect: UIClassSelect;
  private usernameSelect: UIUsernameSelect;

  private settingsMenu: UISettingsMenu;
  private settingsButton: UIFrame;

  private healthbar: UIHealthbar;
  private specialbar: UIHealthbar;
  private specialBarInUse: boolean;

  private killcam: UITextBox;
  private connectionText: UITextBox;

  /** Timer displayed on top of screen, depicts how much time is left in the current phase */
  private roundTimer: UITextBox;
  /** Text displaying phase of the round */
  private roundPhase: UITextBox;
  /** Title text displayed by world for broadcasted messages */
  private roundTitle: UITextBox;
  private roundTitleTimer: number;

  constructor() {
    this.backdrop = new UIFrame(0, 0, 1, 1, false);
    this.backdrop.alpha = 0.25;
    this.backdrop.renderStyle = '#000000';
    this.backdrop.onClick = (() => {
      this.usernameSelect.deselect(); // Deselect text box
    });

    this.classSelectOpen = false;
    this.usernameSelectOpen = true; // Defaults to open
    this.settingsMenuOpen = false;
    this.playerListOpen = false;

    this.classSelect = new UIClassSelect(2, 2, 3);
    this.usernameSelect = new UIUsernameSelect();

    this.settingsMenu = new UISettingsMenu();
    this.settingsButton = new UIFrame(0, 0, 0.03, 0.03, true);
    this.settingsButton.constrainAspect = true; // Force it to be a square
    this.settingsButton.constrainAspectCenterX = false; // Make sure it stays in top-left corner of screen
    this.settingsButton.constrainAspectCenterY = false;
    AssetPreloader.getImage('Interface/Gear.png').then((img) => {
      this.settingsButton.image = img;
    });
    this.settingsButton.alpha = 0;
    this.settingsButton.imageAlpha = 0.8;
    this.settingsButton.onHover = ((hovering) => {
      if (hovering) this.settingsButton.imageAlpha = 1; // Change image transparency to let you know you're hovering over it
      else this.settingsButton.imageAlpha = 0.8;
    });
    this.settingsButton.onClick = (() => { // Function overrides are part of why I love JavaScript
      this.settingsMenuOpen = true;
    });
    MessageBus.subscribe('UI_SettingsClose', () => {
      this.settingsMenuOpen = false;
    });

    this.healthbar = new UIHealthbar();
    this.specialbar = new UIHealthbar();
    this.specialbar.POSY -= UIHealthbar.HEIGHT * 1.25;
    this.specialbar.reset();
    this.specialBarInUse = false;

    this.killcam = new UITextBox(0, 0.9, 1, 0.1, false, '');
    this.killcam.alpha = 0;
    this.killcam.textFont = 'flamenco';
    this.killcam.textFontSize = 60;

    this.roundTimer = new UITextBox(0.45, 0, 0.1, 0.05, false, '0:00');
    this.roundTimer.alpha = 0.5;
    this.roundTimer.renderStyle = '#555555';
    this.roundTimer.borderRenderStyle = '#bbbbbb';
    this.roundTimer.color = this.roundTimer.renderStyle;
    this.roundTimer.borderColor = this.roundTimer.borderRenderStyle;
    this.roundTimer.textStyle = '#ffffff';
    this.roundTimer.textFontSize = 36;
    this.roundTimer.textAlpha = 1;

    this.roundPhase = new UITextBox(0, 0.05, 1, 0.025, false, 'Join Phase');
    this.roundPhase.alpha = 0;
    this.roundPhase.textStyle = '#ffffff';
    this.roundPhase.textFontSize = 24;
    this.roundPhase.textFont = 'flamenco';

    this.roundTitle = new UITextBox(0, 0.1, 1, 0.075, false, '');
    this.roundTitle.alpha = 0;
    this.roundTitle.textStyle = '#ffffff';
    this.roundTitle.textFontSize = 48;
    this.roundTitle.textFont = 'flamenco';
    MessageBus.subscribe('Title', (msg) => {
      this.roundTitle.text = msg;
      this.roundTitleTimer = 5;
    });

    this.connectionText = new UITextBox(0, 0.9, 1, 0.1, false, 'Stabilizing connection...');
    this.connectionText.alpha = 0.1;
    this.connectionText.renderStyle = '#000000';
    this.connectionText.textStyle = '#ffffff';
    this.connectionText.textInnerWidth = 0.9875;
    this.connectionText.textAlignment = 'left';
    this.connectionText.textBase = 'middle';
  }

  // Inputs a key into the UI
  public keyInput(key: string, shift: boolean = false) {
    if (this.usernameSelectOpen) {
      switch (key) {
        case 'Enter': this.usernameSelect.enter(); break;
        case 'Backspace': this.usernameSelect.backspace(); break;
        default:
          if (key.length === 1) {
            this.usernameSelect.shift(shift);
            this.usernameSelect.typeCharacter(key);
          }
      }
    } else if (this.classSelectOpen) {
      const num = parseInt(key, 10);
      switch (key) {
        case 'Enter': this.classSelect.confirmSelect(); break;
        default:
          if (!Number.isNaN(num) && Number.isFinite(num)) {
            this.classSelect.quickSelect(num);
          }
      }
    }
  }
  // Checks to see if mouse is hovering over the given UI frame, and clicks it if mouse is newly down
  public doFrameInteraction(Input: any, cam: Camera, frame: UIFrame) {
    const hovering = frame.checkMouse(Input.MouseX / cam.Width, Input.MouseY / cam.Height);
    frame.onHover(hovering);
    if (hovering && !Input.MouseDown && Input.MouseDownLastFrame) frame.onClick();
  }

  // Performs UI death effects like healthbar toppling
  public playerDied(killcamText: string = '') {
    this.killcam.text = killcamText;

    this.healthbar.healthPercentage = 0;
    this.healthbar.collapse();
    if (this.specialBarInUse) this.specialbar.collapse();
  }
  // Sets the connection text
  public setConnectionText(text: string = '') {
    this.connectionText.text = text;
  }
  /**
   * @function updateRoundInfo
   * @summary Updates roundTimer and roundPhase with given info
   * @param {number} timeLeft Time left in the current phase of the round
   * @param {GamePhase} phase Current phase of the game (i.e. join phase, battle, setup, etc)
   */
  public updateRoundInfo(timeLeft: number, phase: GamePhase, gamemode: string) {
    if (timeLeft === -1) {
      this.roundTimer.text = '∞';
    } else {
      const mins = Math.floor(timeLeft / 60);
      const secs = Math.floor(timeLeft % 60);
      if (secs < 10) this.roundTimer.text = `${mins}:0${secs}`;
      else this.roundTimer.text = `${mins}:${secs}`;
    }

    switch (phase) {
      case GamePhase.Freeplay:
        this.roundPhase.text = 'Freeplay'; break;
      case GamePhase.Join:
        this.roundPhase.text = 'Waiting for Players'; break;
      case GamePhase.Setup:
        this.roundPhase.text = 'Setup'; break;
      case GamePhase.Battle:
        this.roundPhase.text = gamemode; break;
      case GamePhase.Overtime:
        this.roundPhase.text = 'Overtime'; break;
      case GamePhase.RoundFinish:
        this.roundPhase.text = 'Scoreboard'; break;
      default: this.roundPhase.text = '';
    }
  }

  // Open and close functions for different menus (in case we want to add transitions later)
  public openUsernameSelect() {
    this.usernameSelectOpen = true;
  }
  public closeUsernameSelect() {
    this.usernameSelectOpen = false;
  }
  public openClassSelect() {
    this.classSelectOpen = true;
  }
  public closeClassSelect() {
    this.classSelectOpen = false;
  }
  public openSettingsMenu() {
    this.settingsMenuOpen = true;
  }
  public closeSettingsMenu() {
    this.settingsMenuOpen = false;
  }
  public togglePlayerList(toggle: boolean) {
    this.playerListOpen = toggle;
  }

  // Returns true if there is should be a GUI background present
  public inGUIMode(): boolean {
    return this.classSelectOpen || this.usernameSelectOpen || this.settingsMenuOpen;
  }
  // Other getters
  public isUsernameSelectOpen(): boolean { return this.usernameSelectOpen; }
  public isClassSelectOpen(): boolean { return this.classSelectOpen; }
  public isSettingsMenuOpen(): boolean { return this.settingsMenuOpen; }
  public isPlayerListOpen(): boolean { return this.playerListOpen; }

  public tick(
    DeltaTime: number,
    cam: Camera,
    character: Fighter,
    connectionStatus: boolean, // If there is any question in the connection status, input false to have the info box drawn
    spawning: boolean, // Is the character spawning? (prevent killcam and such from drawing until player is assigned by server)
    InputState: any, // State of player inputs--used for mouse tracking in UI interaction
  ) {
    if (this.inGUIMode()) Renderer.DrawUIFrame(cam, this.backdrop);


    // Healthbar Management //
    if (character) {
      this.healthbar.healthPercentage = character.HP / character.MaxHP;
      this.specialbar.healthPercentage = character.getSpecialNumber() / 50;

      if (character.getCharacter() === FighterType.Flamingo) {
        this.specialBarInUse = true;
        this.specialbar.barBack.renderStyle = '#732303';
        if (character.getSpecialBoolean()) this.specialbar.bar.renderStyle = '#929190';
        else this.specialbar.bar.renderStyle = '#e0a524';
      } else this.specialBarInUse = false;
    } else if (spawning) {
      this.healthbar.healthPercentage = 1; // If player is spawning, they should have full health
      this.specialBarInUse = false;
    }

    // Healthbars - Draw if character is present, spawning, or their healthbar is still collapsing
    // Do not want healthbar to show when dead (unless healthbar is toppling), but do want to show even while waiting on spawn
    if (character || this.healthbar.collapsing || this.specialbar.collapsing || spawning) {
      this.healthbar.tick(DeltaTime);
      Renderer.DrawUIFrame(cam, this.healthbar.base);
      Renderer.DrawUIFrame(cam, this.healthbar.barBack);
      Renderer.DrawUIFrame(cam, this.healthbar.bar);
      this.healthbar.checkReset();

      if (this.specialBarInUse) {
        this.specialbar.tick(DeltaTime);
        Renderer.DrawUIFrame(cam, this.specialbar.base);
        Renderer.DrawUIFrame(cam, this.specialbar.barBack);
        Renderer.DrawUIFrame(cam, this.specialbar.bar);
        this.specialbar.checkReset();
      }
    }

    // Interact with and Draw Menus //
    if (this.classSelectOpen) {
      if (connectionStatus) this.classSelect.addConfirmButton(); // Only allow luchadors to be selected if the connection is stable
      for (let i = 0; i < this.classSelect.frames.length; i++) {
        this.doFrameInteraction(InputState, cam, this.classSelect.frames[i]);
        Renderer.DrawUIFrame(cam, this.classSelect.frames[i]);
      }
    }

    if (this.usernameSelectOpen) {
      this.doFrameInteraction(InputState, cam, this.backdrop); // Enable clicking on backdrop to disable clicking
      for (let i = 0; i < this.usernameSelect.frames.length; i++) {
        this.doFrameInteraction(InputState, cam, this.usernameSelect.frames[i]);
      }

      // Adjust flashing cursor to be at the end of the line of text
      this.usernameSelect.setCursorPosition(Renderer.GetTextWidth(cam, this.usernameSelect.getTextBox()));
      this.usernameSelect.tick(DeltaTime); // Tick effects like selection color

      for (let i = 0; i < this.usernameSelect.frames.length; i++) {
        Renderer.DrawUIFrame(cam, this.usernameSelect.frames[i]);
      }
    }

    if (this.settingsMenuOpen) {
      for (let i = 0; i < this.settingsMenu.frames.length; i++) {
        this.doFrameInteraction(InputState, cam, this.settingsMenu.frames[i]);
      }
      this.settingsMenu.Tick(DeltaTime); // Tick effects like selection color
      for (let i = 0; i < this.settingsMenu.frames.length; i++) {
        Renderer.DrawUIFrame(cam, this.settingsMenu.frames[i]);
      }
    }

    // Options Gear Button and Game Info //
    if (!this.inGUIMode()) {
      this.doFrameInteraction(InputState, cam, this.settingsButton);
      Renderer.DrawUIFrame(cam, this.settingsButton);

      // If title message was broadcasting the allotted amount of time, remove it
      if (this.roundTitleTimer > 0) {
        this.roundTitleTimer -= DeltaTime;
        if (this.roundTitleTimer <= 0) {
          this.roundTitleTimer = 0;
          this.roundTitle.text = '';
        }
      }

      Renderer.DrawUIFrame(cam, this.roundTimer);
      Renderer.DrawUIFrame(cam, this.roundPhase);
      Renderer.DrawUIFrame(cam, this.roundTitle);
    }

    // Killcam - only draw if no character is present, character is not spawning, and select screens are not open
    // Basically only draw if player is confirmed dead and is not in frames between selecting Luchador and being spawned by server
    if (!character && !(this.classSelectOpen || this.usernameSelectOpen) && !spawning) {
      Renderer.DrawUIFrame(cam, this.killcam);
    }

    // Connection Status - Only draw if connection is unstable
    if (!connectionStatus) Renderer.DrawUIFrame(cam, this.connectionText);
  }
}

export { UIManager as default };