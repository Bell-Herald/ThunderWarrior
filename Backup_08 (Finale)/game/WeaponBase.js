module.exports = WeaponBase;

function WeaponBase() {
    const weapon = this;
    var tracks;
    var heat;
    var firingSpeed;
    var nextFiringSpeed = {};
    Object.defineProperty(this, 'data', {
        get() {
                let data = {
                    heat: {
                        max: heat.max, current: heat.current,
                        cool: {max: heat.time, current: heat.count, mandatory: heat.mandatoryCool},
                    },
                    fs: {max: firingSpeed.max, current: firingSpeed.count},
                    tracks: {idle: tracks.idle, active: tracks.active, cooled: tracks.cooled, overheated: tracks.overheated, fadeIn: tracks.fadeIn, fadeOut: tracks.fadeOut, stayAfter: tracks.stayAfter},
                }
                if(heat.canOverheat) {
                    data.heat.overheat = {max: heat.overheat.time, current: heat.overheat.count}
                } else {
                    data.heat.current = data.heat.max - data.heat.current;
                }
                return data;
        }
    });
    this.initialize = (initData, theHeat) => {
        heat = theHeat || {
            max: initData.heat.max / 1000,
            increase: initData.heat.increase / 1000,
            current: 0,
            mandatoryCool: false,
            time: initData.heat.coolWaitTime / 1000,
            count: 0,
            canOverheat: false,
        }
        firingSpeed = {
            count: 0,
            max: 1,
        }
        tracks = {
            idle: 100,
            active: 0,
            cooled: 100,
            overheated: 0,
            fadeIn: 1,
            stayAfter: 5,
            fadeOut: 3,
        }
        if(initData.heat != undefined && initData.heat.overheatTime != undefined) {
            heat.overheat = {
                status: false,
                time: initData.heat.overheatTime / 1000,
                count: 0,
            };
            heat.canOverheat = true;
        }
    }
    this.setFiringSpeed = (max, count, next) => {
        let same = max == count;
        firingSpeed = {max: max, count: 0};
        nextFiringSpeed = next;
        if(count) {
            firingSpeed.count = count;
            tracks.idle = 0;
        }
    }
    this.activate = (dt, activationInput, active, count = true) => {
        let using = activationInput && active && (!heat.canOverheat || (!heat.overheat.status && !heat.mandatoryCool));
        if((active && activationInput) || tracks.idle <= tracks.stayAfter) {
            tracks.active += dt;
        } else if(count && ((heat.canOverheat && heat.current <= 0) || (!heat.canOverheat && heat.current >= heat.max)) && firingSpeed.count <= 0){
            tracks.active = 0;
        }
        return {active: using, canFire: using && firingSpeed.count <= 0, fireable: firingSpeed.count <= 0 && (!heat.canOverheat || (!heat.overheat.status && !heat.mandatoryCool))};
    }
    this.notOverheated = () => {
        return !heat.canOverheat || (!heat.overheat.status && !heat.mandatoryCool);
    }
    this.forceOverheat = () => {
        heat.overheat.status = true;
        heat.mandatory = true;
        heat.current = heat.max;
        heat.overheat.count = heat.overheat.time;
        heat.count = heat.time;
        tracks.active = 1;
        tracks.idle = 0;
    }
    this.cool = () => {
        heat.overheat.status = false;
        heat.mandatory = false;
        heat.current = 0;
        heat.overheat.count = 0;

    }
    this.setDecreasedHeatAndFiringSpeed = (dt, heatDecrease = 0, fsDecrease = 0) => {
        firingSpeed.count -= fsDecrease;
        if(firingSpeed.count <= 0) {
            firingSpeed.count = 0;
            if(nextFiringSpeed && nextFiringSpeed.count && nextFiringSpeed.max && (firingSpeed.max != nextFiringSpeed.max || firingSpeed.count != nextFiringSpeed.count)) {
                firingSpeed.max = nextFiringSpeed.max;
                firingSpeed.count = nextFiringSpeed.count;
                nextFiringSpeed = undefined;
            }
            if(heat.canOverheat) {
                if(heat.overheat.status == true) {
                    tracks.cooled = 0;
                    tracks.overheated += heatDecrease;
                    heat.mandatoryCool = true;
                    heat.overheat.count -= heatDecrease;
                    if(heat.overheat.count <= 0) {
                        heat.overheat.count = 0;
                        heat.overheat.status = false;
                        heat.current = heat.max;
                    }
                } else {
                    tracks.overheated = 0;
                    if(heat.count <= 0) {
                        heat.count = 0;
                        if(heat.current > 0) {
                            heat.current -= heatDecrease;
                        } else {
                            tracks.idle += dt; // stays as dt rather than decrease because idle isn't really a part of shooting
                            heat.current = 0;
                            heat.mandatoryCool = false;
                        }
                    } else {
                        heat.count -= heatDecrease;
                    }
                }
            } else {
                if(heat.current >= heat.max) {
                    tracks.idle += dt;
                }
            }
        }
        if(heat.canOverheat && heat.overheat.status == false) tracks.cooled += heatDecrease;
    }
    this.justShot = () => {
        tracks.idle = 0;
    }
    this.increaseHeatAndFiringSpeed = (increase = 0, heatMult) => {
        if(heat.canOverheat) {
            firingSpeed.count = firingSpeed.max;
            heat.current += (heat.increase + increase) * heatMult;
            heat.count = heat.time;
            tracks.idle = 0;
            if(heat.current >= heat.max) {
                heat.overheat.status = true;
                heat.mandatory = true;
                heat.current = heat.max;
                heat.overheat.count = heat.overheat.time;
            }
        } else {
            firingSpeed.count = firingSpeed.max;
            heat.current -= increase;
            heat.count = heat.time;
            tracks.idle = 0;
        }
    }
    this.canChange = (active) => {
        return active && firingSpeed.count <= 0;// && ((heat.canOverheat && heat.current <= 0) || (!heat.canOverheat && heat.current >= heat.max));
    }
    this.fsDif = () => {
        return firingSpeed.max - firingSpeed.count;
    }
}