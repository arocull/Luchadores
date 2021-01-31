import { MessageBus } from '../../common/messaging/bus';
import { ConnectResponseType } from '../../common/engine/Enums';

class UIUsernameSelect {
  private name: string;
  private submitted: boolean = false;

  private display: HTMLInputElement;
  private error: HTMLElement;

  private base: HTMLElement = document.getElementById('username_select');

  constructor() {
    this.display = <HTMLInputElement>document.getElementById('username_input');
    this.error = document.getElementById('username_error');

    const confirm = document.getElementById('username_confirm');
    confirm.addEventListener('click', () => {
      this.submitResponse();
    });

    // If the connection was a success, say picking the username was a success
    MessageBus.subscribe('PlayerConnectResponse', (code: ConnectResponseType) => {
      if (code === ConnectResponseType.Success) { // Continue on if connection was a success
        MessageBus.publish('PickUsernameSuccess', this.name);
      } else { // If it was no a success, an error occurred!
        this.submitted = false; // Allow changes again
        this.base.hidden = false;
        this.error.hidden = false;
        this.display.disabled = false;

        switch (code) {
          case ConnectResponseType.DuplicateUsername:
            this.error.textContent = 'This username is already in use!';
            break;
          default:
            this.error.textContent = `An error occurred while joining the game - Response Code ${code}`;
        }
      }
    });
  }

  private submitResponse() {
    this.base.hidden = true;

    this.name = this.display.value;
    this.name = this.name.trim();
    this.display.value = this.name;

    if (this.name.length > 2 && this.name.length <= 24 && !this.submitted) {
      this.submitted = true;
      this.display.disabled = true;
      MessageBus.publish('PickUsername', this.name);
    } else { // Otherwise, show error
      this.error.textContent = 'Usernames must be within 3 and 24 characters!';
      this.error.hidden = false;
      this.base.hidden = false;
    }
  }

  public open() {
    this.base.hidden = false;
    this.display.focus();
  }
  public close() {
    this.base.hidden = true;
  }

  public backspace() { // Backspace key default function is disabled, so we need to manually backspace the test
    if (!this.base.hidden) {
      this.name = this.display.value;
      this.name = this.name.substr(0, this.name.length - 1);
      this.display.value = this.name;
    }
  }
  public enter() { // Only submit response if UI is
    if (!this.base.hidden) this.submitResponse();
  }
}

export { UIUsernameSelect as default };