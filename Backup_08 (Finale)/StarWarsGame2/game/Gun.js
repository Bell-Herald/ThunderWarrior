module.exports = Gun;
const MathV = require("./MathVector");
const Base = require("./WeaponBase");
function Gun (Projectile, projectiles, camera, troop, initData) {
    //customizable per gun
    this.active = true;
    const base = new Base();
    var projectileSpeed = initData.projectileSpeed;
    var spread = initData.spreadMax;
    var damage = initData.damage;
    var range = initData.range;
    var gunType = initData.type;
    var src = initData.src;
    var rarity = initData.rarity;
    var crit = {chance: initData.criticalChance / 100, damage: initData.criticalDamage / 100};
    var accuracy = {chance: initData.accuracy / 100, damage: initData.accuracyDamage / 100};
    var precision = initData.precision;
    var firingSpeed = initData.firingSpeed / 1000;
    var switchToTime = initData.initTime;
    var shootDelay = initData.delay;
    var shootAfterDelay = false;
    var finishedDelay = false;
    var special = {active: false};
    var projectileColor = initData.projectileColor;
    const gun = this;
    //status variable
    this.changeToTime = initData.equipTime;
    base.initialize(initData, false);
    base.setFiringSpeed(firingSpeed, 0);
    this.update = (dt, shootInput, coolingMult, heatMult, firingMult, damageMult) => {
        var shootingData = base.activate(dt, shootInput, gun.active);
        let decrease = dt;
        if(!gun.active) dt * 0.2;
        base.setDecreasedHeatAndFiringSpeed(dt, coolingMult * decrease, firingMult * decrease);
        if(gun.active && (shootingData.canFire || (shootingData.fireable && special.active)) && !shootAfterDelay && !finishedDelay) {
            //sets delay before first shot
            shootAfterDelay = true;
            base.setFiringSpeed(shootDelay, shootDelay,  {max: firingSpeed, count: 0});
        } else if(gun.active && shootingData.fireable && special.active && (shootAfterDelay || finishedDelay)) {
            let fs;
            //uses a special shot if one has been activated
            shoot(dt, damageMult, heatMult, special.cost, special.speed, special.damage, special.range, special.spread, special.critChance, special.critDamage, special.caccuracyChance, special.accuracyDamage, special.precision, special.staminaDamage, special.staminaOffense, special.type, special.src);
            base.justShot();
            special.shotCount --;
            fs = firingSpeed * special.firingSpeed;
            base.setFiringSpeed(fs, fs);
            console.log("shotCount", special.shotCount, fs, firingSpeed, special.firingSpeed);
            if(special.shotCount <= 0) {
                gun.clearSpecial();
                troop.endAbility("specialShot");
            }
        } else if(gun.active && !special.active && shootingData.fireable && (shootAfterDelay || (shootInput && finishedDelay))) {
            //takes first shot and continues firing after first shot
            shoot(dt, damageMult, heatMult, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, gunType, src, rarity);
        } else if(!gun.active || (!shootAfterDelay && !(shootInput || special.active))) {
            //refreshes gun when no longer shooting
            shootAfterDelay = false;
            finishedDelay = false;
        }
        return shootingData.active || shootAfterDelay || special.active;
    }
    this.forceOverheat = () => {
        this.cancelActions();
        base.forceOverheat();
    }
    this.cool = () => {
        base.cool();
    }
    this.specialShot = (shotCount, damage, critChance, critDamage, accuracyChance, accuracyDamage, precision, range, speed, spread, cost, firingSpeed, staminaDamage, staminaOffense, name, src) => {
        special = {
            active: true,
            shotCount: shotCount,
            damage:  damage,
            critChance:  critChance,
            critDamage:  critDamage,
            accuracyChance: accuracyChance,
            accuracyDamage: accuracyDamage,
            precision:  precision,
            range: range,
            speed: speed,
            spread: spread,
            cost: cost,
            firingSpeed: firingSpeed,
            staminaDamage: staminaDamage,
            staminaOffense: staminaOffense,
            src: src,
            name: name
        }
        console.log("special", special);
    }
    this.clearSpecial = () => {
        special = {active: false};
    }
    this.startSwitch = () => {
        gun.active = true;
        base.setFiringSpeed(switchToTime + gun.changeToTime, switchToTime + gun.changeToTime,  {max: firingSpeed, count: 0});
    }
    this.canShoot = () => {
        return base.notOverheated();
    }
    this.canChange = () => {
        return base.canChange(gun.active && !special.active);
    }
    this.cancelActions = () => {
        shootAfterDelay = false;
        finishedDelay = false;
        this.clearSpecial();
    }
    Object.defineProperty(this, 'data', {
        get() {
            let baseData = base.data;
            return {
                heat: baseData.heat,
                fs: baseData.fs,
                tracks: baseData.tracks,
                type: gunType,
                src: src,
                active: gun.active,
            }
        }
    });
    function shoot(dt, damageMult, heatMult, cost, projectileSpeedMod, damageMod, rangeMod, spreadMod, critChanceMod, critDamageMod, accuracyChanceMod, accuracyDamageMod, precisionMod, staminaDamage, staminaOffense, shotType, shotSrc, shotRarity) {
        shootAfterDelay = false;
        finishedDelay = true;
        projectiles.push( new Projectile(troop, camera.pos, camera.rot.y, projectileColor, (projectileSpeedMod || 1) * projectileSpeed, (damageMod || 1) * damage * damageMult, (rangeMod || 1) *  range, Math.min(0, (spreadMod || 1)  * spread), dt, {chance: (critChanceMod || 1) * crit.chance, damage: (critDamageMod || 1) * crit.damage}, {chance: (accuracyChanceMod || 1) * accuracy.chance, damage: (accuracyDamageMod || 1) * accuracy.damage}, (precisionMod || 1) * precision, staminaDamage, staminaOffense, shotType, shotSrc, shotRarity));
        troop.fired();
        base.increaseHeatAndFiringSpeed(cost, heatMult);
    }

}