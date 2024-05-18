'use strict'
const Trooper = require('./Trooper');
const CollisionDetection = require('./CollisionDetection');
module.exports = NEW_GAME;
function NEW_GAME(game, w, wss, terminateGame, finishGame) {
    let lastTime;
    const troopers = [];
    const obstacles = game.map.obstacles;
    const projectiles = [];
    const startTime = Date.now();
    let fps = 20;
    var winner;
    const room = game.roomName;
    const CD = new CollisionDetection(obstacles, troopers);
    var gameLoop;
    const maxMinutes = 15;
    this.newInput = (input, username) => {
        getTrooper(username).input(input);
    }
    this.disconnect = (username) => {
        for(var i = 0; i < troopers.length; i ++) {
            if(troopers[i].username == username) {
                troopers[i].connected = false;
            }
        }
    }
    this.check = (username) => {
        if(winner != undefined) return false;
        for(var i = 0; i < troopers.length; i ++) {
            if(troopers[i].username == username) {
                if(troopers[i].alive) {
                    let count = countAffiliation(username);
                    return count.connected > 0;
                } else {
                    return false;
                }
            }
        }
        return false;
    }
    this.rejoin = (username) => {
        for(var i = 0; i < troopers.length; i ++) {
            if(troopers[i].username == username) {
                troopers[i].connected = true;
            }
        }
    }

    initiate(game);

    function countAffiliation(exclude = "") {
        let rebellionAlive = false;
        let empireAlive = false;
        var connected = 0;
        for(var i = 0; i < troopers.length; i ++) {
            if(troopers[i].connected && troopers[i].username != exclude) {
                connected ++;
            }
            if(troopers[i].alive == true && troopers[i].username != exclude) {
                if(troopers[i].af == "Rebellion") {
                    rebellionAlive = true;
                } else {
                    empireAlive = true;
                }
            }
        }
        return {rebellion: rebellionAlive, empire: empireAlive, connected: connected};
    }
    function initiate(game) {
        buildTroopers(game);
        setTimeout(startGame, 3000)

    }
    function startGame() {
        lastTime = Date.now();
        w.sendToRooms(room, wss.clients, 'create game');
        gameLoop = setInterval(update, 1000/fps);
    }

    function buildTroopers(game) {
        for(var i = 0; i < game.troopers.length; i ++) {
            troopers.push(new Trooper(game.troopers[i], game.map.positions[i], obstacles, projectiles, CD));
        }
    }
    function update() {
        try {
            let dt = setDeltaTime();
            if(dt == 0) return;
            updateGame(dt);
            checkWin();
            sendUpdate();
        } catch(err) {
            console.log("err", err);
        }
    }
    function setDeltaTime() {
        let newTime = Date.now();
        let dt = (newTime - lastTime) / 1000;
        lastTime = newTime;
        return Math.min(1, dt);
    }
    function updateGame(dt) {
        for(var i = 0; i < troopers.length; i ++) {
            troopers[i].prepare(dt);
        }
        for(var i = 0; i < troopers.length; i ++) {
            troopers[i].update();
        }
        for(var i = projectiles.length - 1; i >= 0; i --) {
            if(projectiles[i].update(dt, CD)) {
                projectiles.splice(i, 1);
            }            
        }
        for(var i = 0; i < troopers.length; i ++) {
            troopers[i].reset();
        }
    }
    function checkWin() {
        let count = countAffiliation();
        if(!count.rebellion && troopers.length > 1) {
            gameOver("Empire");
        } else if(!count.empire && troopers.length > 1) {
            gameOver("Rebellion");
        }
        if(count.connected <= 0 || (Date.now() - startTime) > maxMinutes * 60000) endGame();
    }
    function endGame() {
        clearInterval(gameLoop);
        terminateGame(game.roomName);
    }
    function gameOver(af) {
        if (winner != undefined) return;
        for(var i = 0; i < troopers.length; i ++) {
            troopers[i].setWinner(af);
        }
        winner = af;
        finishGame(game.roomName, winner);
    }
    function sendUpdate() {
        let trooperData = [];
        let projectileData = [];
        for(var i = 0; i < troopers.length; i ++) {
            trooperData.push(troopers[i].data);
        }
        for(var i = 0; i < projectiles.length; i ++) {
            projectileData.push(projectiles[i].data);
        }
        w.sendToRooms(room, wss.clients, "update", {
            troopers: trooperData,
            projectiles: projectileData,
        });
    }
    function getTrooper(username) {
        return troopers[troopers.findIndex(trooper => trooper.username == username)];
    }
}