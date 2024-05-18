let idCount = 0;
const MathV = require("./MathVector");
module.exports = {
    test1: function () {}, test2: function () {}, test3: function () {}, test4: function () {},
    Run: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.specialEnd = true;
        this.actionType = "neutral";
        let startCost = ability.staminaCost;
        let drain = ability.staminaDrain;
        let speed = 2;
        this.prerequisite = () => troop.canRun(startCost + drain);
        this.activate = () => {
            this.end = false;
            troop.run(speed, 0);
        }
        this.update = (dt, input) => {
            if(input && troop.canRun(drain * dt)) {
                troop.run(speed, drain * dt);
            } else {
                this.end = true;
            }
        }
    },
    SpeedRun: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "neutral";
        this.specialEnd = true;
        let startCost = 10;
        let drainStart = ability.staminaDrain;
        let speedStart = 1.25;
        let increaseTime = 12;
        let finalIncreaseMult = 4;
        let speed, drain;
        this.prerequisite = () => {
            drain = drainStart;
            return troop.canRun(startCost + drain);
        }
        this.activate = () => {
            this.end = false;
            speed = speedStart;
            troop.run(speed, startCost);
        }
        this.update = (dt, input) => {
            if(speed < speedStart * finalIncreaseMult) {
                speed += dt * speedStart * finalIncreaseMult / increaseTime;
                drain += dt * drainStart * finalIncreaseMult / increaseTime;
                if(speed > speedStart *finalIncreaseMult4) {
                    speed = speedStart * finalIncreaseMult;
                    drain = drainStart * finalIncreaseMult
                }
            }
            if(input && troop.canRun(drain * dt)) {
                troop.run(speed, drain * dt);
            } else {
                this.end = true;
            }

        }
    },
    ExpeditiouseRetreat: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.specialEnd = true;
        let startCost = 25;
        let drain = ability.staminaDrain;
        let speed = 2.5;
        this.prerequisite = () => troop.canRun(startCost + drain);
        this.activate = () => {
            this.end = false;
            troop.run(speed, startCost)
        }
        this.update = (dt, input) => {
            if(input && troop.canRun(drain * dt)) {
                troop.run(speed, drain * dt);
                troop.mult.defense *= 1.25;
            } else {
                this.end = true;
            }

        }
    },
    ChangeWeapon: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "neutral";
        this.specialEnd = true;
        this.type = "changeWeapon";
        let changed;
        this.prerequisite = () => {
            return troop.canChangeGun() || troop.canChangeSaber();
        }
        this.activate = () => {
            changed = false;
        }
        this.update = () => {
            this.end = false;
            if(!changed) {
                if(troop.canChangeGun()) {
                    changed = true;
                    troop.changeToGun();
                } else if(troop.canChangeSaber()) {
                    changed = true;
                    troop.changeToSaber();
                }
            }
        }
    },
    PowerStrike: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.type = "strike";
        this.rotationLock = true;
        this.specialEnd = true;
        let func = function(enemy) {
            enemy.addStatus("slow", "stamina", ability.effectDuration, 0.6);
        };
        this.prerequisite = () => troop.canStrike();
        this.activate = () => {
            this.end = false;
            addStrike(troop, ability, staminaOffense, func);
        }
    },
    BleedStrike: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.type = "strike";
        this.rotationLock = true;
        this.specialEnd = true;
        let func = function(enemy) {
            enemy.addStatus("damageOverTime", "stamina", ability.effectDuration, troop, "stamina", ability.effectDamage, thaumOffense.crit, thaumOffense.accuracy, thaumOffense.precision, ability.type, ability.refrence + "Ability");
        };
        this.prerequisite = () => troop.canStrike();
        this.activate = () => {
            this.end = false;
            addStrike(troop, ability, staminaOffense, func);
        }
    },
    CriticalStrike: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.type = "strike";
        this.rotationLock = true;
        this.specialEnd = true;
        let func = function(enemy) {
            enemy.addStatus("expose", "stamina", ability.effectDuration, 0.6);
        };
        this.prerequisite = () => troop.canStrike();
        this.activate = () => {
            this.end = false;
            addStrike(troop, ability, staminaOffense, func);
        }
    }, SwiftStrike: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.type = "strike";
        this.specialEnd = true;
        this.rotationLock = true;
        let func = function(enemy) {
            enemy.addStatus("weakness", "stamina", ability.effectDuration, 0.7);
        };
        this.prerequisite = () => troop.canStrike();
        this.activate = () => {
            this.end = false;
            addStrike(troop, ability, staminaOffense, func);
        }
    }, SimpleBlock: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "neutral";
        this.specialEnd = true;
        this.rotationLock = true;
        this.prerequisite = () => troop.canBlock(ability.staminaCost, ability.continualDrain);
        this.activate = () => {
            this.end = false;
            console.log("ability.parryTime", ability.parryTime);
            troop.startBlock(ability.continualDrain, ability.parryTime, ability.canBlockThaum, ability.reflectionDrain, ability.ownStabDrain, ability.ownThaumDrain);
        }
        this.update = (dt, input) => {
            if(troop.canContinueBlock(input)) {
                troop.continueBlock();
            } else {
                troop.endBlock();
                this.end = true;
            }
        }
    }, ThaumBlock: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "neutral";
        this.specialEnd = true;
        this.rotationLock = true;
        this.prerequisite = () => troop.canBlock(ability.staminaCost, ability.continualDrain);
        this.activate = () => {
            this.end = false;
            troop.startBlock(ability.continualDrain, ability.parryTime, ability.canBlockThaum, ability.reflectionDrain, ability.ownStabDrain, ability.ownThaumDrain);
        }
        this.update = (dt, input) => {
            if(troop.canContinueBlock(input)) {
                troop.continueBlock();
            } else {
                troop.endBlock();
                this.end = true;
            }
        }
    }, ThaumBlockParry: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "neutral";
        this.specialEnd = true;
        this.rotationLock = true;
        this.prerequisite = () => troop.canBlock(ability.staminaCost, ability.continualDrain);
        this.activate = () => {
            this.end = false;
            troop.startBlock(ability.continualDrain, ability.parryTime, ability.canBlockThaum, ability.reflectionDrain, ability.ownStabDrain, ability.ownThaumDrain);
        }
        this.update = (dt, input) => {
            if(troop.canContinueBlock(input)) {
                troop.continueBlock();
            } else {
                troop.endBlock();
                this.end = true;
            }
        }
    }, Heal: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "neutral";
        this.prerequisite = () => !troop.atMaxHealth();
        this.activate = () => {
            troop.heal(100);
        }
    }, Speed: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "neutral";
        this.activate = () => {
            troop.addStatus("speed", "stamina", ability.duration, 2);
        }
    }, Dash: function (troop, ability) {
        this.actionType = "neutral";
        this.activate = () => {
            troop.addStatus("speed", "stamina", ability.duration, 7);
        }
    }, Jump: function (troop, ability) {
        this.actionType = "neutral";
        this.specialEnd = true;
        this.type = "jump";
        this.prerequisite = () => {
            return troop.canJump();
        }
        this.activate = () => {
            troop.startJump();
            this.end = false;
        }
        this.update = (dt, input) => {
            this.end = troop.getLanded();
            if(input && troop.canKeepJumping(ability.staminaCost)) {
                troop.keepJumping(ability.staminaCost)
            }
        }
    }, Launch: function (troop, ability) {
        this.actionType = "neutral";
        this.type = "jump";
        this.prerequisite = () => {
            return troop.canJump();
        }
        this.activate = () => {
            troop.startJump(2);
        }
        this.update = (dt, input) => {
            let cost = ability.staminaCost / 5 * troop.getWeight() * dt;
            if(input && troop.canKeepJumping(ability.staminaCost)) {
                troop.keepJumping(ability.staminaCost)
            }
        }
    }, Leap: function (troop, ability) {
        this.actionType = "neutral";
        this.type = "jump";
        this.prerequisite = () => {
            return troop.canJump();
        }
        this.activate = () => {
            troop.startJump(0.75, 15);
        }
        this.update = (dt, input) => {
            if(input && troop.canKeepJumping(ability.staminaCost)) {
                troop.keepJumping(ability.staminaCost)
            }
        }
    }, Defensive: function (troop, ability) {
        this.actionType = "neutral";
        this.activate = () => {
            troop.addStatus("defense", "stamina", ability.duration, 1.5);
        }
    }, Shield: function (troop, ability) {
        this.actionType = "neutral";
        this.activate = () => {
            troop.addStatus("defense", "stamina", ability.duration, 3);
        }
    }, HealOverTime: function(troop, ability) {
        this.actionType = "neutral";
        this.activate = () => {
            troop.addStatus("healOverTime", "stamina", ability.duration, 25);
        }
    }, FastFire: function(troop, ability) {
        this.actionType = "neutral";
        this.activate = () => {
            troop.addStatus("firingSpeed", "stamina", ability.duration, 2);
        }
    }, Preparation: function(troop, ability) {
        this.actionType = "neutral";
        this.activate = () => {
            troop.addStatus("prepared", "stamina", ability.duration, 1.5)
        }
    }, Recovery: function(troop, ability) {
        this.actionType = "neutral";
        this.activate = () => {
            troop.depleteStamina(-500);
        }
    }, Confusion: function(troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                target.addStatus("confuse", "thaum", ability.effectDuration, 2, this.id);
            });
        }
    }, Reversal: function(troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID()
        this.rotationLock = true;
        this.activate = () => {
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                target.addStatus("reverse", "thaum", ability.effectDuration, 2, this.id);
            });
        }
    }, InspireFear: function(troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID()
        this.rotationLock = true;
        this.activate = () => {
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                target.addStatus("fear", "thaum", ability.effectDuration, 2);
                troop.addStatus("speed", "thaum", ability.effectDuration, 1.35);
            });
        }
    }, Annihilation: function(troop, ability) {
        this.actionType = "neutral";
        this.activate = () => {
            troop.addStatus("damaging", "stamina", ability.duration, 1.3);
        }
    }, FlurryOfBlows: function(troop, ability) {
        this.actionType = "neutral";
        this.activate = () => {
            troop.addStatus("meleeSpeed", "stamina", ability.duration, 1.75);
        }
    }, Oneness: function(troop, ability) {
        this.actionType = "neutral";
        this.activate = () => {
            troop.addStatus("weightless", "stamina", ability.duration, 0.5);
        }
    }, LifeDrain: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target, damage) {
                source.heal(damage * 0.5);
            });
        }
    }, Freeze: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target, damage) {
                target.addStatus("frozen", "thaum", ability.effectDuration);
            });
        }
    }, Punish: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            damageTroopers(CD, troop, ability, thaumOffense);
        }
    }, Tether: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                target.addStatus("heavy", "thaum", ability.effectDuration, 2);
                target.addStatus("slow", "thaum", ability.effectDuration, 0.7);
            });
        }
    }, Expose: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                target.addStatus("expose", "thaum", ability.effectDuration, 1/1.3);
            });
        }
    }, Weaken: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                target.addStatus("weakness", "thaum", ability.effectDuration, 0.6);
            });
        }
    }, MindControl: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.rotationLock = true;
        let troopCollisions;
        this.activate = () => {
            troopCollisions = [];
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                if(parried) {
                    unRedirectableParry(source, target);
                } else {
                    troopCollisions.push({source: troop, target: target, input: {}});
                    target.cancelInput();
                }
            });
        }
        this.update = () => {
            for(var i = 0; i < troopCollisions.length; i ++) {
                troopCollisions[i].source.modifyInput(function(sourceInput) {
                        if(!sourceInput.cleared) {
                            troopCollisions[i].input = sourceInput
                        }
                        troopCollisions[i].target.changeAffiliation(troopCollisions[i].target.username);
                        troopCollisions[i].target.modifyInput(function(targetInput) {
                            Object.assign(targetInput, troopCollisions[i].input);
                            targetInput.modified = true;
                        });
                    if(!sourceInput.cleared) {
                        troopCollisions[i].source.cancelInput();
                    }
                });
                if(troopCollisions.length > 0) {
                    let cam = troopCollisions[0].target.getCamera();
                    troopCollisions[i].source.UIUsername = troopCollisions[0].target.username;
                    troopCollisions[i].source.setVisualCamera({
                        pos: {
                            x: cam.pos.x,
                            y: cam.pos.y,
                            z: cam.pos.z,
                        }, rot: {
                            x: cam.rot.x,
                            y: cam.rot.y,
                            z: cam.rot.z, 
                        }
                    });
                }
            }
        }
    }, Hold: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.rotationLock = true;
        let troopCollisions;
        this.activate = () => {
            this.rotationLock = true;
            troopCollisions = [];
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                if(parried) {
                    unRedirectableParry(source, target);
                } else {
                    target.cancelActions();
                    troopCollisions.push({target: target, source: source, yIncrease: 0});
                }
            });
            if(troopCollisions.length == 0) this.rotationLock = false;
        }
        this.update = (dt) => {
            for(var i = 0; i < troopCollisions.length; i ++) {
                if(troopCollisions[i].target.isReleased()) {
                    troopCollisions.splice(i, 1);
                    i --;
                } else {
                    let direction = MathV.rotateVector2(0, 1, 180 - troopCollisions[i].source.rot);
                    troopCollisions[i].target.cancelInput();
                    troopCollisions[i].target.inputModified();
                    troopCollisions[i].yIncrease = moveAway(dt, troopCollisions[i].target, troopCollisions[i].source, 6, troopCollisions[i].yIncrease, 2, 10, direction.x, direction.y);
                    if(timeHasPassed(ability, 1, dt, false)) {
                        troopCollisions[i].target.damage(ability.effectDamage * troopCollisions[i].source.mult.damage, troopCollisions[i].source, "thaum", thaumOffense.crit, thaumOffense.accuracy, thaumOffense.precision, ability.name, ability.refrence + "Ability");
                    }
                }
            }
        }
    }, Choke: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.rotationLock = true;
        let troopCollisions;
        this.activate = () => {
            troopCollisions = [];
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                if(parried) {
                    unRedirectableParry(source, target);
                } else {
                    target.cancelActions();
                    troopCollisions.push({target: target, source: source, yIncrease: 0});
                }
            });
        }
        this.update = (dt) => {
            for(var i = 0; i < troopCollisions.length; i ++) {
                if(troopCollisions[i].target.isReleased()) {
                    troopCollisions.splice(i, 1);
                    i --;
                } else {
                    troopCollisions[i].target.cancelInput();
                    troopCollisions[i].target.inputModified();
                    troopCollisions[i].yIncrease = moveTorwards(dt, troopCollisions[i].target, troopCollisions[i].source, 0.75, troopCollisions[i].yIncrease, 1, 2);
                    if(timeHasPassed(ability, 1, dt, false)) {
                        troopCollisions[i].target.damage(ability.effectDamage * troopCollisions[i].source.mult.damage, troopCollisions[i].source, "thaum", thaumOffense.crit, thaumOffense.accuracy, thaumOffense.precision, ability.name, ability.refrence + "Ability");
                    }
                }
            }
        }
    }, Push: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                let direction = MathV.rotateVector2(0, 1, 360 - source.rot);
                target.knockback(direction.x, direction.y, 3.5, 0.75, true);
            });
        }
    }, Pull: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                let direction = MathV.rotateVector2(0, 1, 180 - source.rot);
                target.knockback(direction.x, direction.y, 3, 0.5, true);//1.25 on the y instead of 0.5 for pulling n top
            });                
        }
    }, DamageAura: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.activate = () => {
            troop.fired();
        }
        this.update = (dt) => {
            if(timeHasPassed(ability, 1, dt, true)) {
                damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                    target.addStatus("slow", "thaum", 1, true, 0.03);
                }, 1, "effectDamage");
            }
        }
    }, HealAura: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "defense";
        this.id = newID();
        this.update = (dt) => {
            if(timeHasPassed(ability, 1, dt, true)) {
                console.log("time passed");
                buffTroopers(CD, troop, ability, function(ally) {
                    ally.heal(50);
                });
            }
        }
    }, SpeedAura: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "defense";
        this.id = newID();
        this.update = (dt) => {
            if(timeHasPassed(ability, 1, dt, true)) {
                buffTroopers(CD, troop, ability, function(ally) {
                    ally.addStatus("speed", "thaum", 1, 1.75);
                });
            }
        }
    }, Overheat: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.activate = () => {
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                target.overheatGun();
            });
        }
    }, Cool: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "defense";
        this.id = newID();
        this.activate = () => {
            buffTroopers(CD, troop, ability, function(ally) {
                ally.addStatus("cool", "thaum", ability.effectDuration, 0.25);
            });            
        }
    }, Fortification: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "defense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            buffTroopers(CD, troop, ability, function(ally) {
                ally.addStatus("defense", "thaum", ability.effectDuration, 1.5);
            });            
        }
    }, Swiftness: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "defense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            buffTroopers(CD, troop, ability, function(ally) {
                ally.addStatus("speed", "thaum", ability.effectDuration, 1.5);
                ally.addStatus("meleeSpeed", "thaum", ability.effectDuration, 1.5);
                ally.addStatus("firingSpeed", "thaum", ability.effectDuration, 1.5);
            });            
        }
    }, GroupPrep: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "defense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            buffTroopers(CD, troop, ability, function(ally) {
                ally.addStatus("prepared", "thaum", ability.effectDuration, 2);
            });
        }
    }, JumpBoost: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "defense";
        this.id = newID();
        this.rotationLock = true;
        this.activate = () => {
            buffTroopers(CD, troop, ability, function(ally) {
                ally.addStatus("jumping", "thaum", ability.effectDuration, 0.5);
            });            
        }
    }, Hover: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.id = newID();
        this.activate = () => {
            buffTroopers(CD, troop, ability, function(ally) {
                ally.addStatus("hover", "thaum", ability.effectDuration, 0.25);
                ally.addStatus("weightless", "thaum", ability.effectDuration, 0.5);
            });            
        }
    }, Repulse: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        this.id = newID();
        this.activate = () => {
            console.log("activated");
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                let distance = source.getDistanceXZ(target);
                target.knockback(distance.x, distance.z, 2.5, 0.5, true);
            }, 0.25);
        }
        this.end = () => {
            console.log("ended");
            damageTroopers(CD, troop, ability, thaumOffense, function(parried, source, target) {
                let distance = source.getDistanceXZ(target);
                target.knockback(-distance.x, -distance.z, 6, 0.9, true);
            }, 0.75);
        }
    }, SnipeShot: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        let specialID = Math.random();
        this.specialEnd = true;
        this.rotationLock = true;
        this.type = "specialShot";
        this.prerequisite = () => {
            return troop.canShoot();
        }
        this.activate = () => {
            this.end = false;
            specialShot(troop, ability, staminaOffense);
        }
        this.update = () => {
            troop.clearGunInput();
        }
    }, TripleShot: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        let specialID = Math.random();
        this.specialEnd = true;
        this.rotationLock = true;
        this.type = "specialShot";
        this.prerequisite = () => {
            return troop.canShoot();
        }
        this.activate = () => {
            this.end = false;
            specialShot(troop, ability, staminaOffense);
        }
        this.update = () => {
            troop.clearGunInput();
        }
    }, BurstShot: function (troop, ability, CD, staminaOffense, thaumOffense) {
        this.actionType = "offense";
        let specialID = Math.random();
        this.rotationLock = true;
        this.specialEnd = true;
        this.type = "specialShot";
        this.prerequisite = () => {
            return troop.canShoot();
        }
        this.activate = () => {
            this.end = false;
            specialShot(troop, ability, staminaOffense);
        }
        this.update = () => {
            troop.clearGunInput();
        }
    }
};
// time in seconds;
// count original means do the effect right when the time starts
function timeHasPassed(ability, time, dt, countOriginal = false) {
    let additionalTime = ability.duration % time;
    let count = ability.count + additionalTime;
    return Math.floor(count / time) != Math.floor(count / time - dt) && (countOriginal || ability.count + dt != ability.duration);
}
function hitTroopers(CD, troop, ability, troopType) {
    let abilityBox = {
            x: troop.x + troop.w / 2,//camera.pos.x,
            y: troop.y,
            z: troop.z + troop.d / 2,//camera.pos.z,
            h: troop.y + troop.h * 0.75,
            collisionAf: troop.collisionAf,
            rot: troop.rot,
            angle: ability.angle,
            radius: ability.range,
            collisionType: "arc",
    }
    return CD.check(abilityBox, troopType);
}
function buffTroopers(CD, troop, ability, effect) {
        let troopCollisions = hitTroopers(CD, troop, ability, "ally");
        effect(troop);
        for(var i = 0; i < troopCollisions.length; i ++) {
            effect(troopCollisions[i]);
        }
}

