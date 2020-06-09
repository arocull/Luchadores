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

  public classSelectOpen: boolean;
  public usernameSelectOpen: boolean;
  public settingsMenuOpen: boolean;
  public playerListOpen: boolean;

  private classSelect: UIClassSelect;
  private usernameSelect: UIUsernameSelect;

  private settingsMenu: UISettingsMenu;
  private settingsButton: UIFrame;

  private healthbar: UIHealthbar;
  private specialbar: UIHealthbar;
  private specialBarInUse: boolean;

  private killcam: UITextBox;
  private connectionText: UITextBox;

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
    this.settingsButton.image = new Image();
    this.settingsButton.image.src = 'Interface/Gear.png'; // TODO: Should we pipe the image from the asset loader into here?
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

    this.connectionText = new UITextBox(0, 0.9, 1, 0.1, false, 'Stabilizing connection...');
    this.connectionText.alpha = 0.1;
    this.connectionText.renderStyle = '#000000';
    this.connectionText.textStyle = '#ffffff';
    this.connectionText.textInnerWidth = 0.9875;
    this.connectionText.textAlignment = 'left';
    this.connectionText.textBase = 'middle';
  }

  // Inputs a key into the UI
  public KeyInput(key: string, shift: boolean = false) {
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
    }
  }
  // Checks to see if mouse is hovering over the given UI frame, and clicks it if mouse is newly down
  public DoFrameInteraction(Input: any, cam: Camera, frame: UIFrame) {
    const hovering = frame.checkMouse(Input.MouseX / cam.Width, Input.MouseY / cam.Height);
    frame.onHover(hovering);
    if (hovering && !Input.MouseDown && Input.MouseDownLastFrame) frame.onClick();
  }

  // Performs UI death effects like healthbar toppling
  public PlayerDied(killcamText: string = '') {
    this.killcam.text = killcamText;

    this.healthbar.healthPercentage = 0;
    this.healthbar.collapse();
    if (this.specialBarInUse) this.specialbar.collapse();
  }
  // Sets the connection text
  public SetConnectionText(text: string = '') {
    this.connectionText.text = text;
  }

  // Open and close functions for different menus (in case we want to add transitions later)
  public openClassSelect() {
    this.classSelectOpen = true;
  }
  public closeClassSelecT() {
    this.classSelectOpen = false;
  }
  public openSettingsMenu() {
    this.settingsMenuOpen = true;
  }
  public closeSettingsMenu() {
    this.settingsMenuOpen = false;
  }

  // Returns true if there is should be a GUI background present
  public InGUIMode(): boolean {
    return this.classSelectOpen || this.usernameSelectOpen || this.settingsMenuOpen;
  }

  public Tick(
    DeltaTime: number,
    canvas: CanvasRenderingContext2D,
    cam: Camera,
    character: Fighter,
    connectionStatus: boolean, // If there is any question in the connection status, input false to have the info box drawn
    spawning: boolean, // Is the character spawning? (prevent killcam and such from drawing until player is assigned by server)
    InputState: any, // State of player inputs--used for mouse tracking in UI interaction
  ) {
    if (this.InGUIMode()) Renderer.DrawUIFrame(canvas, cam, this.backdrop);


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

    if (character || this.healthbar.collapsing || this.specialbar.collapsing || spawning) {
      this.healthbar.tick(DeltaTime);
      Renderer.DrawUIFrame(canvas, cam, this.healthbar.base);
      Renderer.DrawUIFrame(canvas, cam, this.healthbar.barBack);
      Renderer.DrawUIFrame(canvas, cam, this.healthbar.bar);
      this.healthbar.checkReset();

      if (this.specialBarInUse) {
        this.specialbar.tick(DeltaTime);
        Renderer.DrawUIFrame(canvas, cam, this.specialbar.base);
        Renderer.DrawUIFrame(canvas, cam, this.specialbar.barBack);
        Renderer.DrawUIFrame(canvas, cam, this.specialbar.bar);
        this.specialbar.checkReset();
      }
    }

    // Interact with and Draw Menus //
    if (this.classSelectOpen) {
      if (connectionStatus) this.classSelect.addConfirmButton();
      for (let i = 0; i < this.classSelect.frames.length; i++) {
        this.DoFrameInteraction(InputState, cam, this.classSelect.frames[i]);
        Renderer.DrawUIFrame(canvas, cam, this.classSelect.frames[i]);
      }
    }

    if (this.usernameSelectOpen) {
      this.DoFrameInteraction(InputState, cam, this.backdrop); // Enable clicking on backdrop to disable clicking
      for (let i = 0; i < this.usernameSelect.frames.length; i++) {
        this.DoFrameInteraction(InputState, cam, this.usernameSelect.frames[i]);
      }

      this.usernameSelect.setCursorPosition(Renderer.GetTextWidth(canvas, cam, this.usernameSelect.getTextBox()));
      this.usernameSelect.tick(DeltaTime);

      for (let i = 0; i < this.usernameSelect.frames.length; i++) {
        Renderer.DrawUIFrame(canvas, cam, this.usernameSelect.frames[i]);
      }
    }

    if (this.settingsMenuOpen) {
      for (let i = 0; i < this.settingsMenu.frames.length; i++) {
        this.DoFrameInteraction(InputState, cam, this.settingsMenu.frames[i]);
      }
      this.settingsMenu.Tick(DeltaTime);
      for (let i = 0; i < this.settingsMenu.frames.length; i++) {
        Renderer.DrawUIFrame(canvas, cam, this.settingsMenu.frames[i]);
      }
    }

    // Options Gear Button //
    if (!this.InGUIMode()) {
      this.DoFrameInteraction(InputState, cam, this.settingsButton);
      Renderer.DrawUIFrame(canvas, cam, this.settingsButton);
    }

    // Killcam - only draw if no character is present, character is not spawning, and select screens are not open
    if (!character && !(this.classSelectOpen || this.usernameSelectOpen) && !spawning) {
      Renderer.DrawUIFrame(canvas, cam, this.killcam);
    }

    // Connection Status
    if (!connectionStatus) Renderer.DrawUIFrame(canvas, cam, this.connectionText);
  }
}

export { UIManager as default };