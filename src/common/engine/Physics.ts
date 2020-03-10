// Inludes Vector.js and Fighters.js
import {Vector} from "./Vector";
import {Fighter} from "./Fighter";

// Tick the physics of a list of fighters by X seconds
function TickPhysics(DeltaTime: number, fighters: Fighter[]) {
    for (var i = 0; i < fighters.length; i++) {
        const obj = fighters[i];
        var deltaX = Vector.Add(Vector.Multiply(obj.Acceleration, Math.pow(DeltaTime,2)/2), Vector.Multiply(obj.Velocity,DeltaTime));

        if (deltaX.length() > obj.MaxMomentum / obj.Mass)
            deltaX = Vector.Multiply(Vector.UnitVector(deltaX), (obj.MaxMomentum / obj.Mass));
        
        obj.Position = Vector.Add(obj.Position, deltaX);
        obj.Velocity = Vector.Add(obj.Velocity, Vector.Multiply(obj.Acceleration, DeltaTime));
    }
}