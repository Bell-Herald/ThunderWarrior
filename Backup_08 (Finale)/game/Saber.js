module.exports = Saber;
const MathV = require("./MathVector");
const Base = require("./WeaponBase");
function Saber(troop, initData, stam) {
    this.active = false;
    const stamina = stam;
    const saber = this;
    const base = new Base();
    this.blocking = false;
    this.striking = false;
    var parryCount = 0;
    const type = initData.type;
    const src = initData.src;
    const rarity = initData.rarity;
    const blockTime = {
        count: 100,
        min: initData.block.minTime,
    }
    const strikeDelay = {
        time: initData.strike.delay,
        count: 0,
    }
    const strikeID = Math.random(), blockStabID = Math.random(), blockProjID = Math.random(), blockThaumID = Math.random();
    this.changeToTime = initData.equipTime;
//customizable variables
const strikeDamage = initData.strike.damage, strikeAngle = initData.strike.angle, strikeRadius = initData.strike.radius, reflectionRange = initData.block.reflectionRange, reflectionSpread = initData.block.reflectionSpread, blockStabAngle = initData.block.stabAngle, blockProjectileAngle = initData.block.projectileAngle, critical = {chance: initData.criticalChance / 100, damage: initData.criticalChance / 100}, accuracy = {chance: initData.accuracy / 100, damage: initData.accuracyDamage / 100}, precision = initData.precision, knockbackHit = initData.strike.knockback, knockbackBlock = initData.block.knockback, blockStun = initData.block.stun,
        strikeCost = initData.strike.cost, blockSaberEnemyCost = initData.block.enemyStabDrain, blockThaumEnemyCost = initData.block.enemyThaumDrain,
        strikeCooldown = initData.strike.wait, animationTime = initData.strike.duration, switchToTime = initData.initTime,
        blockThaumAngle = initData.block.stabAngle, blockCooldownBase = initData.block.wait
        var blockCooldown, blockDrain, parryTime, blockThaum, blockProjectileCost, blockSaberOwnCost, blockThaumCost, strikePending = {active: false}, nextMods = {};


    base.initialize(initData, stamina);
    this.update = (dt, strikeInput, blockInput, troop, camera, CD) => {
        base.setDecreasedHeatAndFiringSpeed(dt, 0, dt * 1);
        updateStrike(dt, troop, camera, CD);
        let shooting = base.activate(dt, strikeInput || saber.blocking, saber.active);
        if(strikePending.active) {
            if(base.canChange(saber.active)) {
                strike(troop, strikePending.name, strikePending.src, undefined, strikePending.cooldown, 0, strikePending.damage, strikePending.radius, strikePending.knockbackMod, strikePending.criciticalChance, strikePending.criticalDamage, strikePending.accuracyChance, strikePending.accuracyDamage, strikePending.precision, strikePending.staminaDamage, strikePending.staminaEffects, strikePending.func);
            }
        } else if(!saber.blocking && shooting.canFire && strikeInput && canUse(strikeCost)) {
            strike(troop, type, src, rarity);
        }
        setCounters(troop, dt);
    }
    this.canContinueBlock = (input) => {
        return saber.active && (input || blockTime.count < blockTime.min) && canUse(blockDrain);
    }
    this.continueBlock = (dt) => {
        continueBlock(dt);
        saber.blocking = true;
    }
    this.endBlock = () => {
        troop.removeVisualization(blockStabID);
        if(blockThaum) troop.removeVisualization(blockThaumID);
        troop.removeVisualization(blockProjID);
    }
    this.canStrike = () => !strikePending.active && !saber.blocking && !saber.striking && base.canChange(saber.active);
    this.canActivateStrike = () => saber.canStrike() && canUse(strikeCost);
    this.canBlock = (cost, drain) => !strikePending.active && !saber.blocking && !saber.striking && base.canChange(saber.active) && canUse(cost + drain * blockTime.min);
    this.blockProjectile = (troop, camera, enemy, proj) => {
        if(checkBlockAngle(troop, proj.rot, blockProjectileAngle)) {
            if(parryCount > 0) {
                let angle = MathV.getDirection(troop, enemy);
                troop.depleteStamina(blockProjectileCost / 2);
                proj.set(troop, {
                    x: troop.x + troop.w / 2,
                    y: camera.pos.y,
                    z: troop.z + troop.d / 2,
                }, angle, reflectionRange * 1.75, 1.5, reflectionSpread / 10);
                parrySuccess();
            } else {
                troop.depleteStamina(blockProjectileCost);
                proj.set(troop, camera.pos, troop.rot, reflectionRange, 1, reflectionSpread);
            }
            return true;
        }
        return false;
    }
    this.checkBlockThaum = (enemy) => {
        if(blockThaum && checkBlockAngle(troop, enemy.rot, blockThaumAngle)) {
            if(parryCount > 0) {
                parrySuccess()
                troop.depleteStamina(blockThaumCost / 2);
                enemy.depleteStamina(blockThaumEnemyCost * 1.5);
                return "parry";
            } else {
                enemy.depleteStamina(blockThaumEnemyCost);
                return "block"
            }
        } else {
            return "hit";
        }
    }
    this.blockSaber = (troop, enemy) => {
        if(checkBlockAngle(troop, enemy.rot, blockStabAngle)) {
            let direction = MathV.rotateVector2(0, 1, 360 - troop.rot);
            if(parryCount > 0) {
                troop.depleteStamina(blockSaberOwnCost / 2);
                enemy.depleteStamina(blockSaberEnemyCost * 1.5);
                enemy.knockback(direction.x, direction.y, knockbackBlock * 1.5);
                enemy.stun(blockStun * 4);
                parrySuccess();
            } else {
                troop.depleteStamina(blockSaberOwnCost);
                enemy.knockback(direction.x, direction.y, knockbackBlock);
                enemy.stun(blockStun);
                enemy.depleteStamina(blockSaberEnemyCost);
            }
            return true;
        } 
        return false;
    }
    this.startSwitch = () => {
        saber.active = true;
        base.setFiringSpeed(switchToTime * troop.mult.meleeSpeed + saber.changeToTime, switchToTime * troop.mult.meleeSpeed + saber.changeToTime, switchToTime + saber.changeToTime);

    }
    this.canChange = () => {
        return base.canChange(saber.active) && !strikePending.active;
    }
    this.cancelActions = () => {
        saber.blocking = false;
        saber.striking = false;
        blockTime.count = 0;
        parryCount = 0;
        strikeDelay.count = 0;
        strikePending = {active: false};
    }
    this.addStrike = (count, damage, radius, knockback, cooldown, criticalChance, criticalDamage, accuracyChance, accuracyDamage, precision, staminaDamage, staminaEffects, name, src, func) =>{
        strikePending = {
            active: true,
            count: count,
            damage: damage,
            radius: radius,
            knockback, knockback,
            cooldown: cooldown,
            criticalChance: criticalChance,
            criticalDamage: criticalDamage,
            accuracyChance: accuracyChance,
            accuracyDamage: accuracyDamage,
            precision: precision,
            staminaDamage: staminaDamage,
            staminaEffects: staminaEffects,
            name: name,
            src: src,
            func: func,
        }
        console.log("strikePending", strikePending);
    }
    this.startBlock = (troop, drain, parryTotalTime, canBlockThaum, reflectionDrain, ownStabDrain, ownThaumDrain) => {
        blockCooldown = blockCooldownBase * troop.mult.meleeSpeed + animationTime;
        blockDrain = drain;
        parryTime = parryTotalTime;
        blockThaum = canBlockThaum;
        blockProjectileCost = reflectionDrain;
        blockSaberOwnCost = ownStabDrain;
        blockThaumCost = ownThaumDrain;
        base.setFiringSpeed(blockCooldown, blockCooldownBase, blockCooldownBase + animationTime);
        saber.blocking = true;
        parryCount = parryTime;
        blockTime.count = 0;
        troop.addVisualization(blockStabID, 2.5, blockStabAngle, troop.af, "neutral", true);
        if(blockThaum) troop.addVisualization(blockThaumID, 3, blockThaumAngle, troop.af, "neutral", true);
        troop.addVisualization(blockProjID, 3.5, blockProjectileAngle, troop.af, "neutral", true);
    }
    Object.defineProperty(this, 'data', {
        get() {
            let baseData = JSON.parse(JSON.stringify(base.data));
            if(parryTime == 0 || parryTime == undefined) {
                baseData.heat.overheat = {current: 0, max: 1};
                baseData.tracks.cooled = Math.max(0, blockTime.count);
            } else {
                baseData.heat.overheat = {current: parryCount, max: parryTime};
                baseData.tracks.cooled = Math.max(0, blockTime.count - parryTime);
            }
            baseData.tracks.overheated = 100;
            return {
                heat: baseData.heat,
                fs: baseData.fs,
                tracks: baseData.tracks,
                type: type,
                src: src,
                active: saber.active,
                saber: true,
            }
        }
    });
    function parrySuccess() {
        if(parryCount < parryTime / 3) {
            parryCount = parryTime / 3;
        }
    }
    function setCounters(troop, dt) {
        blockTime.count += dt;
        if(base.fsDif() >= animationTime) {
            saber.striking = false;
            troop.removeVisualization(strikeID);
        }
        if(saber.blocking == false) parryCount = 0;
    }
    function getStrikeBox(troop, camera) {
        let direction = MathV.rotateVector2(0, 1, 360 - troop.rot);
        return {
            x: camera.pos.x,
            y: troop.y + troop.h * 0.1,
            z: camera.pos.z,
            h: troop.y + troop.h * 0.9,
            collisionAf: troop.collisionAf,
            directionX: direction.x,
            directionZ: direction.y,
            rot: camera.rot.y,
            angle: strikeAngle,
            radius: strikeRadius,//5,
            collisionType: "arc",
        }
    }
    function updateStrike(dt, troop, camera, CD) {
        if(strikeDelay.count > 0) {
            strikeDelay.count -= dt;
            if(strikeDelay.count <= 0) {
                strikeDelay.count = 0;
                strikeEnemies(troop, camera, CD);
                troop.stabalizeVisualization(strikeID);
                updateStrikePending();
            }
        }

    }
    function updateStrikePending() {
        if(strikePending.active) {
            strikePending.count --;
            if(strikePending.count <= 0) {
                strikePending = {active: false};
                nextMods = {};
                troop.endAbility("strike");
            }
        }
    }
    function strikeEnemies(troop, camera, CD) {
        let strikeBox;
        let collisions;
        strikeBox = getStrikeBox(troop, camera);
        collisions = CD.check(strikeBox, "enemy");
        for(var i = 0; i < collisions.length; i ++) {
            if(collisions[i].type == "trooper" && !collisions[i].checkBlockSaber(troop)) {
                collisions[i].damage((nextMods.damage || 1) * strikeDamage * troop.mult.damage, troop, "melee", {chance: (nextMods.criticalChance || 1) * critical.chance, damage: (nextMods.criticalDamage || 1) * critical.damage}, {chance: (nextMods.accuracyChance || 1) * accuracy.chance, damage: (nextMods.accuracyDamage || 1) * accuracy.damage}, (nextMods.precision || 1) * precision, nextMods.name, nextMods.src, nextMods.rarity);
                if(collisions[i].alive) {
                    if(nextMods.staminaDamage > 0) collisions[i].damage(nextMods.staminaDamage * troop.mult.damage, troop, "stamina", nextMods.staminaEffects.crit, nextMods.staminaEffects.accuracy, nextMods.staminaEffects.precision, nextMods.name, nextMods.src, nextMods.rarity);
                    if(collisions[i].alive) {
                        collisions[i].knockback(strikeBox.directionX , strikeBox.directionZ, knockbackHit);
                        nextMods.func(collisions[i]);
                    }
                }
            }
        }
    }
    function strike(troop, strikeName, strikeSrc, strikeRarity, cooldownMod, costMod, damageMod, radiusMod, knockbackMod,criciticalChanceMod, criticalDamageMod, accuracyChanceMod, accuracyDamageMod, precisionMod, staminaDamage, staminaEffects, func = function(){}) {
        let cooldown = cooldownMod || strikeCooldown;
        strikeDelay.count = strikeDelay.time;
        base.setFiringSpeed(cooldown * troop.mult.meleeSpeed + animationTime, cooldown * troop.mult.meleeSpeed + animationTime, cooldown + animationTime);
        if(costMod != 0) base.increaseHeatAndFiringSpeed(costMod || strikeCost);
        saber.striking = true;
        troop.addVisualization(strikeID, strikeRadius, strikeAngle, troop.af, "offense", true);
        nextMods = {damage: damageMod, radius: radiusMod, knockback: knockbackMod, criciticalChance: criciticalChanceMod, criticalDamage: criticalDamageMod, accuracyChanc: accuracyChanceMod, accuracyDamage: accuracyDamageMod, precision: precisionMod, staminaDamage: staminaDamage, staminaEffects: staminaEffects, name: strikeName, src: strikeSrc, rarity: strikeRarity, func: func}
    }
    function continueBlock(dt, troop) {
        base.setFiringSpeed(blockCooldown, blockCooldownBase, blockCooldownBase + animationTime);
        base.increaseHeatAndFiringSpeed(blockDrain * dt);
        if(parryCount > 0) {
            parryCount -= dt;
            if(parryCount < 0) parryCount = 0;
        }
    }

    function canUse(cost) {
        return stamina.current - cost >= 0;
    }
    function checkBlockAngle(troop, angle2, maxAngleDifference) {
        if(!saber.active || !saber.blocking) return false;
        let angle1 = troop.rot;
        angle1 = MathV.normalizeAngle(angle1 - 180);
        angle2 = MathV.normalizeAngle(angle2);
        return Math.abs(angle1 - angle2) <= maxAngleDifference / 2 || 360 - Math.abs(angle1 - angle2) <= maxAngleDifference / 2;
    }
}