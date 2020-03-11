import * as _ from 'lodash';

import {Vector} from "../common/engine/Vector";
import {Fighter, Sheep} from "../common/engine/Fighters";
import {Map} from "../common/engine/Map";
import {TickPhysics} from "../common/engine/Physics";
import {CameraData, DrawScreen} from "../common/engine/Render";

console.log('Loaded the the client-side javascript.');

// Get rendering viewport--browser only
const viewport = <HTMLCanvasElement>document.getElementById("render");
var canvas = viewport.getContext("2d"); 

// Create objects for basic testing
var cam = new CameraData(100, 100, 1);
var map = new Map(100, 100, 0.05);
var player = new Sheep(1, new Vector(0,0,0));

document.addEventListener("keydown", function (event) {
    if (event.key == 'a')
        player.Acceleration.x = -1;
    else if (event.key == 'd')
        player.Acceleration.x = 1;
    else
        player.Acceleration.x = 0;
    
    if (event.key == 'w')
        player.Acceleration.y = 1;
    else if (event.key == 's')
        player.Acceleration.y = -1;
    else
        player.Acceleration.y = 0;
});

function DoFrame(DeltaTime: number) {
    DeltaTime/=1000;    // Convert milliseconds to seconds
    TickPhysics(DeltaTime, [player], map);

    DrawScreen(canvas, cam, map, [player]);
    //canvas.fillRect(100, 100, 200, 200);

    return window.requestAnimationFrame(DoFrame);
}
window.requestAnimationFrame(DoFrame);