function damageTroopers(CD, troop, ability, damageType, additionalEffect, moreDamageMult = 1, damageProp = "damage") {
    let troopCollisions = hitTroopers(CD, troop, ability, "enemy");
    for(var i = 0; i < troopCollisions.length; i ++) {
        let checkBlock = troopCollisions[i].checkBlockThaum(troop);
        if(checkBlock == "block") {

        } else {
            let damageDealt = 0;
            let target;
            let source;
            let parried = false;
            console.log("result", checkBlock);
            if(checkBlock == "parry") {
                source = troopCollisions[i];
                target = troop;
                parried = true;
            } else {
                source = troop;
                target = troopCollisions[i];
            }
            let damage = ability[damageProp] * moreDamageMult * source.mult.damage;
            if(damage > 0) {
                damageDealt = target.damage(damage, source, "thaum", damageType.crit, damageType.accuracy, damageType.precision, ability.name, ability.refrence + "Ability");
            }
            if(typeof additionalEffect === "function") additionalEffect(parried, source, target, damageDealt);
        }
    }
    troop.fired();
}
function moveAway(dt, troop, enemy, force, yIncrease, yIncreaseTotal, totalDistance, directionX = 0, directionZ = 0) {
    let direction = troop.getDistanceXZ(enemy, directionX * 10, directionZ * 10);
    let distance = troop.getDistance(enemy, directionX * 10, directionZ * 10);
    troop.mult.weight = 0;
    if(distance > 0 + force * dt) {
        troop.x -= direction.x * force * dt;
        troop.z -= direction.z * force * dt;
    } else if(distance < 0 - force * dt) {
        troop.x += direction.x * force * dt;
        troop.z += direction.z * force * dt;
    }
    if(yIncrease < yIncreaseTotal) {
        yIncrease += yIncreaseTotal * dt;
        troop.y += yIncreaseTotal * dt;
    }
    troop.mult.fallSpeed = 0;
    return yIncrease;
}

