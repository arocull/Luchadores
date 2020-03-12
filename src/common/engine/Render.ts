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
        return Vector.Subtract(this.FocusPosition, pos);
    }
    public PositionOffsetMap(pos: Vector): Vector {
        return Vector.Subtract(pos, this.FocusPosition);
    }
}


export function DrawScreen(canvas: CanvasRenderingContext2D, camera: CameraData, map: Map, fighters: Fighter[]) {
    canvas.clearRect(0, 0, camera.Width, camera.Height);
    //canvas.transform(camera.Zoom, 0, 0, camera.Zoom, 0, 0);

    const offsetX = camera.Width/2;
    const offsetY = camera.Height/2;
    const zoom = camera.Zoom;

    // Draw arena boundaries
    const corner0 = Vector.Multiply(camera.PositionOffsetMap(new Vector(0,0,0)), zoom);
    const corner1 = Vector.Multiply(camera.PositionOffsetMap(new Vector(map.Width,0,0)), zoom);
    const corner2 = Vector.Multiply(camera.PositionOffsetMap(new Vector(map.Width,map.Height,0)), zoom);
    const corner3 = Vector.Multiply(camera.PositionOffsetMap(new Vector(0,map.Height,0)), zoom);
    canvas.strokeStyle = "FF0000";
    canvas.lineWidth = zoom *1;
    canvas.moveTo(corner0.x, corner0.y);
    canvas.beginPath();
    canvas.lineTo(corner1.x, corner1.y);
    canvas.lineTo(corner2.x, corner2.y);
    canvas.lineTo(corner3.x, corner3.y);
    canvas.lineTo(corner0.x, corner0.y);
    canvas.closePath();
    canvas.stroke();

    // Draw in fighters
    for (var i = 0; i < fighters.length; i++) {
        const a = fighters[i];
        const pos = camera.PositionOffset(a.Position);

        canvas.fillStyle = "#000000";
        canvas.fillRect((-pos.x - a.Radius) * zoom + offsetX, (pos.y)*zoom + offsetY, 2*a.Radius*zoom, a.Height*zoom);
    }
}