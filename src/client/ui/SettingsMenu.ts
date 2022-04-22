import RenderSettings from '../RenderSettings';
import { MessageBus } from '../../common/messaging/bus';
import { RenderQuality } from '../../common/engine/Enums';

class UISettingsMenu {
  private qualityLow: HTMLElement;
  private qualityMedium: HTMLElement;
  private qualityHigh: HTMLElement;
  private particleLow: HTMLElement;
  private particleMedium: HTMLElement;
  private particleHigh: HTMLElement;

  private fpsCounter: HTMLElement;
  private cameraShake: HTMLElement;
  private announcer: HTMLElement;

  private base: HTMLElement = document.getElementById('settings_menu');

  constructor() {
    const close: HTMLElement = document.getElementById('settings_close');
    close.addEventListener('click', () => {
      MessageBus.publish('UI_SettingsClose', null);
    });

    MessageBus.subscribe('UI_SettingsUpdate', () => { // Utilize message bus so we can use this. methods
      this.update();
    });

    // Render Quality Settings
    this.qualityLow = document.getElementById('graphics_1');
    this.qualityMedium = document.getElementById('graphics_2');
    this.qualityHigh = document.getElementById('graphics_3');

    this.qualityLow.addEventListener('click', () => {
      RenderSettings.Quality = RenderQuality.Low; // Set quality level
      MessageBus.publish('UI_SettingsUpdate', null); // Update HTML visuals
    });
    this.qualityMedium.addEventListener('click', () => {
      RenderSettings.Quality = RenderQuality.Medium;
      MessageBus.publish('UI_SettingsUpdate', null);
    });
    this.qualityHigh.addEventListener('click', () => {
      RenderSettings.Quality = RenderQuality.High;
      MessageBus.publish('UI_SettingsUpdate', null);
    });


    // Particle Amount Settings
    this.particleLow = document.getElementById('particles_1');
    this.particleMedium = document.getElementById('particles_2');
    this.particleHigh = document.getElementById('particles_3');

    this.particleLow.addEventListener('click', () => {
      RenderSettings.ParticleAmount = 1;
      MessageBus.publish('UI_SettingsUpdate', null);
    });
    this.particleMedium.addEventListener('click', () => {
      RenderSettings.ParticleAmount = 3;
      MessageBus.publish('UI_SettingsUpdate', null);
    });
    this.particleHigh.addEventListener('click', () => {
      RenderSettings.ParticleAmount = 5;
      MessageBus.publish('UI_SettingsUpdate', null);
    });


    // Booleans
    this.fpsCounter = document.getElementById('fps_counter');
    this.fpsCounter.addEventListener('click', () => {
      RenderSettings.FPScounter = !RenderSettings.FPScounter;
      MessageBus.publish('UI_SettingsUpdate', null);
    });

    this.cameraShake = document.getElementById('camera_shake');
    this.cameraShake.addEventListener('click', () => {
      RenderSettings.EnableCameraShake = !RenderSettings.EnableCameraShake;
      MessageBus.publish('UI_SettingsUpdate', null);
    });

    this.announcer = document.getElementById('announcer');
    this.announcer.addEventListener('click', () => {
      RenderSettings.EnableAnnouncer = !RenderSettings.EnableAnnouncer;
      MessageBus.publish('UI_SettingsUpdate', null);
    });

    this.update();
  }

  /* eslint-disable no-param-reassign */
  private SetSelection(button: HTMLElement, selected: boolean) {
    if (selected) {
      button.className = 'selected';
    } else {
      button.className = '';
    }
  }
  /* eslint-enable no-param-reassign */

  public update() {
    switch (RenderSettings.Quality) {
      case RenderQuality.Low:
        this.SetSelection(this.qualityLow, true);
        this.SetSelection(this.qualityMedium, false);
        this.SetSelection(this.qualityHigh, false);
        break;
      case RenderQuality.Medium:
        this.SetSelection(this.qualityLow, false);
        this.SetSelection(this.qualityMedium, true);
        this.SetSelection(this.qualityHigh, false);
        break;
      case RenderQuality.High:
      default:
        this.SetSelection(this.qualityLow, false);
        this.SetSelection(this.qualityMedium, false);
        this.SetSelection(this.qualityHigh, true);
        break;
    }

    switch (RenderSettings.ParticleAmount) {
      case 1:
        this.SetSelection(this.particleLow, true);
        this.SetSelection(this.particleMedium, false);
        this.SetSelection(this.particleHigh, false);
        break;
      case 2:
      case 3:
        this.SetSelection(this.particleLow, false);
        this.SetSelection(this.particleMedium, true);
        this.SetSelection(this.particleHigh, false);
        break;
      case 4:
      case 5:
      default:
        this.SetSelection(this.particleLow, false);
        this.SetSelection(this.particleMedium, false);
        this.SetSelection(this.particleHigh, true);
        break;
    }

    this.updateOnCondition(this.announcer, RenderSettings.EnableAnnouncer);
    this.updateOnCondition(this.cameraShake, RenderSettings.EnableCameraShake);
    this.updateOnCondition(this.fpsCounter, RenderSettings.FPScounter);
  }
  /**
   * @function updateOnCondition
   * @summary Updates a toggle button based off a boolean
   * @param updateButton Button to update selection visual
   * @param enable If true, this button is marked as "enabled," "disabled" otherwise
   */
  private updateOnCondition(updateButton: HTMLElement, enable: boolean) {
    if (enable) {
      // eslint-disable-next-line no-param-reassign
      updateButton.innerText = 'Enabled';
    } else {
      // eslint-disable-next-line no-param-reassign
      updateButton.innerText = 'Disabled';
    }

    this.SetSelection(updateButton, enable);
  }

  public open() {
    this.update(); // Update visuals before display
    this.base.hidden = false;
  }

  public close() {
    this.base.hidden = true;
  }
}

export { UISettingsMenu as default };