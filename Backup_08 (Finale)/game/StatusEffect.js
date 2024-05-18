const MathV = require("./MathVector");
module.exports = {
    knockback: function (troop, x, z, force, y, strong) {
        this.buff = false;
        this.activate = () =>{
            if(strong) troop.release();
        }
        this.update = (dt) => {
            let kbr = troop.knockbackResistance * troop.getWeight() / 50
            troop.x += x * force * dt / kbr;
            troop.z += z * force * dt / kbr;
            if(y != undefined) {
                if(y > 0) {
                    troop.y += y * force * dt / kbr;
                    let fallSpeed = troop.getFallSpeed();
                    if(fallSpeed * -1 >= y * force) {
                        y = 0;
                        troop.setFallSpeed(fallSpeed + y * force);
                    }

                }
            }
            force -= dt * 3;
            return force <= 0;
        }
    }, slow: function (troop, time, ammount) {
        this.buff = false;
        this.update = (dt) => {
            troop.mult.speed *= ammount;
            time -= dt;
            return time <= 0;
        }//movingX: 0, movingZ: 0, jump: false, run: false, mouseX: 0, mouseY: 0
    }, confuse: function (troop, time, ammount, statusID) {
        this.buff = false;
        let movingX, movingZ, mouseX;
        let swapsAvailable = ["movingX", "movingZ", "mouseX", "mouseY"];
        let swapsChosen = [];
        for(var i = 0; i < 4; i ++) {
            let num = Math.floor(Math.random() * swapsAvailable.length);
            swapsChosen.push(swapsAvailable[num]);
            swapsAvailable.splice(num, 1);
        }
        this.update = (dt) => {
            troop.modifyInput(function(input) {
                if(!input[statusID]) {
                    input.movingX = Math.sign(input[swapsChosen[0]]);
                    input.movingZ = Math.sign(input[swapsChosen[1]]);
                    input.mouseX = Math.sign(input[swapsChosen[2]]) * 10;
                    input.mouseY = Math.sign(input[swapsChosen[3]]) * 10;
                    input[statusID] = true;
                }
            });
            time -= dt;
            return time <= 0;
        }
    }, reverse: function (troop, time, ammount, statusID) {
        this.buff = false;
        this.update = (dt) => {
            troop.modifyInput(function(input) {
                if(!input[statusID]) {
                    input.mouseX *= -1;
                    input.mouseY *= -1;
                    input.movingX *= -1;
                    input.movingZ *= -1;
                    input[statusID] = true;
                }
            });
            time -= dt;
            return time <= 0;
        }
    }, fear: function (troop, time, ammount) {
        this.buff = false;
        this.update = (dt) => {
            troop.modifyInput(function(input) {
                input.movingZ = -1;
                input.movingX = 0;
                input.run = true;
            });
            time -= dt;
            return time <= 0;
        }
    }, cool: function (troop, time, ammount) {
        this.buff = true;
        this.activate = () => {
            troop.coolGun();
        }
        this.update = (dt) => {
            troop.mult.heat *= ammount;
            time -= dt;
            return time <= 0;
        }
    }, speed: function (troop, time, ammount) {
        this.buff = true;
        this.update = (dt) => {
            troop.mult.speed *= ammount;
            time -= dt;
            return time <= 0;
        }
    }, expose: function (troop, time, ammount) {
        this.buff = false;
        this.update = (dt) => {
            troop.mult.defense *= ammount;
            time -= dt;
            return time <= 0;
        }
    }, defense: function (troop, time, ammount) {
        this.buff = true;
        this.update = (dt) => {
            troop.mult.defense *= ammount;
            time -= dt;
            return time <= 0;
        }
    }, healOverTime: function (troop, time, ammount) {
        this.buff = true;
        let totalTime = time;
        this.update = (dt) => {
            if(timeHasPassed(totalTime, time, 1, dt)) {
                troop.heal(25);
            }
            time -= dt;
            return time <= 0;
        }
    }, damageOverTime: function (troop, time, source, damageType, damage, crit, accuracy, precision, type, refrence) {
        this.buff = true;
        let totalTime = time;
        this.update = (dt) => {
            if(timeHasPassed(totalTime, time, 1, dt)) {
                troop.damage(damage, source, damageType, crit, accuracy, precision, type, refrence);
            }
            time -= dt;
            return time <= 0;
        }
    }, firingSpeed: function (troop, time, ammount) {
        this.buff = true;
        this.update = (dt) => {
            troop.mult.firing *= ammount;
            time -= dt;
            return time <= 0;
        }
    }, damaging: function (troop, time, ammount) {
        this.buff = true;
        this.update = (dt) => {
            troop.mult.damage *= ammount;
            time -= dt;
            return time <= 0;
        }
    }, weakness: function (troop, time, ammount) {
        this.buff = true;
        this.update = (dt) => {
            troop.mult.damage *= ammount;
            time -= dt;
            return time <= 0;
        }
    }, meleeSpeed: function (troop, time, ammount) {
        this.buff = true;
        this.update = (dt) => {
            troop.mult.meleeSpeed *= ammount;
            time -= dt;
            return time <= 0;
        }
    }, weightless: function (troop, time, ammount) {
        this.buff = true;
        this.update = (dt) => {
            troop.mult.weight *= ammount;
            time -= dt;
            return time <= 0;
        }
    }, hover: function (troop, time, ammount) {
        this.buff = true;
        this.update = (dt) => {
            troop.mult.fallSpeed *= ammount;
            time -= dt;
            return time <= 0;
        }
    }, jumping: function (troop, time, ammount) {
        this.buff = true;
        this.update = (dt) => {
            troop.mult.jump *= ammount;
            time -= dt;
            return time <= 0;
        }
    }, heavy: function (troop, time, ammount) {
        this.buff = false;
        this.update = (dt) => {
            troop.mult.weight *= ammount;
            time -= dt;
            return time <= 0;
        }
    }, prepared: function (troop, time, ammount) {
        this.buff = true;
        this.update = (dt) => {
            troop.mult.defense *= ammount;
            troop.mult.firing *= ammount;
            troop.mult.meleeSpeed *= ammount;
            troop.mult.cooling /= ammount
            troop.mult.jump /= ammount;
            troop.mult.speed *= ammount;
            troop.mult.damage *= ammount;
            time -= dt;
            console.log("dt", dt, time);
            return time <= 0;
        }
    }, stun: function (troop, time) {
        this.buff = false;
        let count = time;
        this.activate = () => {
            troop.cancelActions();
        }
        this.update = (dt) => {
            troop.cancelInput();
            count -= dt;
            return count <= 0;
        }
    }, frozen: function (troop, time) {
        this.buff = false;
        this.activate = () => {
            troop.cancelActions();
        }
        this.update = (dt) => {
            troop.cancelInput();
            troop.mult.fallSpeed = 0;
            time -= dt;
            return time <= 0;
        }
    },
};
function timeHasPassed(totalTime, timeRemaining, timeCheck, dt, countOriginal = false) {
    let additionalTime = totalTime % timeCheck;
    let count = timeRemaining + additionalTime;
    return Math.floor(count / timeCheck) != Math.floor(count / timeCheck - dt) && (countOriginal || timeRemaining != totalTime);
}