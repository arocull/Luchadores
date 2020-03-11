// Client only -- Renders stuff to the screen
import {Vector} from "./Vector";
import {Fighter} from "./Fighters";
import {Map} from "./Map";
// Needs particle module
// Needs camera module??

// Particles should be ticked separately from physics as they are unused by the server (server notifies clients to render them but does not need to update them)

export class CameraData {
    protected Focus: Fighter;
    protected FocusPosition: Vector;

    constructor (public Width: number, public Height: number, public Zoom: number) {
        this.Focus = null;
        this.FocusPosition = new Vector(0,0,0);
    }

    public SetFocus(newFocus: Fighter) {    // Should we lerp to new focus or simply snap to them?
        if (newFocus) this.Focus = newFocus;
    }
    public UpdateFocus() {      // Internal, lerps camera to focus
        if (this.Focus) this.FocusPosition = this.Focus.Position;
    }
    public ClearFocus(newFocus: Vector) {   // Choose position to focus on and clear focused fighter
        this.Focus = null;
        this.FocusPosition = newFocus;
    }

    public PositionOffset(pos: Vector): Vector {
        /*const x = this.FocusPosition.x - pos.x; //Do we need to do this to account for height offset?
        const y =*/ 
        return Vector.Multiply(Vector.Subtract(pos, this.FocusPosition), this.Zoom);
    }
}


export function DrawScreen(canvas: CanvasRenderingContext2D, camera: CameraData, map: Map, fighters: Fighter[]) {
    canvas.clearRect(0, 0, camera.Width, camera.Height);

    for (var i = 0; i < fighters.length; i++) {
        const a = fighters[i];
        const pos = camera.PositionOffset(a.Position);

        canvas.fillStyle = "#000000";
 
        const x = pos.x;
        const y = pos.y*.9 + pos.z;    // Actual depth + artificial height
        const rad = a.Radius*camera.Zoom;
        canvas.rect(x - rad, y, x + rad, y + a.Height*camera.Zoom);
    }
}