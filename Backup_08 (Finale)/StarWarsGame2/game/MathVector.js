module.exports = {
    rotateVector2: function(x, y, trueAngle) {
        let angle = trueAngle * Math.PI / 180;
        let newX = Math.cos(angle) * x - Math.sin(angle) * y;
        let newY = Math.sin(angle) * x + Math.cos(angle) * y;
        return {x: newX, y: newY}
    },
    normalizeAngle: function(angle) {
        while(angle >= 360) {
            angle -= 360;
        }
        while(angle < 0) {
            angle += 360;
        }
        return angle;
    },
    getDirection: function(troop, enemy) {
        let dx = (troop.x + troop.w / 2) - (enemy.x + enemy.w / 2);
        let dz = (troop.z + troop.d / 2) - (enemy.z + enemy.d / 2);
        let angle = Math.atan2(dx, dz) * 180 / Math.PI;
        return angle + 180;
    },
    normalizeVector: function(vector) {
        let total = Math.abs(vector.x) + Math.abs(vector.z);
        return {x: vector.x / total, z: vector.z / total};
    }
}