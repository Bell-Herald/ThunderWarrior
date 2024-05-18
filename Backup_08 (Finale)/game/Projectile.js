module.exports = Projectile;

const MathV = require("./MathVector");
var projectileCount = 0;

function Projectile(troop, pos, rot, projectileColor, movementSpeed, projectileDamage, projectileRange, spread, deltaTime, critical, accuracyData, precisionData, staminaDamageData, staminaAffectsData, gunName, refrence, rarity) {
//      customizable variables
    var damage = projectileDamage;
    this.w = 0.25;
    this.h = 0.25;
    this.d = 0.25;
    this.collisionType = "box";
    var visual;
    var maxRange;
    var moveSpeed = movementSpeed;
    this.rot = 0;
    const crit = {chance: critical.chance, damage: critical.damage};
    const accuracy = {chance: accuracyData.chance, damage: accuracyData.damage};
    const precision = precisionData, staminaDamage = staminaDamageData, staminaAffects = staminaAffectsData;
    const color = projectileColor;
//      functionality variables
    var speed;
    var source = troop;
    var travelled = 0;
    var id;
    var weight = 0;
    const proj = this;
    var size = 1;
    function getDistanceTravelledMult(damage) {
        let overDistance = travelled - minRange;
        let secondDistance = (maxRange - minRange);
        if(damage) secondDistance *= 2/3;
        let total = (overDistance > secondDistance ? 1 : (overDistance / secondDistance));
        if(damage) total *= 0.85;
        else total *= 0.95;
        total = Math.min(1, 1 - total);
        return total;
    }

    Object.defineProperty(this, 'data', {
        get() {
            return {
                x: visual.x,
                y: visual.y,
                z: visual.z,
                rotX: 90,
                rotY: Math.atan2(visual.x - visual.lastX, visual.z - visual.lastZ) * 180 / Math.PI,
                rotZ: 0,
                id: id,
                weight: weight,
                color: color,
                source: source.username,
                opacity: getDistanceTravelledMult(),
            }
        }
    });
    this.set = (troop, pos, rot, projectileRange, speedMultiplier, spread) => {
        let unspreadDirection = MathV.rotateVector2(0, 1, 360 - rot);
        let randSpread = Math.random() * spread - spread / 2;
        let trueRot = rot + randSpread
        let direction = MathV.rotateVector2(0, 1, 360 - (trueRot));
        minRange = projectileRange;
        maxRange = minRange * 3;
        speed = {x: direction.x * speedMultiplier, y: 0, z: direction.y * speedMultiplier};
        this.x = pos.x + unspreadDirection.x * 2;
        this.y = pos.y;
        this.z = pos.z + unspreadDirection.y * 2;
        this.collisionAf = troop.collisionAf;
        this.username = troop.username;
        proj.rot = trueRot;
        source = troop;
        travelled = 0;
        if(visual == undefined) {
            visual = {
                x: this.x,
                y: this.y,
                z: this.z
            }
        }
    }
    this.update = (dt, CD) => {
        proj.x += speed.x * dt * moveSpeed;
        proj.y += speed.y * dt * moveSpeed;
        proj.z += speed.z * dt * moveSpeed;
        visual.lastX = visual.x;
        visual.lastZ = visual.z;
        visual.x += speed.x * dt * moveSpeed;
        visual.y += speed.y * dt * moveSpeed;
        visual.z += speed.z * dt * moveSpeed;
        travelled += moveSpeed * dt;
        setVisual(dt);
        if(travelled > maxRange) {
            return true;
        } else {
            let objs = CD.check(proj, "obstacleEnemy");
            for(var i = 0; i < objs.length; i ++) {
                let blocked = false;
                if(objs[i].type == "trooper") {
                    blocked = objs[i].checkBlockProjectile(proj, source);
                    if(!blocked) {
                        let damageMult = getDistanceTravelledMult(true);
                        objs[i].damage(damage * damageMult, source, "ranged", crit, accuracy, precision, gunName, refrence, rarity);
                        if(objs[i].alive && staminaDamage > 0) objs[i].damage(staminaDamage * damageMult, source, "stamina", staminaAffects.crit, staminaAffects.accuracy, staminaAffects.precision)
                    }
                }
                return !blocked;
            }
        }
        if(weight < 1) {
            weight += dt / 2;
            if(weight > 1) weight = 1;
        }
        return false;
    }

    init(troop, pos, rot, projectileRange, spread, deltaTime);

    function init(troop, pos, rot, projectileRange, spread, deltaTime) {
        projectileCount ++;
        id = projectileCount;
        proj.set(troop, pos, rot, projectileRange, 1, spread, deltaTime);
    }
    function setVisual(dt) {
        setVisualType('x', moveSpeed / 25, proj.x, dt);
        setVisualType('y', moveSpeed / 25, proj.y, dt);
        setVisualType('z', moveSpeed / 25, proj.z, dt);
//movementSpeed / 10
    }
    function setVisualType(type, increase, trueVal, dt) {
        if(visual[type] != trueVal) {
            if(visual[type] < trueVal) {
                visual[type] += increase * dt;
                if(visual[type] > trueVal) {
                    visual[type] = trueVal;
                }
            } else {
                visual[type] -= increase * dt;
                if(visual[type] < trueVal) {
                    visual[type] = trueVal;
                }

            }
        }
    }
}