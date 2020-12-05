// eslint-disable-next-line object-curly-newline
import { UIFrame, UITextBox, UIClassSelect, UIUsernameSelect, UISettingsMenu, UIHealthbar } from './index';
import Camera from '../Camera';
import Renderer from '../Render';
import { MessageBus } from '../../common/messaging/bus';
import { Fighter } from '../../common/engine/fighters';
import { FighterType } from '../../common/engine/Enums';

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
  private settingsButton: HTMLImageElement;

  private healthbar: UIHealthbar;
  private specialbar: UIHealthbar;
  private specialBarInUse: boolean;

  private killcam: UITextBox;
  private connectionText: UITextBox;

  constructor() {
    this.backdrop = new UIFrame(0, 0, 1, 1, false);
    this.backdrop.alpha = 0.25;
    this.backdrop.renderStyle = '#000000';

    this.classSelectOpen = false;
    this.usernameSelectOpen = true; // Defaults to open
    this.settingsMenuOpen = false;
    this.playerListOpen = false;

    this.classSelect = new UIClassSelect(2, 2, 3);
    this.usernameSelect = new UIUsernameSelect();

    this.settingsMenu = new UISettingsMenu();

    this.settingsButton = <HTMLImageElement>document.getElementById('settings_gear');
    this.settingsButton.addEventListener('click', () => {
      this.openSettingsMenu();
    });
    MessageBus.subscribe('UI_SettingsClose', () => {
      this.closeSettingsMenu();
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

    this.connectionText = new UITextBox(0, 0.9, 1, 0.1, false, 'Stabilizing connection...');
    this.connectionText.alpha = 0.1;
    this.connectionText.renderStyle = '#000000';
    this.connectionText.textStyle = '#ffffff';
    this.connectionText.textInnerWidth = 0.9875;
    this.connectionText.textAlignment = 'left';
    this.connectionText.textBase = 'middle';

    this.openUsernameSelect();
  }

  // Inputs a key into the UI
  public keyInput(key: string) {
    if (this.usernameSelectOpen) {
      switch (key) {
        case 'Backspace': this.usernameSelect.backspace(); break;
        case 'Enter': this.usernameSelect.enter(); break;
        default:
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

  // Open and close functions for different menus (in case we want to add transitions later)
  public openUsernameSelect() {
    this.usernameSelectOpen = true;
    this.usernameSelect.open();
  }
  public closeUsernameSelect() {
    this.usernameSelectOpen = false;
    this.usernameSelect.close();
  }
  public openClassSelect() {
    this.classSelectOpen = true;
    this.classSelect.open();
  }
  public closeClassSelect() {
    this.classSelectOpen = false;
    this.classSelect.close();
  }
  public openSettingsMenu() {
    this.settingsMenuOpen = true;
    this.settingsMenu.open();
  }
  public closeSettingsMenu() {
    this.settingsMenu.close();
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
    }

    // Options Gear Button //
    this.settingsButton.parentElement.hidden = this.inGUIMode() || this.settingsMenuOpen;

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