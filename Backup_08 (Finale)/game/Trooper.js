'use strict'
module.exports = Trooper;
const Projectile = require("./Projectile");
const Gun = require("./Gun");
const MathV = require("./MathVector");
const Saber = require("./Saber");
const StatusEffect = require("./StatusEffect");
const AbilityEffect = require("./AbilityEffect");

function Trooper(initData, position, obstacles, projectiles, collisionDetector) {
    // customizable per trooper
    const hp = getAbility("hp");
    const stamina = getAbility("stamina");
    const thaum = getAbility("thaum");
    thaum.current = thaum.max / 10;
    const moveSpeed = initData.physical.moveSpeed / 5; // about 1.5
    const weight = initData.physical.weight / 10; // about 5.5
    const jumpHeight = 5.5;
    this.collisionType = "box"; 
    this.af = initData.af;
    this.collisionAf = initData.af;
    this.connected = initData.connected == false ? false : true;
    // trooper universal variables
    const gravity = 1.25;
    const visualizations = [];
    const CD = collisionDetector;

    var baseAf = initData.af;
    // trooper animation
    var jumping = false;
    var falling = false;
    var running = false;
    var walking = false;
    var shooting = false;
    var striking = false;
    var blocking = false;
    var changeToGun = false;
    var changeToSaber = false;
    var changeCount = 0;

    var wasRunning = false;
    var landed = false;

    //functionality variables
    var camera = { pos: {x: 0, y: 0, z: 0}, rot: { x: 0, y: position.rot, z: 0 } }
    var visualCamera;
    var dt = 0;
    var wasOnGround = true;
    var actionSpeed = 1;
    var input;
    var speed = {x:0,y:0,z:0};
    var velocity = {};
    var accelerationTime = initData.physical.accelerationSeconds;
    var decelerationTime = initData.physical.decelerationSeconds;
    var releaseCount = 0;
    var affiliationChangeCount = 0;
    const troop = this;
    this.killer = "";
    this.killerWeapon = {};
    this.alive = true;
    this.kills = [];
    this.knockbackResistance = initData.physical.knockbackResistance;
    this.x =  position.x;
    this.y = position.y;//initData.y;
    this.z = position.z;//initData.z;
    this.username = initData.username;
    this.w = 1.3;
    this.h = 2.2;
    this.d = 1.3;
    this.rot = position.rot;
    this.type = "trooper";
    this.winner;
    this.UIUsername = this.username;
    this.mult = {
        speed: 1,
        weight: 1,
        defense: 1,
        firing: 1,
        cooling: 1,
        heat: 1,
        jump: 1,
        meleeSpeed: 1,
        damage: 1,
        fallSpeed: 1,
    }
    var jumpHeldBonus = 1;
    var jumpMult = 1;
    var velocityOveride = 0;
    var abilityWeight = 0;
    var moving;
    var onGround = true;
    var shootRotate = false;
    var shootRotation = 0;
    var newInput;
    const staminaOffense = getAbilityOffense("stamina");
    const thaumOffense = getAbilityOffense("thaum")
    const physicalDefense = getAbilityDefense("physical");
    const staminaDefense = getAbilityDefense("stamina");
    const thaumDefense = getAbilityDefense("thaum");
    const gun = new Gun(Projectile, projectiles, camera, troop, initData.equipment.rangedWeapon);
    const saber = new Saber(troop, initData.equipment.meleeWeapon, stamina);
    const jumpDelay = {
        time: initData.physical.jumpDelay,
        count: 0,
    }
    const status = [];
    const abilities = getAbilities(initData);
    this.update = () => {
        if(troop.alive == false) return;
        regenerateStat(hp);
        regenerateStat(stamina);
        regenerateStat(thaum);
        setCameraRot();
        updateSpeed();
        if(onGround) {
            onGroundMovement();
        } else {
            offGroundMovement();
        }
        rotate();
        updateWeapons();
        checkCollision();
        setCameraPos();
        updateVisualizations();
    }
    this.reset = () => {
        resetMultipliers();
    }
    this.prepare = (deltaTime) => {
        if(troop.alive == false) return;
        dt = deltaTime;
        setInput();
        updateStatus();
        updateAbilities();
    }

    this.input = (inputData) => {
        let oldInput;
        if(newInput != undefined) {
            oldInput = newInput;
        }
        newInput = inputData;
        if(oldInput != undefined) {
            for(var prop in oldInput) {
                if(oldInput[prop] === true) {
                    newInput[prop] = oldInput[prop];
                } else if(!isNaN(newInput[prop]) && Math.abs(newInput[prop]) < Math.abs(oldInput[prop]) ) {
                    newInput[prop] = oldInput[prop];
                }
            }
        }
    }
    this.release = () => {
        releaseCount = Math.max(releaseCount, 2);
    }
    this.changeAffiliation = (af) => {
        this.collisionAf = af;
        affiliationChangeCount = Math.max(affiliationChangeCount, 2);
    }
    this.isReleased = () => {
        return releaseCount > 0;
    }
    this.addStatus = (statusName, statusType, statusDuration, ...params) => {
        console.log("adding status", (new StatusEffect[statusName]).buff, StatusEffect[statusName], statusName, statusDuration, params[0], troop.username);
        if((new StatusEffect[statusName]).buff == false && statusName != "knockback") {
            if(params[0] === true) {
                params.splice(0, 1);
                console.log("made it", params[0], params[1]);
            } else {
                let tenacity;
                if(statusType == "stamina") tenacity = stamina.tenacity
                else tenacity = thaum.tenacity;
                console.log("over here", statusDuration, tenacity);
                statusDuration /= tenacity;
            }
        }
        let newStatusEffect = new StatusEffect[statusName](troop, statusDuration, params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7], params[8], params[9]);
        if(typeof newStatusEffect.activate === "function") newStatusEffect.activate();
        status.push(newStatusEffect);
    }
    this.knockback = (x, z, force, y = 0) => status.push( new StatusEffect.knockback(troop, x, z, force, y) );
    this.stun = (duration) => status.push( new StatusEffect.stun(troop, duration) );
    this.getWeight = () =>  weight * troop.mult.weight;
    this.getDistance = (enemy, xBonus = 0, zBonus = 0) => Math.sqrt(Math.pow(troop.x - enemy.x + xBonus, 2) + Math.pow(troop.z - enemy.z + zBonus, 2));

    this.getDistanceXZ = (enemy, xBonus = 0, zBonus = 0) => MathV.normalizeVector({x: troop.x - enemy.x + xBonus, z: troop.z - enemy.z + zBonus});

    this.offset = (enemy, distance) => {
        let dist = troop.getDistanceXZ(enemy);
        troop.x = enemy.x + dist.x * (distance) + troop.w / 2 * Math.sign(dist.x);
        troop.z = enemy.z + dist.z * (distance) + troop.d / 2 * Math.sign(dist.z);

    }
    this.addVisualization = (id, scale, angle, af, actionType, update = false) => {
        visualizations.push({
            id: id, scale: scale, angle: angle, af: af, actionType: actionType, update: update, rotX: 90, rotY: troop.rot/*camera.rot.y*/, rotZ: 0
        });
    }
    this.stabalizeVisualization = (id) => {
        for(var i = 0; i < visualizations.length; i ++) {
            if(visualizations[i].id == id) {
                visualizations[i].update = false;
                return;
            }
        }
    }
    this.removeVisualization = (id) => {
        for(var i = 0; i < visualizations.length; i ++) {
            if(visualizations[i].id == id) {
                visualizations.splice(i, 1);
                return;
            }
        }
    }
    this.getFallSpeed = () => {
        return velocity.y;
    }
    this.setFallSpeed = (fallSpeed) => {
        velocity.y = fallSpeed;
    }
    this.damage = (damage, damageSource, damageType, crit, accuracy, precision, sourceName, sourceSrc, sourceRarity) => {
        let totalDamage = damage = Math.max(0, damage), defenseData = getDefense(damageType);
        let defenseType = defenseData.defenseType, defense = defenseData.defense * troop.mult.defense;
        let evasionChance = Math.max(0, defenseType.evasion.chance / 100), critResistance = Math.max(0, defenseType.crit.resistance / 100), critDefense = Math.max(0, defenseType.crit.defense / 100), evasionDefense = Math.max(0, defenseType.evasion.defense / 100), hpPast, damageDealt;
        let wasCrit = false, wasEvad = false;
        
        crit.chance = Math.max(0, crit.chance);
        crit.damage = Math.max(0, crit.damage);
        accuracy.chance = Math.max(0, accuracy.chance);
        accuracy.damage = Math.max(0, accuracy.damage);
        precision = Math.max(0, precision);
        if(Math.random() < evasionChance - accuracy.chance) {
            wasEvad = true;
            let evasionDecrease = Math.max(1, 1 + evasionDefense - accuracy.damage);
            totalDamage /= evasionDecrease;
            precision /= evasionDecrease;
        } else if(Math.random() < crit.chance - critResistance) {
            wasCrit = true;
            let critIncrease = Math.max(1, 1 + crit.damage - critDefense);
            totalDamage *= critIncrease;
            precision *= critIncrease;
        }
        defense = Math.max(1, Math.max(0, defense) - precision);
        totalDamage /= defense;
        hpPast = hp.current; 
        depleteStat(hp, totalDamage);
        if(hp.current < 0) damageDealt = Math.max(0, totalDamage + hp.current);
        else damageDealt = totalDamage;
        if(damageDealt > 0) trooperDamaged(damageSource, damageDealt, damageType);
        checkKill(damageSource, sourceName, sourceSrc, sourceRarity);

        console.log("damage data","acc chance ", accuracy.chance, "critres", critResistance, "critDef", critDefense, "acc dam", accuracy.damage, "crit", crit, "evaschance", evasionChance, "evadDefense", evasionDefense);

        console.log(
            "DAMAGE DATA\n",
            "defenseMult", troop.mult.defense, "def", defense, "prec", precision, "damage", damage, "totalDamage", totalDamage, "dam type", damageType, "\n",
            "EVAS", crit.chance - critResistance, Math.max(1, 1 + evasionDefense - accuracy.damage), "chance", evasionChance, "defense", evasionDefense, "occured", wasEvad, "accuracy", accuracy.chance, "acc dam", accuracy.damage, "\n",
            "CRIT", evasionChance - accuracy.chance, Math.max(1, 1 + crit.damage - critDefense), "chance", crit.chance, "damage", crit.damage, "occured", wasCrit, "res", critResistance, "def", critDefense, "\n",
        );

        return damageDealt;
    }
    this.setWinner = (winningAf) => {
        troop.winner = winningAf;
        camera = {
            pos: {
                x: 0, y: 50, z: 0
            }, rot: {
                x: 90, y: 0, z: 0,
            }
        }
        troop.cancelActions();
        gun.active = false;
        saber.active = false;
    }
    this.fired = () => {
        /* removing this because it encourages players to avoid combat in order to heal
        if(hp.current < hp.max && hp.count < hp.time / 3) {
            hp.count = hp.time / 3;
        }*/
    }
    this.startJump = (multForJump = 1, overideForVelocity = 0) => {
        jumpMult = multForJump;
        jumpDelay.count = jumpDelay.time;
        velocityOveride = overideForVelocity;
    }
    this.getLanded = () => landed;
    this.canJump = () => onGround && jumpDelay.count <= 0;
    this.checkBlockProjectile = (proj, enemy) => saber.blockProjectile(troop, camera, enemy, proj);
    this.checkBlockSaber = (enemy) => saber.blockSaber(troop, enemy);
    this.checkBlockThaum = (enemy) => saber.checkBlockThaum(enemy);
    this.depleteStamina = (staminaCost) => {
        depleteStat(stamina, staminaCost);
        if(stamina.current < 0) {
            stamina.current = 0;
        }
    }
    this.heal = (ammount) => {
        depleteStat(hp, -ammount)
    }
    this.setVisualCamera = (newCamera) => {
        visualCamera = newCamera;
    }
    this.getCamera = (newCamera) => {
        return camera;
    }
    this.cancelActions = () => {
        saber.cancelActions();
        gun.cancelActions();
        cancelAnimations();
        cancelAbilities();
    }
    this.atMaxHealth = () => hp.current >= hp.max;
    this.startBlock = (...params) => saber.startBlock.apply(null, [troop].concat(params));
    this.canBlock = (cost, drain) => saber.canBlock(cost, drain);
    this.endBlock = () => saber.endBlock();
    this.canContinueBlock = (input) => saber.canContinueBlock(input);
    this.continueBlock = () => saber.continueBlock(dt);
    this.canShoot = () => gun.canShoot();
    this.canRun = (cost) => stamina.current - (cost * troop.getWeight() / 50) >= 0 && onGround && (speed.x != 0 || speed.z != 0);
    this.canKeepJumping = (cost) => stamina.current - cost * dt * troop.getWeight() / 50 >= 0 && velocity.y > 0;
    this.cancelInput = () => {
        moving = {x: 0, z: 0};
        input = {shoot: false, blocking: false, movingX: 0, movingZ: 0, jump: false, run: false, mouseX: 0, mouseY: 0, change: false, cleared: true};
    }
    this.keepJumping = (cost) => {
        depleteStat(stamina, cost * dt * troop.getWeight() / 50);
        jumpHeldBonus = 0.5;
    }
    this.clearGunInput = () => {
        input.change = false;
    }
    this.modifyInput = (func) => {
        func(input);
    }
    this.inputModified = () => {
        input.modified = true;
    }

    this.overheatGun = () => {
        gun.forceOverheat();
    }
    this.coolGun = () => {
        gun.cool();
    }
    this.canStrike = () => saber.canStrike();
    this.addStrike = (...params) => {
        saber.addStrike.apply(null, params);
    }
    this.endAbility = (type) => {
        for(var i = 0; i < abilities.length; i ++) {
            if(abilities[i].effect.type == type && abilities[i].state == "active") {
                startCoolDownAbility(i);
            }
        }
    }
    this.specialShot = (...params) => {
        gun.specialShot.apply(null, params);
    }
    this.overheat = () => {
        gun.forceOverheat();
    }
    this.canChangeSaber = saber.canChange;
    this.canChangeGun = gun.canChange;
    this.changeToSaber = () => {
        gun.startSwitch();
        saber.active = false;
        changeToGun = true;
        changeCount = saber.changeToTime;
    }
    this.changeToGun = () => {
        saber.startSwitch();
        gun.active = false;
        changeToSaber = true;
        changeCount = gun.changeToTime;
    }
    this.run = (speed, cost) => {
        actionSpeed = speed;
        running = true;
        walking = false;
        depleteStat(stamina, cost * troop.getWeight() / 50);
    }
    this.dealtDamage = (damageDealt) => {
        depleteStat(stamina, - stamina.onDamage * damageDealt);
        depleteStat(thaum, - thaum.onDamage * damageDealt);
        depleteStat(hp, - hp.onDamage * damageDealt);
    }
    this.killedOpponent = () => {
        depleteStat(stamina, - stamina.onKill);
        depleteStat(thaum, - thaum.onKill);
        depleteStat(hp, - hp.onKill);
    }
    this.getDrain = (damageType) => {
        let drain = {stamina: stamina.drain, thaum: thaum.drain, hp: hp.drain};
        if(damageType == "physical" || damageType == "melee" || damageType == "ranged") {
            drain.stamina *= 2;
            drain.thaum *= 2;
            drain.hp *= 2;
        }
        return drain;
    }
    Object.defineProperty(this, 'data', {
        get() {
            return {
                unity: getUnityData(),
                hp: hp,
                stamina: stamina,
                thaum: thaum,
                gun: gun.data,
                saber: saber.data,
                af: troop.af,
                abilities: getAbilityData(),
                visualizations: visualizations,
                UIName: troop.UIUsername,
            }
        }
    });
    /*
    code is run outside of variables to finish preparing the trooper
    must be called after all of the this declarations
    */
    prepareTrooper();
    function trooperDamaged(damageSource, damageDealt, damageType) {
        let drain = damageSource.getDrain(damageType);
        depleteStat(stamina, drain.stamina * damageDealt, true);
        depleteStat(thaum, drain.thaum * damageDealt, true);
        depleteStat(hp, drain.hp * damageDealt, true);
        damageSource.dealtDamage(damageDealt);
    }

    function checkKill(damageSource, sourceName, sourceSrc, sourceRarity) {
        if(hp.current <= 0) {
            troop.alive = false;
            troop.killer = damageSource.username;
            troop.killerWeapon = {name: sourceName, src: sourceSrc, rarity: sourceRarity};
            for(var i = 0; i < troop.kills.length; i ++) {
                troop.kills[i].killer = damageSource.username;
                damageSource.kills.push(troop.kills[i]);
            }
            damageSource.kills.push(troop);
            damageSource.killedOpponent();
        }
    }

    function setInput() {
        if(input.modified) {
            input.modified = false;
        } else {
            if(newInput != undefined) {
                input = newInput;
            }
            newInput = undefined;
        }
        visualCamera = undefined;
        troop.UIUsername = troop.username;
        saber.blocking = false;
        running = false;
        actionSpeed = 1;
        jumpHeldBonus = 1;
    }
    function updateVisualizations() {
        for(var i = 0; i< visualizations.length; i ++) {
            visualizations[i].x = troop.x + troop.w / 2;//camera.pos.x;
            visualizations[i].y = troop.y + 0.0001;
            visualizations[i].z = troop.z + troop.d / 2;//camera.pos.z;
            if(visualizations[i].update) visualizations[i].rotY = camera.rot.y;
        }
    }
    function resetMultipliers() {
        for(var multType in troop.mult) {
            troop.mult[multType] = 1;
        }
        if(releaseCount > 0) releaseCount --;
        if(affiliationChangeCount > 0) {
            affiliationChangeCount --;
            if(affiliationChangeCount <= 0) {
                troop.collisionAf = baseAf
            }
        }
        
    }
    function getBasicAbilityData() {
        let basicAbilities =  [
            {
                key: "A / J",
                src: "leftMoveBasic",
            },
            {
                key: "D / L",
                src: "rightMoveBasic",
            },
            {
                key: "W / I",
                src: "fowardsMoveBasic",
            },
            {
                key: "S / K",
                src: "backMoveBasic",
            },
            {
                key: "< / «",
                src: "leftRotateBasic",
            },
            {
                key: "> / »",
                src: "rightRotateBasic",
            },
            {
                key: "⎵ / 🖯",
                src: "attackBasic",
                activatable: canAttack(),
            }
        ]
        for(var i = 0; i < basicAbilities.length; i ++) {
            basicAbilities[i].state = "basic";
        }
        return basicAbilities;
    }
    function canAttack() {
        return (troop.canShoot() && gun.active) || saber.canActivateStrike();
    }
    function getRegularAbilityData() {
        let abilityData = [];
        for(var i = 0; i < abilities.length; i ++) {
            abilityData.push({
                key: abilities[i].key,
                src: abilities[i].refrence,
                state: abilities[i].state,
                activatable: canActivateAbility(i, getAbilityCost(i)),
                cooldown: abilities[i].cooldown,
                duration: abilities[i].effect.specialEnd ? "" :  abilities[i].duration,
                count: abilities[i].count,
                activationTime: abilities[i].activationTime,
            });
        }
        return abilityData;
    }
    function getAbilityData() {
        return getBasicAbilityData().concat(getRegularAbilityData());

    }
    function getAbilities(initData) {
        let stamAbilities = getAbilitiesFromType(initData.stamina.game, initData.stamina.gameKeys, "stam");
        let thaumAbilities = getAbilitiesFromType(initData.thaum.game, initData.thaum.gameKeys, "thaum");
        return stamAbilities.concat(thaumAbilities);
    }
    function getAbilitiesFromType(newAbilities, keys, type) {
        let finishedNewAbilities = [];
        for(var i = 0; i < newAbilities.length; i ++) {
            if(newAbilities[i] == undefined || newAbilities[i].refrence == undefined || AbilityEffect[newAbilities[i].refrence] == undefined) continue;
            newAbilities[i].key = keys[i];
            newAbilities[i].count = 0;
            delete newAbilities[i].unlockCost;
            delete newAbilities[i].creditCost;
            delete newAbilities[i].prerequisites;
            newAbilities[i].state = "inactive";
            newAbilities[i].type = type;
            if(newAbilities[i].class == "Mobility") newAbilities[i].staminaCost /= (initData.physical.weight / 50);
            newAbilities[i].effect = new AbilityEffect[newAbilities[i].refrence](troop, newAbilities[i], CD, staminaOffense, thaumOffense);
            finishedNewAbilities.push(newAbilities[i]);
        }
        return finishedNewAbilities;
    }
    function getDefense(damageType) {
        let defenseType, defense;
        if(damageType == "physical") {
            defenseType = physicalDefense;
            defense = physicalDefense.defense;
        } else if(damageType == "melee") {
            defenseType = physicalDefense;
            defense = physicalDefense.meleeDefense;
        } else if(damageType == "ranged") {
            defenseType = physicalDefense;
            defense = physicalDefense.rangedDefense;
        } else if(damageType == "stamina") {
            defenseType = staminaDefense;
            defense = staminaDefense.defense;
        } else if(damageType == "thaum") {
            defenseType = thaumDefense;
            defense = thaumDefense.defense;
        }
        return {defenseType: defenseType, defense: defense};

    }
    function getAbilityOffense(ability) {
        return {
            crit: {chance: initData[ability].criticalChance / 100, damage: initData[ability].criticalChance / 100},
            accuracy: {chance: initData[ability].accuracy / 100, damage: initData[ability].accuracyDamage / 100},
            precision: initData[ability].precision,
        }
    }
    function getAbilityDefense(ability) {
        return {
            crit: {
                resistance: initData[ability].criticalResistance, defense: initData[ability].criticalDefense,
            }, 
            evasion: {
                chance: initData[ability].evasionChance, defense: initData[ability].evasionDefense,
            },
            defense: initData[ability].totalDefense,
        }
    }
    function updateWeapons() {
        if(changeCount > 0) {
            changeCount -= dt;
            if(changeCount <= 0) {
                changeCount = 0;
                troop.endAbility("changeWeapon");
            }
        } else {
            changeToSaber = false;
            changeToGun = false;
        }
        if(troop.winner == undefined) {
            shooting = gun.update(dt, input.shoot, troop.mult.cooling, troop.mult.heat, troop.mult.firing, troop.mult.damage);
            saber.update(dt, input.shoot, input.block, troop, camera, CD);
            if(gun.active) {
                striking = false;
                blocking = false;
            } else if(saber.active) {
                shooting = false;
                striking = saber.striking;
                blocking = saber.blocking;
            }
        }
    }
    function updateAbilities() {
        let active = false;
        for(var i = 0; i < abilities.length; i ++) {
            activateAbility(i);
            active = updateAbility(i) || active;
        }
        raiseLeftHand(active);
    }
    function raiseLeftHand(active) {
        let leftHandRaiseTime = 1.25;
        if(active) {
            if(abilityWeight < 1) {
                abilityWeight += leftHandRaiseTime * dt;
                if(abilityWeight > 1) abilityWeight = 1;
            }
        } else {
            if(abilityWeight > 0) {
                abilityWeight -= leftHandRaiseTime * dt;
                if(abilityWeight < 0) abilityWeight = 0;
            }
        }
    }
    function getAbilityCost(i) {
        let staminaCost = abilities[i].staminaCost;
        let thaumCost = abilities[i].thaumaturgyCost;
        if(abilities[i].class == "Mobility") {
            staminaCost *= troop.getWeight() / 50;
            if(wasRunning && abilities[i].subclass == "Jump") {
                staminaCost *= 1.5;
            }
        }
        return {stamina: staminaCost, thaum: thaumCost};
    }
    function activateAbility(i) {
        let cost = getAbilityCost(i);
        if(input["ability" + abilities[i].key] && canActivateAbility(i, cost)) {
            depleteStat(stamina, cost.stamina || 0);
            depleteStat(thaum, cost.thaum || 0);
            if(abilities[i].ultimate) cooldownUltimates();
            if(abilities[i].activationTime > 0) {
                abilities[i].state = "activating";
                abilities[i].count = abilities[i].activationTime;
            } else {
                finishAbilityActivation(i)
            }
            if(abilities[i].effect.id != undefined) troop.addVisualization(abilities[i].effect.id, abilities[i].range, abilities[i].angle, troop.af, abilities[i].effect.actionType, true);
        }
    }
    function canActivateAbility(i, cost) {
        return  abilities[i].count <= 0 && abilities[i].state == "inactive" &&
                stamina.current >= cost.stamina && thaum.current >= cost.thaum &&
                checkSoloAbility(i) && checkSubclassAbility(i) && checkTypeAbility(i) &&
                (typeof abilities[i].effect.prerequisite !== "function" || abilities[i].effect.prerequisite())
    }
    function checkSoloAbility(i) {
        if(abilities[i].solo == false) return true;
        for(var e = 0; e < abilities.length; e ++) {
            if((abilities[e].state == "active" || abilities[e].state == "activating") && abilities[e].solo) return false;
        }
        return true;
    }
    function checkSubclassAbility(i) {
        if(abilities[i].subclass != "Saber"  && abilities[i].subclass != "Run" && abilities[i].subclass != "Boost" && abilities[i].subclass !=  "Shot") return true;
        for(var e = 0; e < abilities.length; e ++) {
            if((abilities[e].state == "active" || abilities[e].state == "activating") && (abilities[e].subclass == abilities[i].subclass || (abilities[i].subclass == "Run" && abilities[e].subclass == "Boost")|| (abilities[i].subclass == "Boost" && abilities[e].subclass == "Run"))) return false;
        }
        return true;
    }
    function checkTypeAbility(i) {
        for(var e = 0; e < abilities.length; e ++) {
            if(abilities[e].state == "activating" && abilities[e].type == abilities[i].type) return false;
        } 
        return true;
    }
    function updateAbility(i) {
        if(abilities[i].state == "activating") {
            abilities[i].count -= dt;
            if(abilities[i].count <= 0) {
                if(abilities[i].duration > 0 || abilities[i].effect.specialEnd) {
                    finishAbilityActivation(i);
                } else {
                    endAbilityActivation(i);
                    startCoolDownAbility(i);
                }
            }
        } else if(abilities[i].state == "active") {
            if(!abilities[i].effect.specialEnd) abilities[i].count -= dt;
            if(typeof abilities[i].effect.update === "function") abilities[i].effect.update(dt, input["ability" + abilities[i].key]);
            if((!abilities[i].effect.specialEnd && abilities[i].count <= 0) || (abilities[i].effect.specialEnd && abilities[i].effect.end)) {
                startCoolDownAbility(i);
                if(abilities[i].effect.rotationLock) troop.stabalizeVisualization(abilities[i].effect.id);
            }
        } else if(abilities[i].state == "cooldown") {
            troop.removeVisualization(abilities[i].effect.id);
            abilities[i].count -= dt;
            if(abilities[i].count <= 0) {
                abilities[i].count = 0;
                abilities[i].state = "inactive";
            }
        } 
        return abilityRaisesHand(i);
    }
    function abilityRaisesHand(i) {
        return (abilities[i].state == "activating" || abilities[i].state == "active") && abilities[i].type == "thaum";
    }
    function startCoolDownAbility(i, unexpected = false) {
        if(!unexpected && typeof abilities[i].effect.end === "function") abilities[i].effect.end(dt);
        abilities[i].state = "cooldown";
        abilities[i].count = abilities[i].cooldown;
    }
    function finishAbilityActivation(i) {
        abilities[i].state = "active";
        if(abilities[i].effect.specialEnd) abilities[i].count = 0;
        else abilities[i].count = abilities[i].duration;
        endAbilityActivation(i)
    }
    function cooldownUltimates() {
        for(var i = 0; i < abilities.length; i ++) {
            if(abilities[i].ultimate && (abilities[i].state == "cooldown" || abilities[i].state == "inactive")) startCoolDownAbility(i, true);
        }
    }
    function endAbilityActivation(i) {
        if(typeof abilities[i].effect.activate === "function") abilities[i].effect.activate();
        else if(typeof abilities[i].effect.update === "function") abilities[i].effect.update(dt);
        if(!abilities[i].effect.rotationLock) troop.stabalizeVisualization(abilities[i].effect.id);
    }
    function updateStatus() {
        for(var i = status.length - 1; i >= 0; i --) {
            let remove = status[i].update(dt);
            if(remove) {
                status.splice(i, 1);
            }
        }
    }
    function getStat(data, trait1, trait2) {
        if(trait2 != undefined) return data.helmet[trait1][trait2] + data.torso[trait1][trait2] + data.legs[trait1][trait2] + data.leftArm[trait1][trait2] + data.rightArm[trait1][trait2];
        return data.helmet[trait1] + data.torso[trait1] + data.legs[trait1] + data.leftArm[trait1] + data.rightArm[trait1];
    }
    function getAbility(stat) {
        return {
            max: initData[stat].max,
            time: initData[stat].coolWaitTime / 1000,
            count: 0,
            increase: initData[stat].regenPerSecond,
            tracks: {
                counting: 0,
                increasing: 100,
                increased: 100,
            },
            type: initData[stat].name,
            onDamage: initData[stat].onDamage / 100,
            onKill: initData[stat].onKill,
            drain: initData[stat].drain / 100,
            tenacity: initData[stat].tenacity,
        }
    }
    function getUnityData() {
        let gunWeight = 1;
        let unityCamera = camera;
        if(gun.active) gunWeight = 0;
        if(visualCamera != undefined) unityCamera = visualCamera
        if(troop.alive) {
            return {
                x: troop.x,
                y: troop.y,
                z: troop.z,
                rot: troop.rot,
                name: troop.username,
                time: 0,
                cameraX: unityCamera.pos.x,
                cameraY: unityCamera.pos.y,
                cameraZ: unityCamera.pos.z,
                cameraRotX: unityCamera.rot.x,
                cameraRotY: unityCamera.rot.y,
                cameraRotZ: unityCamera.rot.z,
                moveType: getMoveType(),
                topType: getTopType(),
                hpMax: hp.max,
                hpCurrent: hp.current,
                alive: troop.alive,
                killer: troop.killer,
                killerWeapon: troop.killerWeapon,
                winner: troop.winner,
                gunWeight: gunWeight,
                leftHandWeight: abilityWeight,
            }
        } else {
            return {
                alive: troop.alive,
                killer: troop.killer,
                name: troop.username,
                killerWeapon: troop.killerWeapon,
                winner: troop.winner,
            }
        }
    }
    function getMoveType() {
        let moveType;
        if(jumping == true) {
            moveType = 3;
        } else if(falling == true) {
            moveType = 4;
        } else if(walking == true) {
            moveType = 1;
        } else if(running == true) {
            moveType = 2;
        } else if(blocking == true) {
            moveType = 5;
        } else if(shooting == true) {
            moveType = 6;
        } else if(striking == true) {
            moveType = 7;
        } else {
            moveType = 0;
        }    
        return moveType;
    }
    function getTopType() {
        let topType;
        if(blocking == true) {
            topType = 5;
        } else if(shooting == true) {
            topType = 6;
        } else if(striking == true) {
            topType = 7;
        } else if(changeToGun == true) {
            topType = 8;
        } else if(changeToSaber == true) {
            topType = 9;
        } else if(jumping == true) {
            topType = 3;
        } else if(falling == true) {
            topType = 4;
        } else if(walking == true) {
            topType = 1;
        } else if(running == true) {
            topType = 2;

        } else {
            topType = 0;
        }
        return topType;
    }
    function depleteStat(stat, decrease, skipCount = false) {
        let previouseStat;
        if(decrease == 0) return;
        previouseStat = stat.current;
        stat.current -= decrease;
        if(stat.current > stat.max) stat.current = stat.max;
        else if(stat.current < 0) stat.current = 0;
        if(stat.current < previouseStat) {
            if(skipCount) {
                stat.count = Math.max(stat.count, stat.time / 3);
            } else {
                stat.count = stat.time;
            }
        }
    }
    function regenerateStat(stat) {
        if(stat.count <= 0) {
            if(stat.tracks.increased > 5) {
                stat.tracks.counting = 0;
            } else {
                stat.tracks.counting += dt;
            }
            stat.tracks.increasing += dt;
            if(stat.current < stat.max) {
                stat.current += stat.increase * dt;
                if(stat.current > stat.max) stat.current = stat.max;
            }
            if(stat.current == stat.max) stat.tracks.increased += dt;
        } else {
            stat.tracks.increased = 0;
            stat.tracks.increasing = 0;
            stat.count -= dt;
            stat.tracks.counting += dt;
        }
    }
    function onGroundMovement() {
        updateOnGroundSpeed();
        checkLand();
        move();
        jump();
    }
    function jump() {
        if(jumpDelay.count > 0) {
            jumpDelay.count -= dt;
            jumping = true;
            if(jumpDelay.count <= 0) {
                jumpDelay.count = 0;
                velocity.y = jumpHeight * jumpMult;
            }
        }
    }
    function offGroundMovement() {
        checkLeaveGround();
        updateOffGroundSpeed();
        fall();
    }
    function checkLeaveGround() {
        if(velocity.y == undefined) velocity.y = 0;
        if(wasOnGround == true && onGround == false) {
            walking = false;
            wasRunning = running;
            running = false;
            jumpDelay.count = 0;
            if(velocity.y > 0 && velocityOveride != 0) {
                let speedFacing = MathV.rotateVector2(0, 1, 360 - camera.rot.y);
                velocity.x = speedFacing.x * velocityOveride;
                velocity.z = speedFacing.y * velocityOveride;
                velocity.start = velocityOveride;
            } else {
                let totalMoveSpeed = getMoveSpeed();
                velocity.x = speed.x * totalMoveSpeed * actionSpeed;
                velocity.z = speed.z * totalMoveSpeed * actionSpeed;
                velocity.start = totalMoveSpeed * actionSpeed;
            }
            velocity.rot = getDirection();
        }
    }
    function checkLand() {
        landed = wasOnGround == false && onGround == true;
        if(landed) {
            falling = false;
            jumping = false;
        }
    }
    function fall() {
        moveDirection("x", "w", velocity.x * dt);
        moveDirection("y", "h", velocity.y * dt);
        moveDirection("z", "d", velocity.z * dt);
    }
    function updateSpeed() {
        accelerate('x');
        accelerate('z');
        let rotatedSpeed = MathV.rotateVector2(moving.x, moving.z, 360 - camera.rot.y);
        speed = {x: rotatedSpeed.x * troop.mult.speed, y: 0, z: rotatedSpeed.y * troop.mult.speed};
    }
    // How It Works: acceleration and decelleration = 1 / seconds needed
    function accelerate(val) { 
        let acceleration = 1 / (accelerationTime || 0.65);
        let deceleration = 1 / (decelerationTime || 0.35);
        if(input["moving" + val.toUpperCase()] == 1) {
            if(moving[val] < 1) {
                moving[val] = Math.min(1, moving[val] + (moving[val] < 0 ? deceleration : acceleration) * dt);
            }
        } else if(input["moving" + val.toUpperCase()] == -1) {
                moving[val] = Math.max(-1, moving[val] - (moving[val] > 0 ? deceleration : acceleration) * dt);
        } else {
            if(moving[val] > 0) {
                moving[val] = Math.max(0, moving[val] - deceleration * dt);
            } else {
                moving[val] = Math.min(0, moving[val] + deceleration * dt);
            }
        }
    }
    function cancelAnimations() {
        jumpDelay.count = 0;
        running = false;
        visualizations.length = 0;
        if(changeCount > 0) {
            changeCount = 0;
            if(changeToSaber) {
                gun.active = true;
                saber.active = false;
                changeToSaber = false;
            } else {
                gun.active = false;
                saber.active = true;
                changeToGun = false;
            }
        }
    }
    function cancelAbilities() {
        for(var i = 0; i < abilities.length; i ++) {
            if(abilities[i].state == "activating" || abilities[i].state == "active") startCoolDownAbility(i, true);
        }
    }
    function updateOnGroundSpeed() {
        if(speed.x == 0 && speed.z == 0) {
            walking = false;
            running = false;
            troop.actionSpeed = 0;
        } else if(running == false){
            walking = true;
        }
    }
    function updateOffGroundSpeed() {
        let velocityYMult = 1;
        if(velocity.y <= 0) {
            falling = true;
            velocityYMult = troop.mult.fallSpeed;
        } else {
            jumping = true;
            velocityYMult = troop.mult.jump;
        }
        velocity.y -= gravity * dt * troop.getWeight() * jumpHeldBonus * velocityYMult;
        updateVelocity('x');
        updateVelocity('z');

    }
    function updateVelocity(type) {
        let airResistance = Math.abs(velocity[type] / velocity.start) * dt;
        if(velocity[type] > 0) {
            velocity[type] = Math.max(0, velocity[type] - airResistance);
        } else if(velocity[type] < 0) {
            velocity[type] = Math.min(0, velocity[type] + airResistance);
        }
        velocity[type] += speed[type] * dt;
    }
    function rotate() {
        if(shooting == true || blocking == true || striking == true) {
            shootRotate = true;
            shootRotation = camera.rot.y;
        }
        /*if(troop.winner != undefined) {
            rotateTo(getDirection() - camera.rot.y);
        } else*/ if(shootRotate == true) {
            rotateTo(shootRotation);
            if(troop.rot == shootRotation) {
                shootRotate = false;
            }
        } else if(onGround == false) {
            rotateTo(velocity.rot);
        } else if(abilityRot()) {
        } else {
            rotateTo(getDirection());
        }
    }
    function abilityRot() {
        for(var i = 0; i < abilities.length; i ++) {
            if((abilities[i].state == "activating" || abilities[i].state == "active") && (abilities[i].angle == undefined || abilities[i].angle < 360) && abilities[i].effect.rotationLock) {
                rotateTo(camera.rot.y);
                return true;
            }
        }
        return false;
    }
    function getDirection() {
        if(Math.abs(input.movingX) < Math.abs(input.movingZ)) {
            return camera.rot.y + (Math.sign(input.movingZ) - 1) * 90;
        } else if(Math.abs(input.movingX) > Math.abs(input.movingZ)) {
            return camera.rot.y + Math.sign(input.movingX) * 90;
        } else if(input.movingX != 0 && input.movingY != 0) {
            return camera.rot.y + (Math.sign(input.movingX) - (Math.sign(input.movingZ) - 1) * Math.sign(input.movingX)) * 45;
        }
    }
    function rotateTo(target) {
        let rotationX = troop.rot;
        let rotSpeed = 350 * dt;
        if(Math.abs(rotationX - target) > Math.abs(rotationX - target - 360)) {
            rotationX -= 360;
        } else if(Math.abs(rotationX - target) > Math.abs(rotationX - target + 360)) {
            rotationX += 360;
        }
        if(rotationX < target) {
            rotationX += rotSpeed;
            if(rotationX > target) rotationX = target;
        } else if(rotationX > target) {
            rotationX -= rotSpeed;
            if(rotationX < target) rotationX = target;
        }
        troop.rot = rotationX;
    }
    function move() {
        moveDirection("x", "w", speed.x * getMoveSpeed() * actionSpeed * dt);
        moveDirection("y", "h", -0.0001)
        moveDirection("z", "d", speed.z * getMoveSpeed() * actionSpeed * dt);
    }
    function getMoveSpeed() {
        return moveSpeed * (100 / (21 + troop.getWeight()));
    }
    function setCameraRot() {
        if (troop.winner != undefined) return;
        camera.rot.y += input.mouseX * dt * 5;
        if(camera.rot.y >= 360) {
            camera.rot.y -= 360;
        } else if(camera.rot.y < 0 ) {
            camera.rot.y += 360;
        }
    }
    function setCameraPos() {
        let cameraVector;
        let sideVector;
        if (troop.winner != undefined) return;
        cameraVector = MathV.rotateVector2(0, 1, 360 - camera.rot.y)
        sideVector = MathV.rotateVector2(0, 1, 360 - camera.rot.y + 90);
        camera.pos = {
            x: troop.x + troop.w * 0.5 - cameraVector.x * 2 - sideVector.x * 0.75,
            y: troop.y + troop.h * 0.75,
            z: troop.z + troop.d * 0.5 - cameraVector.y * 2 - sideVector.y * 0.75,
        }
    }

    function moveDirection(direction, dimension, distance) {
        if(distance == 0) return -1;
        troop[direction] += distance;
        let collisionIndex = -1;
        if(collisionIndex != -1) {
            if(distance > 0) {
                troop[direction] = obstacles[collisionIndex][direction] - troop[dimension];
            } else if(distance < 0) {
                troop[direction] = obstacles[collisionIndex][direction] + obstacles[collisionIndex][dimension];
            }
        };
        return collisionIndex;
    }
    function checkCollision() {
        let objs = CD.check(troop);
        let hit;
        let obj
        wasOnGround = onGround;
        onGround = false;
        for(obj of objs) {
            hit = boxCollision(obj) || hit;
        }
        return hit;
    }
    function prepareTrooper() {
        physicalDefense.rangedDefense = initData.physical.physicalRangedDefense;
        physicalDefense.meleeDefense = initData.physical.physicalMeleeDefense;
        stamina.current = stamina.max;
        thaum.current = thaum.max / 20;
        thaum.count = thaum.time;
        hp.current = hp.max;
        troop.cancelInput();
        cooldownUltimates();
    }
    function boxCollision(obj) {        
        let negX = Math.abs(troop.x + troop.w - obj.x) || Infinity;
        let negY = Math.abs(troop.y + troop.h - obj.y) || Infinity;
        let negZ = Math.abs(troop.z + troop.d - obj.z) || Infinity;
        let posX = Math.abs(troop.x - obj.x - (obj.w || 0)) || Infinity;
        let posY = Math.abs(troop.y - obj.y - (obj.h || 0)) || Infinity;
        let posZ = Math.abs(troop.z - obj.z - (obj.d || 0)) || Infinity;
        switch(Math.min(negX, negY, negZ, posX, posY, posZ)) {
            case negX:
                troop.x = obj.x - troop.w;
                velocity.x = 0;
                break;
            case negY:
                troop.y = obj.y - troop.h;
                if(velocity.y > 0) velocity.y = 0;
                break;
            case negZ:
                troop.z = obj.z - troop.d;
                velocity.z = 0;
                break;
            case posX:
                troop.x = obj.x + obj.w;
                velocity.x = 0;
                break;
            case posY:
                if(velocity.y <= 0) {
                    troop.y = obj.y + (obj.h || 0);
                    onGround = true;
                    velocity.y = 0;
                } else {
                    return false
                }
                break;
            case posZ:
                troop.z = obj.z + obj.d;
                velocity.z = 0;
        }
        return true;
    }

}