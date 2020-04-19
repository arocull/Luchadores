import _ from 'lodash';

import Vector from '../../common/engine/Vector';

export interface PlayerInput {
  /** What keys are down right now? */
  Keys: Record<string, boolean>;
  /** Which mouse buttons are down? */
  MouseButtons: Record<number, boolean>;
  /** Where is the mouse pointing? */
  MouseDirection: Vector;
}

const Input: PlayerInput = {
  Keys: {},
  MouseButtons: {},
  MouseDirection: new Vector(0, 0, 0),
};

document.addEventListener('keydown', (event) => {
  Input.Keys[event.key] = true;
});
document.addEventListener('keyup', (event) => {
  Input.Keys[event.key] = false;
});
document.addEventListener('mousedown', (event) => {
  Input.MouseButtons[event.button] = true;
});
document.addEventListener('mouseup', (event) => {
  Input.MouseButtons[event.button] = false;
});
document.addEventListener('mousemove', (event) => {
  Input.MouseDirection.x = event.clientX;
  Input.MouseDirection.y = event.clientY;
});

export function sample(): PlayerInput {
  return {
    Keys: _.clone(Input.Keys),
    MouseButtons: _.clone(Input.MouseButtons),
    MouseDirection: Vector.Clone(Input.MouseDirection),
  };
}
