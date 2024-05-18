/*  targets - array of targets to send to
            - usually wss.clients
    msg - msg
    ws include ws if you wasnt the broadcast to exclude the one websocket
*/
exports.send = (ws, type, text) => {
    ws.send(JSON.stringify({type: type, text: text}))
}
exports.broadcast = (targets, type, text,  ws) => {
    targets.forEach(function each(client) {
        if (client.readyState === 1 && client != ws) {
            exports.send(client, type, text)
        }
    });
}
exports.joinRoom = (ws, room) => {
    for(var i = 0; i < ws.rooms.length; i++) {
        if(ws.rooms[i] == room) {
            return
        }
    }
    ws.rooms.push(room);
}
exports.inRoom = (ws, room) => {
    for(var i = 0; i < ws.rooms.length; i++) {
        if(ws.rooms[i] == room) {
            return true;
        }
    }
    return false;
}

/*  room - the room to send to
    targets - array of targets to send to
            - usually wss.clients
    msg - msg
*/

exports.sendToRooms = (room, targets, type, text) => {
    targets.forEach(function each(client) {
        for (let cRoom of client.rooms) {
            if(cRoom == room) {
                exports.send(client, type, text);
                break;
            }
        };
    });
}
exports.leaveRoom = (ws, room) => {
    for(var i = 0; i < ws.rooms.length; i ++) {
        if(ws.rooms[i] == room) {
            ws.rooms.splice(i, 1);
        }
    }
}
exports.startPing = (ws) => {
    var pingTime;
    var pinging = true;
    ws.pingInterval = setInterval(function ping() {
        if(pinging == false) {
            console.log("terminated from not recieving pong within 5 minutes");
            clearInterval(ws.pingInterval);
            ws.terminate();
            return;
        }
        pingTime = new Date();
        pinging = false;
        ws.ping();
    }, 300000);
    ws.on('pong', function(data) {
        pinging = true;
        ws.latency = (new Date().getTime() - pingTime.getTime());
    });
}
exports.checkMessage = (ws, msg) => {
    var clientKey = "vghjkblnhuygvhkbjlnkiuhtygufvgjhkbnluhygtuvhkbjnuy"
    if(ws.canConnect == undefined) {
        if(msg.type == "key" && msg.text.key == clientKey && Math.abs(msg.text.time - ws.connectionTime) / 1000 < 10) {
            ws.canConnect = true;
        } else {
            return false;
        }
    } else if(ws.canConnect == true && msg.ticket.key2 == ws.ticket.key && msg.ticket.key1 == clientKey){
        return true;
    } else {
        return false;
    }
}