var redirected = false;
function createWebSocket(type, data) {
    ws = new WebSocket('wss://thunderwarrior.org/443');
    var openDate = new Date();
    ws.onopen = () => {
        openWS();
    }
    ws.onerror = (e) => {
        errorWS(e);
    }
    ws.onmessage = (msg) =>{
        messageWS(msg.data, openDate, type, data);
    }
    ws.onclose = (e) => {
        closeWS(e);
    }
}

function openWS() {

}

function errorWS(e) {
    console.error("Websocket Error: ERROR CODE 654 928 - ", e)
}

function messageWS(msg, openDate, wsType, data) {
    msg = JSON.parse(msg);
    if(checkMessage(msg, openDate) == true ){
        recieveAnyMessage(msg, wsType, data);
    }
}

function closeWS(e) {
    console.log("websocket closed", e);
    totalRedirect('disconnection');
}

function checkMessage(msg, openDate) {
    if(ws.ticket == undefined) {
        if(msg.type == "key" && getSecondsDiference(openDate.getTime(), msg.text.date, 30) && msg.text.key == "iuytcvbnzawplvgbhkjnlkuhygbhkjnlkiuhkbjnlkaqzsx") {
            ws.ticket = msg.text;
            send("key", {key: "vghjkblnhuygvhkbjlnkiuhtygufvgjhkbnluhygtuvhkbjnuy", time: openDate.getTime(), username: username, password: password});
        } else {
            console.log("CLOSED FOR UNSAFE CONNECTION");
            ws.close(1000, "unsafe connection");
            window.opener = self;
            return;
        }
    } else {
        return true
    }
}

function getSecondsDiference(t1, t2, d) {
    return (Math.abs(t1 - t2) / 1000) < d;
}

function recieveAnyMessage(msg, wsType, data) {
    if(msg.type == "log") {
        console.log("message:" + msg.text, msg);
    } else if(msg.type == "confirmation") {
        sendAccount(wsType, data);
    } else if(msg.type == "game error") {
        totalRedirect(msg.text);
    } else if(msg.type == 'user') {
        loadAll(msg.text.user, msg.text.options, msg.text);
    } else {
        recieveMessage(msg);
    }
}

function sendAccount(wsType, data) {
    send('account', {username: username, password: password, signOutOther: signOutOther, type: wsType, data: data});
}

function totalRedirect(url, urlFull) {
    if(redirected) return;
    redirected = true;
    if(window.opener != undefined && window.opener != window.self) {
        if(url != undefined) {
            window.opener.location.replace(pageLocation + "/" + url); 
        } else {
            window.opener.location.replace(urlFull); 
        }
        window.close();
    } else if(window.parent != undefined && window.parent != window.self){
        if(url != undefined) {
            window.parent.location.replace(pageLocation + "/" + url); 
        } else {
            window.parent.location.replace(urlFull);
        }
        window.close();
    } else {
        if(url != undefined) {
            if(url == "disconnection") url = "disconnectionRedirect";
            window.location.replace(pageLocation + "/" + url);
        } else {
            window.location.replace(urlFull);
        }
    }
}

function send(type, text) {
    ws.send(JSON.stringify({type: type, text: text, ticket: { key1: "vghjkblnhuygvhkbjlnkiuhtygufvgjhkbnluhygtuvhkbjnuy", key2: "iuytcvbnzawplvgbhkjnlkuhygbhkjnlkiuhkbjnlkaqzsx"}}));
}

function showLoadingScreen() {
    document.getElementById("loadingPage").style.visibility = "visible";
    document.getElementById("loadingPage").children[0].classList.add('loadingIcon');
}

function hideLoadingScreen() {
    document.getElementById("loadingPage").style.visibility = "hidden";
    document.getElementById("loadingPage").children[0].classList.remove('loadingIcon');
    document.getElementById("loadingPage").children[1].classList.remove('loadingIconSmall');
}

function joinGame(gameData, nextGame) {
    sessionStorage.setItem("gameData", JSON.stringify(gameData));
    sessionStorage.setItem("rejoin", "false");
    sessionStorage.setItem("nextGame", nextGame);
    document.getElementById("startForm").submit();
}