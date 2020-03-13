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
var cam = new CameraData(viewport.width, viewport.height, 20);
var map = new Map(50, 50, 10);
var player = new Sheep(1, new Vector(25,25,0));

var enemy = new Sheep(2, new Vector(28,28,0));

document.addEventListener("keydown", function (event) {
    if (event.key == 'a')
        player.Acceleration.x = -20;
    else if (event.key == 'd')
        player.Acceleration.x = 20;
    else if (event.key == 'w')
        player.Acceleration.y = 20;
    else if (event.key == 's')
        player.Acceleration.y = -20;
    else if (event.key == ' ')
        player.Velocity.z = 10;
});
document.addEventListener("keyup", function (event) {
    if (event.key == 'a' || event.key == 'd')
        player.Acceleration.x = 0;
    else if (event.key == 'w' || event.key == 's')
        player.Acceleration.y = 0;
});


var LastFrame = 0;
function DoFrame(tick: number) {
    tick/=1000;    // Convert milliseconds to seconds
    const DeltaTime = tick - LastFrame;
    LastFrame = tick;

    TickPhysics(DeltaTime, [player, enemy], map);

    if (player)
        cam.SetFocus(player);

    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;
    cam.Width = viewport.width;
    cam.Height = viewport.height;

    cam.UpdateFocus();
    DrawScreen(canvas, cam, map, [player, enemy]);
    //canvas.fillRect(100, 100, 200, 200);

    return window.requestAnimationFrame(DoFrame);
}





function Setup() {
    window.requestAnimationFrame(DoFrame);
}
Setup();