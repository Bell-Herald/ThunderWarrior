'use strict'

module.exports = buildMap;

function buildMap(troopers)  {
    let mapNum = Math.random();
    if(mapNum < 0.45) {
        this.obstacles = mazeObstacles();
        this.positions = mazePositions();
    
    } else if(mapNum < 0.65) {
        this.obstacles = defaultObstacles();
        this.positions = defaultPositions();    
    } else {
        this.obstacles = blockyObstacles();
        this.positions = blockyPositions();    
    }
    this.positions = randomizePositions(troopers, this.positions);
    setPositions(this.positions, troopers);
}

function defaultObstacles() {
    return [
        {collisionType: "box", x: -55, y: 0, z: -50, w: 5, h: 100, d: 100}, //wall 
        {collisionType: "box", x: 50, y: 0, z: -50, w: 5, h: 100, d: 100}, // wall
        {collisionType: "box", x: -50, y: 0, z: 50, w: 100, h: 100, d: 5}, // wall
        {collisionType: "box", x: -50, y: 0, z: -55, w: 100, h: 100, d: 5}, // wall

        {collisionType: "box", x: -15, y: 0, z: -15, w: 30, h: 2, d: 30}, // central box

        {collisionType: "box", x: -30, y: 3, z: -1.75, w: 20, h: 3, d: 3}, // long side box
        {collisionType: "box", x: -31, y: 0, z: -2.5, w: 5, h: 3, d: 5}, // big support for long side box
        {collisionType: "box", x: -14, y: 2, z: -2.5, w: 5, h: 1, d: 5}, // little support for long side box

        {collisionType: "box", x: -1.75, y: 2, z: -1.75, w: 3.5, h: 3.5, d: 3.5}, // tall box in middle
        {collisionType: "box", x: -1, y: 5.5, z: -1, w: 2, h: 2, d: 2}, // little box on tall box in middle

        {collisionType: "plane", y: 0, h: 0, size: 100} // ground
    ]
}
function blockyObstacles() {
    let tower = [
        {collisionType: "box", x: 10, y: 0, z: 15, w: 27, h: 3, d: 27}, // big bottom box
        {collisionType: "box", x: 14.5, y: 3, z: 19.5, w: 18, h: 1, d: 18}, // medium middle box
        {collisionType: "box", x: 20.5, y: 4, z: 25.5, w: 6, h: 0.25, d: 6}, // small top box
    ]
    let bridge = [
        {collisionType: "box", x: -50, y: 0, z: 7.5, w: 15, h: 2, d: 5}, // box segment
        {collisionType: "box", x: -30, y: 0, z: 7.5, w: 15, h: 2, d: 5}, // box segment
        {collisionType: "box", x: -10, y: 0, z: 7.5, w: 15, h: 2, d: 5}, // box segment
        {collisionType: "box", x: 10, y: 0, z: 7.5, w: 15, h: 2, d: 5}, // box segment
        {collisionType: "box", x: 30, y: 0, z: 7.5, w: 15, h: 2, d: 5}, // box segment
    ]
    let midBridge = [
        {collisionType: "box", x: -45, y: 0, z: -2.5, w: 15, h: 2.5, d: 5}, // box segment
        {collisionType: "box", x: -25, y: 0, z: -2.5, w: 15, h: 2.5, d: 5}, // box segment
        {collisionType: "box", x: -5, y: 0, z: -2.5, w: 15, h: 2.5, d: 5}, // box segment
        {collisionType: "box", x: 15, y: 0, z: -2.5, w: 15, h: 2.5, d: 5}, // box segment
        {collisionType: "box", x: 35, y: 0, z: -2.5, w: 15, h: 2.5, d: 5}, // box segment
    ]
    let basicObstacles =  [
        {collisionType: "box", x: -55, y: 0, z: -50, w: 5, h: 100, d: 100}, //wall 
        {collisionType: "box", x: 50, y: 0, z: -50, w: 5, h: 100, d: 100}, // wall
        {collisionType: "box", x: -50, y: 0, z: 50, w: 100, h: 100, d: 5}, // wall
        {collisionType: "box", x: -50, y: 0, z: -55, w: 100, h: 100, d: 5}, // wall
        {collisionType: "plane", y: 0, h: 0, size: 100} // ground
    ]
    let bridges = bridge.concat(flipWalls(bridge, "z", "d"), midBridge);
    let towers = tower.concat(flipWalls(tower, "x", "w"), flipWalls(tower, "z", "d"), flipWalls(flipWalls(tower, "x", "w"), "z", "d"));
    return basicObstacles.concat(bridges, towers);
}

function blockyPositions() {
    return {
        rebellion: [
            {x: -5, y: 2, z: 20, rot: 180},
            {x: 5, y: 2, z: 20, rot: 180},
            {x: 0, y: 2, z: 20, rot: 180},
            {x: -5, y: 2, z: 25, rot: 180},
            {x: 5, y: 2, z: 25, rot: 180} ],

        empire: [
            {x: -5, y: 2, z: -20, rot: 0}, 
            {x: 5, y: 2, z: -20, rot: 0}, 
            {x: 0, y: 2, z: -20, rot: 0},
            {x: -5, y: 2, z: -25, rot: 0},
            {x: 5, y: 2, z: -25, rot: 0}, ]
    };
}