function moveTorwards(dt, troop, enemy, force, yIncrease, yIncreaseTotal, totalDistance) {
    let direction = troop.getDistanceXZ(enemy);
    let distance = troop.getDistance(enemy);
    troop.mult.weight = 0;
    if(distance > totalDistance + force * dt) {
        troop.x -= direction.x * force * dt;
        troop.z -= direction.z * force * dt;
    }
    if(yIncrease < yIncreaseTotal) {
        yIncrease += yIncreaseTotal * dt;
        troop.y += yIncreaseTotal * dt;
    }
    troop.mult.fallSpeed = 0;
    return yIncrease;
}
function newID() {
    idCount ++;
    return idCount;
}
function specialShot(troop, ability, staminaOffense) {
    troop.specialShot(ability.shotCount, ability.damageMult, ability.critChanceMult, ability.critDamageMult, ability.accuracyChanceMult, ability.accuracyDamageMult, ability.precisionMult, ability.rangeMult, ability.speedMult, ability.spreadMult, ability.costMult, ability.firingSpeedMult, ability.staminaDamage, staminaOffense, ability.name, ability.refrence + "Ability");
}
function addStrike(troop, ability, staminaOffense, func) {
    troop.addStrike(ability.strikeCount, ability.damageMult, ability.radiusMult, ability.knockbackMult, ability.strikeCooldownMult, ability.criticalChanceMult, ability.criticalDamageMult, ability.accuracyChanceMult, ability.accuracyDamageMult, ability.precisionMult, ability.staminaDamage, staminaOffense, ability.name, ability.refrence + "Ability", func);
}
function unRedirectableParry(source, target) {
    let direction = MathV.rotateVector2(0, 1, 360 - source.rot);
    target.knockback(direction.x, direction.y, 2.5, 0.75, true);
    target.addStatus("expose", "thaum", 5, 0.75);
}