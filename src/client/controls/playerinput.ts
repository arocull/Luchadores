import _ from 'lodash';

import Vector from '../../common/engine/Vector';
import { MessageBus } from '../../common/messaging/bus';

export interface PlayerInput {
  /** What keys are down right now? */
  Keys: Record<string, boolean>;
  /** Which mouse buttons are down? */
  MouseButtons: Record<number, boolean>;
  /** Where is the mouse pointing? */
  MouseCoordinates: Vector;
}

export interface KeyboardButtonInput {
  key: string;
  shiftKey: boolean;
}

export interface MouseButtonInput {
  button: number;
}

export interface MouseMoveInput {
  x: number;
  y: number;
}

export const Topics = {
  keydown: 'keydown',
  keyup: 'keyup',
  mousedown: 'mousedown',
  mouseup: 'mouseup',
  mousemove: 'mousemove',
};

// Singleton - state tracker for inputs
const Input: PlayerInput = {
  Keys: {},
  MouseButtons: {},
  MouseCoordinates: new Vector(0, 0, 0),
};

document.addEventListener('keydown', (event) => {
  if (event.key === 'Backspace') {
    // For example, don't accidentally go backwards
    // in browser history when typing in username.
    event.preventDefault();
  }

  Input.Keys[event.key] = true;

  const output: KeyboardButtonInput = {
    key: event.key,
    shiftKey: event.shiftKey,
  };
  MessageBus.publish(Topics.keydown, output);
});
document.addEventListener('keyup', (event) => {
  Input.Keys[event.key] = false;

  const output: KeyboardButtonInput = {
    key: event.key,
    shiftKey: event.shiftKey,
  };
  MessageBus.publish(Topics.keyup, output);
});
document.addEventListener('mousedown', (event) => {
  Input.MouseButtons[event.button] = true;

  const output: MouseButtonInput = {
    button: event.button,
  };
  MessageBus.publish(Topics.mousedown, output);
});
document.addEventListener('mouseup', (event) => {
  Input.MouseButtons[event.button] = false;

  const output: MouseButtonInput = {
    button: event.button,
  };
  MessageBus.publish(Topics.mouseup, output);
});
document.addEventListener('mousemove', (event) => {
  Input.MouseCoordinates.x = event.clientX;
  Input.MouseCoordinates.y = event.clientY;

  const output: MouseMoveInput = {
    x: event.clientX,
    y: event.clientY,
  };
  MessageBus.publish(Topics.mousemove, output);
});

export function sampleInputs(): PlayerInput {
  return {
    Keys: _.clone(Input.Keys),
    MouseButtons: _.clone(Input.MouseButtons),
    MouseCoordinates: Vector.Clone(Input.MouseCoordinates),
  };
}
