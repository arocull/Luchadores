import { MessageBus } from '../../common/messaging/bus';

class UIUsernameSelect {
  private name: string;
  private submitted: boolean = false;
  private verified: boolean = false; // Verified by server, final step of process

  private display: HTMLInputElement;
  private error: HTMLElement;
  private denied: HTMLElement;

  private base: HTMLElement = document.getElementById('username_select');

  constructor() {
    this.display = <HTMLInputElement>document.getElementById('username_input');
    this.error = document.getElementById('username_error');
    this.denied = document.getElementById('username_denied');

    const confirm = document.getElementById('username_confirm');
    confirm.addEventListener('click', () => {
      this.submitResponse();
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
  public approveUsername(approval: boolean) {
    this.verified = approval;

    if (!approval) {
      this.denied.hidden = false;
      this.display.disabled = false;
      this.submitted = false; // Allow changes again
      this.base.hidden = false;
    } else {
      MessageBus.publish('PickUsernameSuccess', this.name);
    }
  }
}

export { UIUsernameSelect as default };