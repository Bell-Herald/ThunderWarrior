module.exports = CollisionDetection
const MathV = require("./MathVector");
function CollisionDetection(obstacles, troopers) {
    this.check = (collider, troopType) => {
        let collisions = [];
        if(troopType == undefined || troopType == "obstacleEnemy") {
            for(var i = 0; i < obstacles.length; i ++) {
                if((obstacles[i].collisionType == "box" && checkBox(collider, obstacles[i])) ||
                (obstacles[i].collisionType == "plane" && checkPlane(collider, obstacles[i])))
                    collisions.push(obstacles[i]);
            }
        }
        for(var i = 0; i < troopers.length; i ++) {
            if(checkValidTrooper(troopers[i], collider, troopType) && checkBox(collider, troopers[i])) collisions.push(troopers[i]);
        }
        return collisions;
    }
    function checkValidTrooper(troop, collider, troopType) {
        return troop.alive && troop.username != collider.username && ((troopType != "ally" && (troop.collisionAf == "unaligned" || troop.collisionAf != collider.collisionAf)) || (troopType != "enemy" && troopType != "obstacleEnemy" && troop.collisionAf != "unaligned" && troop.collisionAf == collider.collisionAf));
    }
    function checkBox(collider, box) {
        if(collider.collisionType == "box") return checkBoxBox(collider, box);
        else if(collider.collisionType == "arc") return checkArcBox(collider, box);
    }
    function checkArcBox(arc, box) {
        let testX = arc.x;
        let testZ = arc.z;
        let distX, distZ, distance;
        if(arc.y + arc.h < box.y || arc.y > box.y + box.h) {
            return false;
        }
        if(arc.x < box.x) testX = box.x;
        else if(arc.x > box.x + box.w) testX = box.x + box.w;
        if(arc.z < box.z) testZ = box.z
        else if(arc.z > box.z + box.h) testZ = box.z + box.d;
        distX = arc.x - testX;
        distZ = arc.z - testZ;
        distance = Math.sqrt( (distX * distX) + (distZ * distZ));
        if(distance <= arc.radius) {
            let dist1 = MathV.rotateVector2(box.w / 2, 0, arc.rot);
            let dist2 = MathV.rotateVector2(-box.w / 2, 0, arc.rot);
            if(arc.angle >= 360 || checkPointInAngle(arc, box.x + box.w / 2, box.z + box.d / 2) || checkPointInAngle(arc, box.x + box.w / 2 + dist1.x, box.z + box.d / 2 + dist1.y) || checkPointInAngle(arc, box.x + box.w / 2 + dist2.x, box.z + box.d / 2 + dist2.y)) {
                return true
            } else {
                return false;
            }
        } else {
            return false;
        }

    }
    function checkBoxBox(box1, box2) {
        return box1.x < box2.x + box2.w && box1.y < box2.y + box2.h && box1.z < box2.z + box2.d && box2.x < box1.x + box1.w && box2.y < box1.y + box1.h && box2.z < box1.z + box1.d
    }
    function checkPlane(box, plane) {
        return plane.y > box.y && plane.y < box.y + box.h;
    }
    function checkPointInAngle(arc, pointX, pointZ) {
        let testAngle = 180 +  Math.atan2(arc.x - pointX, arc.z - pointZ) * 180 / Math.PI;
        testAngle = MathV.normalizeAngle(testAngle);
        let lesserAngle = MathV.normalizeAngle(arc.rot - arc.angle / 2);
        let greaterAngle = MathV.normalizeAngle(arc.rot + arc.angle / 2);
        let lesserDiffrence = MathV.normalizeAngle(testAngle - lesserAngle);
        let greaterDifference = MathV.normalizeAngle(testAngle - greaterAngle);
        let success1 = lesserDiffrence <= arc.angle || lesserDiffrence > 360 - arc.angle;
        let success2 = greaterDifference <= arc.angle || greaterDifference > 360 - arc.angle;
//        console.log("PtP", testAngle, "facing", arc.rot, "total", arc.angle, "min", lesserAngle, "max", greaterAngle, "suc1", success1, "suc2", success2, "points", pointX, pointZ);
        return success1 && success2;
    }
}