function randomizePositions(troopers, allPositions) {
    let positions = [];
    for(var i = 0; i < troopers.length; i ++) {
        if(troopers[i].af == "Rebellion") {
            let index = Math.floor(Math.random() * allPositions.rebellion.length);
            positions.push(allPositions.rebellion[index]);
            allPositions.rebellion.splice(i, 1);
        } else {
            let index = Math.floor(Math.random() * allPositions.empire.length);
            positions.push(allPositions.empire[index]);
            allPositions.rebellion.splice(i, 1);
        }
    }
    return positions;
}

function defaultPositions() {
    return {
        rebellion: [
            {x: -5, y: 2, z: 10, rot: 180},
            {x: 5, y: 2, z: 10, rot: 180},
            {x: 0, y: 2, z: 10, rot: 180},
            {x: -10, y: 2, z: 10, rot: 180},
            {x: 10, y: 2, z: 10, rot: 180} ],

        empire: [
            {x: -5, y: 2, z: -10, rot: 0}, 
            {x: 5, y: 2, z: -10, rot: 0}, 
            {x: 0, y: 2, z: -10, rot: 0},
            {x: -10, y: 2, z: -10, rot: 0},
            {x: 10, y: 2, z: -10, rot: 0}, ]
    };
}


function mazeObstacles() {
    let mazeWalls = [
        {collisionType: "box", x: 0, y: 0, z: 35, w: 25, h: 10, d: 10},
        {collisionType: "box", x: 35, y: 0, z: 25, w: 10, h: 10, d: 20},
        {collisionType: "box", x: 45, y: 0, z: 25, w: 5, h: 10, d: 5},
        {collisionType: "box", x: 25, y: 0, z: 15, w: 5, h: 10, d: 15},
        {collisionType: "box", x: 15, y: 0, z: 20, w: 5, h: 10, d: 10}, //d
        {collisionType: "box", x: 0, y: 0, z: 20, w: 15, h: 10, d: 5}, //e
        {collisionType: "box", x: 10, y: 0, z: 5, w: 5, h: 10, d: 15}, 
        {collisionType: "box", x: 17.5, y: 0, z: 10, w: 7.5, h: 10, d: 5}, //g
        {collisionType: "box", x: 25, y: 0, z: 0, w: 5, h: 10, d: 15},
        {collisionType: "box", x: 30, y: 0, z: 15, w: 15, h: 10, d: 5},
        {collisionType: "box", x: 40, y: 0, z: 10, w: 5, h: 10, d: 5},
    ]
    let allMazeWalls = mazeWalls.concat(flipWalls(mazeWalls, "x", "w"), flipWalls(mazeWalls, "z", "d"), flipWalls(flipWalls(mazeWalls, "x", "w"), "z", "d"));
    return [
        {collisionType: "box", x: -55, y: 0, z: -50, w: 5, h: 100, d: 100}, //wall
        {collisionType: "box", x: 50, y: 0, z: -50, w: 5, h: 100, d: 100}, // wall
        {collisionType: "box", x: -50, y: 0, z: 50, w: 100, h: 100, d: 5}, // wall
        {collisionType: "box", x: -50, y: 0, z: -55, w: 100, h: 100, d: 5}, // wall
        {collisionType: "plane", y: 0, h: 0, size: 100} // ground
    ].concat(allMazeWalls);
}
function flipWalls(mazeWalls, pos, dim) {
    let newWalls = JSON.parse(JSON.stringify(mazeWalls));
    for(var i = 0; i < mazeWalls.length; i ++) {
        newWalls[i][pos] = newWalls[i][pos] * -1 - newWalls[i][dim]
    }
    return newWalls;
}
function mazePositions() {
    return {
        rebellion: [
            {x: -5, y: 0, z: 45, rot: 90},
            {x: 5, y: 0, z: 45, rot: 90},
            {x: 0, y: 0, z: 45, rot: 90},
            {x: -10, y: 0, z: 45, rot: 90},
            {x: 10, y: 0, z: 45, rot: 90} ],

        empire: [
            {x: -5, y: 0, z: -45, rot: -90}, 
            {x: 5, y: 0, z: -45, rot: -90}, 
            {x: 0, y: 0, z: -45, rot: -90},
            {x: -10, y: 0, z: -45, rot: -90},
            {x: 10, y: 0, z: -45, rot: -90}, ]
    };
}

function setPositions(positions, troopers) {
    for(var j = 0; j < troopers.length; j ++) {
        troopers[j].x = positions[j].x;
        troopers[j].y = positions[j].y;
        troopers[j].z = positions[j].z;
        troopers[j].rot = positions[j].rot;
    }
}