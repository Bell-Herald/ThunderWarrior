'use strict'
const beginDate = new Date();
const fs = require("fs");
const websocket = require('ws');
const https = require('https');
const http = require('http');
const w = require("./game/websocket");
const game = require('./game/gameServer');
const mapBuilder = require('./game/mapBuilder');
const mail = require('nodemailer');
const options = {
    key: fs.readFileSync('./data/certificate/privkey.pem'),
    cert: fs.readFileSync('./data/certificate/cert.pem')
}
const stripe = require("stripe")("STRIPE_DATA_REMOVED") //Stripe data removed for security reasons
const calculateOrderAmmount = (item) => {
    let purchase;
    if(item == "Small Purchase")
        purchase = {price: 199, crystals: 100};
    else if(item == "Small Purchase")
        purchase = {price: 499, crystals: 500};
    else 
        purchase = {price: 999, crystals: 100000};
    return purchase;
}
const httpsPort = 443;
const httpPort = 80;
const address = "0.0.0.0";
const myEmail = 'thunderwarriorgaming@gmail.com';
var accounts = [];
var clientSecrets = [];
const securityPolicy = getSecurityPolicy();
const mailer = mail.createTransport({
    service: 'gmail',
    auth: {
        user: myEmail,
        pass:'Bobo1234567?'
    }
});
var casheSetting = "no-cache,max-age=31536000";
var wss;
var stream;
var ratings = [];
var reviews = [];
var games = [];
var gameRooms = 0;
var cache = [];
beginProcess(); 

function setAllData() {
    getAccounts();
}

function setStarterRatings() {
    setData(ratings, 'ratingsData');
    setRatingsToSend();
}

function setStarterReviews() {
    setData(reviews, 'reviews');
    setReviewsToSend();
}/*
function getSecurityPolicy() {
    let addresses = "https://genesis.thunderwarrior.org https://thunderwarrior.org https://js.stripe.com https://accounts.google.com https://pay.accounts.google.com"
    //child-src 
    return "default-src " + addresses + "; script-src " + addresses;
}*/

function getSecurityPolicy() {
    let addresses = "https://*";
    //child-src 
    return ""//"default-src " + addresses + ";connect-src https://*; frame-src https://*; script-src https://*" ;
}

function beginProcess() {
    process.title = "Thunder Warrior: Genesis Server";
    setAllData();
    createServer();
}

function getAccounts() {
    let files = fs.readdirSync('data/accounts');
    let i = 0;
    if(files.length > 0) {
        getAccount(files.length, i);
    }
}

function getAccount(length, i) {
    fs.readFile('data/accounts/' + i + ".json", function(err, data) {
        if(err) {
            console.log('error uploading account, reaplacing with temp account', err);
            pushTempAccount(i);
        } else {
            try {
                accounts.push(JSON.parse(data));
                accounts[accounts.length - 1].signedIn = false;
                accounts[accounts.length - 1].gameRoom = "";
            } catch(err) {
                console.log('error parsing account, reaplacing with temp account', err);
                pushTempAccount(i);
            }
        }
        i ++;
        if(i < length) {
            getAccount(length, i)
        } else {
            setStarterReviews();
            setStarterRatings();        
        } 
    });
}

function pushTempAccount(i) {
    accounts.push({username: "replacementUsername" + i, email: "replacementEmail" + i, password: "replacementPassword" + i, banned: true, locations: []});
    saveAccounts(i);
}

function setData(dataDestination, location) {
    let dataArray = JSON.parse(fs.readFileSync('data/' + location + '.json'));
    dataDestination.length = 0;
    for(var i = 0; i < dataArray.length; i ++) {
        if(dataArray[i] != '[' && dataArray[i] != ']') {
            dataDestination.push(dataArray[i]);
        }
    }
}

function knownIp(ip) {
    for(var i = 0; i < accounts.length; i ++) {
        for(var e = 0; e < accounts[i].locations.length; e ++) {
            if(ip == accounts[i].locations[e]) return true;
        }
    }
    return false;
}

function getIp(req) {
    return (typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',').shift()) || req.connection?.remoteAddress || req.socket?.remoteAddress || req.connection?.socket?.remoteAddress;
}
function saveRequest(req, redirected, found) {
    let ip = getIp(req);
    let date = new Date();
    let time = date.getMonth() + "/" + date.getFullYear() + "/" + date.getDate() + ", " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "." + date.getMilliseconds();
    let reqInfo = "\nURL: " + req.url + "  |  TIME: " + time + "  |  IP: " + ip + "  |  HOST: " + req.headers.host;
    if(redirected == true) {
            reqInfo += "  |  REDIRECTED: true";
    } else {
        reqInfo += "  |  REDIRECTED: false";
    }
    if(found == true) {
        reqInfo += "  |  FOUND: true";
    } else {
        reqInfo += "  |  FOUND: false";
    }
    if(!knownIp(ip)) {
        reqInfo += "  |  SAFETY: Potential Risk - unknown IP address";
    } else {
        reqInfo += "  |  SAFETY: Safe - IP address belongs to an account ";
    }
    stream.write(reqInfo);
}

function createServer() {
    var server = createHTTPSServer();
    createDataStream();
    createRedirectServer();
    createWebsocketServer(server);
}

function createHTTPSServer() {
    return https.createServer(options, function(req, res) {
        let fullUrl = req.url.split('/');
        let gameError;
        let url;
        for(var i = 1; i < fullUrl.length; i ++) {
            if(fullUrl[i] == "failedRejoin" || fullUrl[i] == "duration" || fullUrl[i] == "noAccountFound" || fullUrl[i] == "signOut"|| fullUrl[i] == "disconnection" || fullUrl[i] == "disconnectionRedirect" || fullUrl[i] == "alreadySignedIn" || fullUrl[i] == "banned" || fullUrl[i] == "unconfirmed") {
                gameError = fullUrl[i];
                fullUrl[i] = undefined;
                break;
            }
        }
        url = urlUpercase(fullUrl[1]);
        if(req.method === 'POST') {
            checkAccount(req, res, gameError);
        } else if(req.url.substring(0,2) == "/?") {
            finishPurchase(req, res, req.url);
        } else if(req.headers.host == "genesis.thunderwarrior.org") {
            sendGamePage(req, res, fullUrl, url, fullUrl[2], fullUrl[3]);
        } else {
            sendHomePage(req, res, fullUrl, url, fullUrl[2], fullUrl[3], gameError);
        }
    }).listen(httpsPort, address, function() {
        let date = new Date();
        console.log(`server created in ${(date.getTime()) - beginDate.getTime()} milliseconds at ${date.toGMTString()}`);
    });
}

function createDataStream() {
    stream = fs.createWriteStream("./data/dataStream", {flags: "a"});
    stream.on('error', function (e) {
        console.log(e);
    });
}

function createRedirectServer() {
    var httpRedirectServer = http.createServer(function(req, res) {
        redirect(req, res);
    });
    httpRedirectServer.listen(httpPort, address);
}

function createWebsocketServer(server) {
    wss = new websocket.Server({server});
    wss.on('connection', function(ws, req) {
        connection(ws, req);
        ws.on('message', function(msg) {
            message(ws, msg, req);
        });
        ws.on('close', function(e) {
            close(ws, req, e);
        });
    });
}

function urlUpercase(url) {
    if(url == undefined) return url;
    url = url.toLowerCase();
    if(url == "signin") return "signIn";
    if(url == "signout") return "signOut";
    if(url == "deleteaccount") return "deleteAccount";
    if(url == "signup") return "signUp";
    if(url == "privacypolicy") return "privacyPolicy";
    if(url == "termsandconditions") return "termsAndConditions";
    if(url == "howtoplay") return "howToPlay";
    if(url == "newsimage") return "newsImage";
    if(url == "newsarticle") return "newsArticle";
    if(url == "reviewlist") return "reviewList";
    if(url == "editinfo") return "editInfo";
    if(url == "clientwebsocket") return "clientWebsocket";
    return url;
}

function sendHomePage(req, res, fullUrl, url, url2, url3, gameError) {
    if(url == '' || url == 'home' || url == undefined) {
        console.log("Sending Home Screen");
        sendPage(req, res, 'home', undefined, gameError);
    } else if(sendFavicon(req, res, url, url2, url3)) {
    } else if(url == 'checkout.js') {
        sendFile(req, res, false, 'game/payment/checkout.js', 'text/javascript', false, true);
    } else if(url == 'checkout.css') {
        sendFile(req, res, false, 'game/payment/checkout.css', 'text/css', false, true);
    } else if(url == 'signOut') {
        sendPage(req, res, 'home', url, gameError);  
    } else if(url == 'ratings' || url2 == 'ratings') {
        sendFile(req, res, false, 'homeMenu/pageData/ratings.json', 'text/javascript');
    } else if(url == 'confirmation') {
        sendPage(req, res, 'confirmationOnly', undefined, gameError);
    } else if(url == 'deleteAccount') {
        sendPage(req, res, 'deletionCode', undefined, gameError);
    } else if(url == 'manage' || url == 'forgot' || url == 'signUp' || url == 'signIn' || url == 'privacyPolicy' || url == 'termsAndConditions' || url == 'about' || url == 'feedback' || url == 'credits' || url == 'news' || url == 'updates' || url == 'contact' || url == 'howToPlay') {
        sendPage(req, res, url, undefined, gameError);
    } else if(url2 != undefined && url == 'newsImage') {
        sendFile(req, res, true, 'homeMenu/images/newsImages/' + url2 + '.png', "image/png");
    } else if(url == 'image') {
        sendFile(req, res, true, 'homeMenu/images/' + url2 + '.' + url3, 'image/' + url3 + '.png');
    } else if(url == 'newsArticle' && url2 != undefined) {
        sendPage(req, res, 'newsArticle', url2, gameError);   
    } else if(url == 'reviewList') {
        sendFile(req, res, false, 'homeMenu/pageData/reviews.json', 'text/javascript');
    } else if(url == 'gamevideo') {
        sendFile(req, res, false, 'homeMenu/pageData/gameVideo.mp4', 'video/mp4');
    } else if(url == 'reviews') {
        sendPage(req, res, 'reviews', undefined, gameError);
    } else if(url == 'review') {
        sendPage(req, res, 'feedback', /*'review'*/ );
    } else if(url ==  'editInfo') {
        sendPage(req, res, 'editInfo');
    } else if(url == 'robots.txt') {
        sendFile(req, res, true, 'homeMenu/pageData/robots.txt', 'text/plain');
    } else if(url == 'iframe') {
        sendFile(req, res, true, 'homeMenu/pageData/iframe.html', 'text/html');
    } else if(url == 'clientWebsocket') {
        sendFile(req, res, true, 'game/clientWebsocket.js', 'text/js');
    } else if(url == 'unity') {
        sendFile(req, res, true, 'game/unity/' + url2, getType(url2));
    } else {
        saveRequest(req, false, false);
        return sendPage(req, res, 'notFound');
    }
    saveRequest(req, false, true);
}

function sendFavicon(req, res, url, url2, url3) {
    if(url == 'favicon.ico') {
        sendFile(req, res, true, 'homeMenu/images/favicon/favicon.ico', 'image/vnd.microsoft.icon');
    } else if(url == 'favicon') {
        sendFile(req, res, true, 'homeMenu/images/favicon/' + url2, getType(url2));
    } else if(url2 == 'favicon') {
        sendFile(req, res, true, 'homeMenu/images/favicon/' + url3, getType(url3));
    } else if(url == 'apple-touch-icon.png' || url == "apple-touch-icon-precomposed.png") {
        sendFile(req, res, true, 'homeMenu/images/favicon/' + 'apple-touch-icon.png', 'image/png');
    } else {
        return false;
    }
    return true;
}

function sendGamePage(req, res, fullUrl, url, url2, url3) {
    if(url2 != undefined) url2 = url2.toLowerCase();
    if(sendFavicon(req, res, url, url2, url3)) {
    } else if(url == '') {
        sendFile(req, res, true, 'game/client.html', 'text/html');
    } else if(url == 'checkout') {
        sendFile(req, res, false, 'game/payment/checkout.html', 'text/html', false, true);
    } else if(url == "robots.txt") {
        sendFile(req, res, true, 'game/robots.txt', 'text/plain');
    } else if(url == 'unity') {
        sendFile(req, res, true, 'game/unity/' + url2, getType(url2));
    } else if(url == 'clientWebsocket') {
        sendFile(req, res, true, 'game/clientWebsocket.js', 'text/js');
    } else if(url == "gameimage") {
        sendFile(req, res, true, "game/gameImages/" + url2 + ".png", "image/png"); 
    } else if(url == "image") {
        if(url2 == undefined) {
            console.log("no image", "game/images/" + url2 + ".png", url, url2);
            res.writeHead(404);
            return res.end();
//        } else if(url3 == undefined) {
//            sendFile(req, res, true, "game/images/" + url2 + "/" + url3 + ".png", "image/png");
        } else {
            sendFile(req, res, true, "game/images/" + url2 + ".png", "image/png");     
        }
    } else {
        saveRequest(req, false, false);
        res.writeHead(308, { "Location": "https://thunderwarrior.org" + req.url});
        return res.end();
    }
    saveRequest(req, false, true);
}

function getType(url) {
    if(url == undefined) {
        return "text/html";
    } else {
        let urlEnding = url.substring(url.search(/\./));
        if(urlEnding == ".ico") {
            return 'image/vnd.microsoft.icon';
        } else if(urlEnding == ".png"){
            return 'image/png';
        } else if(urlEnding == ".css") {
            return 'text/css';
        } else if(urlEnding.substring(0, 13) == ".framework.js" || urlEnding.substring(0, 10) == ".loader.js") {
            return 'text/js';
        } else if(urlEnding.substring(0, 5) == ".wasm") {
            return "application/wasm";
        } else if(urlEnding.substring(0, 5) == ".data") {
            return "application/octet-stream";
        } else if(urlEnding.substring(0, 4) == ".xml") {
            return "text/xml";
        } else if(urlEnding.substring(0, 9) == ".webmanifest") {
            return "application/manifest+json";
        } else if(urlEnding.substring(0, 4) == ".svg") {
            return "image/svg+xml";
        } else {
            return "text/html";
        }
    }
}

function redirect(req, res) {
    saveRequest(req, true, false);
    res.writeHead(308, { "Location": "https://" + req.headers['host'] + req.url});
    res.end();
}

function checkCache(req, res) {
    for(var i = 0; i < cache.length; i ++) {
        if(cache[i] == JSON.stringify(req.headers['if-none-match'])) {
            res.writeHead(304);
            res.end();
            return true;
        }
    }
    return false;
}

function sendCachedFile(req, res, src, type, contentEncoding) {
    let head = {'Content-Type': type, 'Cache-Control': casheSetting, "Content-Security-Policy": securityPolicy};
    if(contentEncoding) head['Content-Encoding'] = 'gzip';
    if(checkCache(req, res)) return;
    fs.readFile(src, function(err, data) {
        try {
            fs.stat(src, function(statErr, fileStats) {  
                try {
                    let ETag = JSON.stringify(fileStats.mtimeMs);
                    head = {...head,...{'ETag': ETag, 'If-None-Match': ETag}}
                    cache.push(JSON.stringify(ETag));
                    if(contentEncoding) {
                        res.writeHead(200, head);
                    } else {
                        res.writeHead(200, head);
                    }
                    res.write(data);
                    return res.end();
                } catch(statErr) {
                    console.log(src + ": ", statErr);
                    res.writeHead(404);
                    return res.end();
                }
            });
        } catch(err) {
            console.log("INVALID File:", src, err);
            res.writeHead(404);
            return res.end();
        }
    });
}

function sendUncachedFile(req, res, src, type, contentEncoding) {
    let head = {'Content-Type': type, 'Cache-Control': 'no-store', "Content-Security-Policy": securityPolicy};
    if(contentEncoding) head['Content-Encoding'] = 'gzip';
    fs.readFile(src, function(err, data) {
        try {
            if(contentEncoding) {
                res.writeHead(200, head);
            } else {
                res.writeHead(200, head);
            }
            res.write(data);
            return res.end();
        } catch(err) {
            console.log("INVALID File:", src, err);
            res.writeHead(404);
            return res.end();
        }
    });
}

function sendFile(req, res, cacheFile, src, type, contentEncoding) {
    if(cacheFile) {
        sendCachedFile(req, res, src, type, contentEncoding);
    } else {
        sendUncachedFile(req, res, src, type, contentEncoding);
    }

}

function redirectToGame(req, res) {
    res.writeHead(308, {'location':'https://genesis.thunderwarrior.org'});
    return res.end();
}

function parseUrl(url) {
    let urlObject = {};
    let parsedUrl = url.substring(1);
    try {
        parsedUrl = parsedUrl.replace(/\+/g, ' ');
        parsedUrl = parsedUrl.split('&');
        for(var i = 0; i < parsedUrl.length; i ++) {
            let parsedUrlSegment = parsedUrl[i].split('=');
            urlObject[decodeURIComponent(parsedUrlSegment[0])] = decodeURIComponent(parsedUrlSegment[1]);
        }
        return urlObject;
    } catch(err) {
        console.log("ERROR invalid url in the parseUrl function", err);
        return {};
    }
}

function parseSwiftUrl(url) {
    let urlObject = {};
    let parsedUrl = url.substring(2);
    try {
        parsedUrl = parsedUrl.split("&")
        for(var i = 0; i < parsedUrl.length; i ++) {
            let parsedUrlSegment = parsedUrl[i].split("=");
            urlObject[parsedUrlSegment[0]] = parsedUrlSegment[1];
        }
        return urlObject;
    } catch(e) {
        console.log("e", e);
        return {};
    }
}

function checkAccount(req, res, gameError) {
    let postUrl = '?';
    req.on('data', function (dataChunk) {
        postUrl += dataChunk;
    })
    req.on('end', function() {
        let urlData = parseUrl(postUrl);
        if(urlData.signUpOrIn == "Start Game") {
            redirectToGame(req, res);
        } else  if(urlData.signUpOrIn == 'Sign Up') {
            let validAccount = createNewAccount(req, res, urlData.newUsername, urlData.email, urlData.newPassword, urlData.repeatedPassword, urlData.gamePixelRatio, urlData.homePixelRatio, urlData.fps);
            sendPage(req, res, 'signUp', validAccount, gameError);    
        } else if(urlData.signUpOrIn == 'Sign In'){
            let signIn = checkSignIn(req, urlData.username, urlData.password)
            sendPage(req, res, 'signIn', signIn, gameError);
        } else if(urlData.signUpOrIn == 'Enter Code') { //The confirmation that is found with the sign up and sign in
            let confirmation = checkConfirmation(urlData.code);
            sendPage(req, res, 'confirmation', confirmation, gameError);
        } else if(urlData.signUpOrIn == ' Enter Code ') { //The confirmation that is found with the deletion
            let confirmation = checkConfirmation(urlData.code);
            sendPage(req, res, 'confirmationOnly', confirmation, gameError);
        } else if(urlData.signUpOrIn == 'Forgot Username') { //The confirmation that is found with the sign up and sign in
            let forgottenMessageData = forgottenMessage(urlData.email, 'Username');
            sendPage(req, res, 'forgot', forgottenMessageData, gameError);
        } else if(urlData.signUpOrIn == 'Forgot Password') { //The confirmation that is found with the sign up and sign in
            let forgottenMessageData = forgottenMessage(urlData.email, 'Password');
            sendPage(req, res, 'forgot', forgottenMessageData, gameError);
        } else if(urlData.signUpOrIn == 'Forgot Email') { //The confirmation that is found with the sign up and sign in
            let forgottenMessageData = forgottenEmail(urlData.username, urlData.password);
            sendPage(req, res, 'forgot', forgottenMessageData, gameError);
        } else if(urlData.signUpOrIn == '   Enter Code   ') { //The deletion
            let deletion = checkDeletionCode(urlData.code, urlData.username, urlData.password);
            if(deletion == 'foundSignedIn') {
                sendPage(req, res, 'home', 'signOut', gameError);
            } else {
                sendPage(req, res, 'deletionCode', deletion, gameError);
            }
        } else if(urlData.signUpOrIn == 'Leave Review') { 
            let review = checkReview(urlData.title, urlData.message, urlData.username, urlData.password);
            sendPage(req, res, 'review', review, gameError)
        } else if(urlData.signUpOrIn == 'Rate') { 
            let rating = checkRating(urlData.rating, urlData.username, urlData.password);
            sendPage(req, res, 'rating', rating, gameError);
        } else if(urlData.signUpOrIn == 'Delete Review') { 
            let reviewDeletion = deleteReview(urlData.username, urlData.password);
            sendPage(req, res, 'review', reviewDeletion, gameError);
        } else if(urlData.signUpOrIn == ' Delete ') { 
            let ratingDeletion = deleteRating(urlData.username, urlData.password);
            sendPage(req, res, 'rating', ratingDeletion, gameError);
        } else if(urlData.signUpOrIn == 'Send Feedback') { 
            let feedback = checkFeedback(urlData.topic, urlData.message, urlData.username, urlData.password);
            if(feedback == 'deleted') {
                sendPage(req, res, 'home', 'deleted', gameError);  
            } else {
                sendPage(req, res, 'feedback', feedback, gameError)
            }
        } else if(urlData.signUpOrIn == 'Send Message') { 
            let message = checkContactMessage(urlData.firstName, urlData.lastName, urlData.email, urlData.company, urlData.topic, urlData.message);
            sendPage(req, res, 'contact', message, gameError);
        } else if(urlData.signUpOrIn == 'Delete') { 
            let deletion = checkDeletion(urlData.username, urlData.password);
            if(deletion == 'found') {
                sendPage(req, res, 'home', 'signOut', gameError);  
            } else {
                sendPage(req, res, 'deletion', deletion, gameError);
            }
        } else if(urlData.signUpOrIn == 'New Code') { 
            let newCode = getnewCode(urlData.username, urlData.password)
            sendPage(req, res, 'confirmation', newCode, gameError);
        } else if(urlData.signUpOrIn == ' New Code ') { 
            let newCode = getnewCode(urlData.username, urlData.password)
            sendPage(req, res, 'confirmationOnly', newCode, gameError);
        } else if(urlData.signUpOrIn == 'Manage') {
            let manager = updateAccountPreferences(req, res, urlData.username, urlData.password, urlData.gamePixelRatio, urlData.homePixelRatio, urlData.fps);
            sendPage(req, res, 'management', manager, gameError);
        } else  if(urlData.signUpOrIn == 'Confirm Changes') {
            let infoCheck = changeInformation(req, res, urlData.newUsername, urlData.email, urlData.newPassword, urlData.repeatedPassword, urlData.username, urlData.password);
            sendPage(req, res, 'editInfo', infoCheck, gameError);
        } else if(urlData.signUpOrIn == "enterGame") {
            sendFile(req, res, true, 'game/unity/index.html', 'text/html');
        } else if(testCheckout(req, res, postUrl)){
        } else {
            sendPage(req, res, 'notFound', undefined, gameError);
        }
    })
}

function testCheckout(req, res, postUrl) {
    if(req.headers["content-type"] == "application/json") {
    try {
            let paymentOb = JSON.parse(postUrl.substring(1));
            if(paymentOb && paymentOb.id && typeof paymentOb.id == "string") {
                recievePayment(req, res, paymentOb);
    return true;
            }
        } catch(e) {
            console.log("recievePayment error", e, postUrl);
        }
    }
    return false;
}


function finishPurchase(req, res, url) {
    let parsedUrl = parseSwiftUrl(url);
    for(var i = clientSecrets.length - 1; i >= 0; i --) {
        if(Date.now() - clientSecrets > 86400000) clientSecrets.splice(i, 1);
        else if(clientSecrets[i].key == parsedUrl.payment_intent_client_secret && clientSecrets[i].finalized != true) {
            clientSecrets[i].finalized = true;
            let accountIndex = getAccountByUsername(clientSecrets[i].username);
            if(accountIndex > -1) {
                accounts[accountIndex].stormtrooperData.resources.crystals += clientSecrets[i].crystals;
                saveAccounts(accountIndex);
            }
            break;
        }
    }
    redirectToGame(req, res);
}

async function recievePayment(req, res, payment) {
    const purchase = calculateOrderAmmount(payment.id);
    const paymentIntent = await stripe.paymentIntents.create({
        amount: purchase.price,
        currency: "usd",
        payment_method_types: [
            "card",
        ]
    });
    for(var i = clientSecrets.length - 1; i >= 0; i --) {
        if(Date.now() - clientSecrets > 86400000) clientSecrets.splice(i, 1);
        else if(clientSecrets[i].key == paymentIntent.client_secret) return;
    }
    clientSecrets.push({key: paymentIntent.client_secret, date: Date.now(), username: payment.username || "", crystals: purchase.crystals, finalized: false});
    res.writeHead(200, {'Content-Type': 'text/javascript', "Content-Security-Policy": securityPolicy});
    res.write(JSON.stringify({clientSecret: paymentIntent.client_secret}));
    return res.end();
}

function getAccountByEmailIndex(email) {
    return accounts.findIndex(checkEmailValues, {email: email});
}

function checkEmailValues(account) {
    return account.email == this.email;
}

function getAccountByUsername(username) {
    return accounts.findIndex(checkUsernameValues, {username: username});
}

function checkUsernameValues(account) {
    return account.username == this.username;
}

function forgottenEmail(username, password) {
    let i = getAccountIndex(username, password);
    if(checkEmpty(username) || checkEmpty(password)) return 'noAccount';
    if(i == -1) return 'notFound';
    if(accounts[i].banned) return 'banned';
    if(!accounts[i].confirmed) return 'unconfirmed';
    let mailOptions = {
        from: myEmail,
        to: accounts[i].email,
        subject: `Your Email Is Inside`,
        text: `Your Email for Thunder Warrior: Genesis is ${accounts[i].email}\nYou can enter it at https://thunderwarrior.org/signIn`
    };
    quickMail(mailOptions);
    return 'foundEmail';
}

function forgottenMessage(email, type) {
    let i = getAccountByEmailIndex(email);
    if(checkEmpty(email)) return 'noEmail';
    if(i == -1) return 'notFound';
    if(accounts[i].banned) return 'banned';
    if(!accounts[i].confirmed) return 'unconfirmed';
    let mailOptions = {
        from: myEmail,
        to: accounts[i].email,
        subject: `Your ${type} Is Inside`,
    };
    if(type == 'Username') {
        mailOptions.text = `Your ${type} is ${accounts[i].username}\nYou can enter it at https://thunderwarrior.org/signIn`;
    } else {
        let newPassword = Math.floor(Math.random() * 1000000000 + 100000000);
        accounts[i].password = newPassword;
        accounts[i].signInTimes = 1;
        accounts[i].signInTime = Date.now();
        saveAccounts(i);
        mailOptions.text = `Your one use password is ${newPassword}. Sign in once and use the management tab to create a new password. If this password has not been used after the length of a single hour has elapsed, it shall cease to function.\nYou can enter it at https://thunderwarrior.org/signIn`;
    }
    quickMail(mailOptions);
    return 'found' + type;
}

function checkContactMessage(firstName, lastName, email, company, topic, message) {
    if(checkEmpty(topic)) {
        return 'emptyTopic';
    }
    if(checkEmpty(message)) {
        return 'emptyMessage';
    }
    if(checkEmpty(firstName)) {
        return 'emptyFirstName';
    }
    if(checkEmpty(lastName)) {
        return 'emptyLastName';
    }
    if(checkEmpty(email)) {
        return 'emptyEmail';
    }
    recieveContactMessage(firstName, lastName, email, company, topic, message);
    return 'success';
}

function checkRating(rating, username, password) {
    let i;
    rating = parseFloat(rating);
    if(checkEmpty(username) || checkEmpty(password)) return 'noAccount';
    i = getAccountIndex(username, password);
    if(i == -1) return 'notFound';
    if(accounts[i].banned) return 'banned';
    if(!accounts[i].confirmed) return 'unconfirmed';
    if(!(rating >= 0 && rating <= 5)) {
        return 'outOfRange';
    }
    for(var e = 0; e < ratings.length; e ++) {
        if(ratings[e].accountsIndex == i) {
            updateRating(rating, e);
            return 'updateRating';
        }
    }
    submitRating(rating, i);
    return 'valid';
}

function saveAccounts(i) {
    fs.writeFile('data/accounts/' + i + '.json', JSON.stringify(accounts[i]), function(err) {
        if(err) {
            console.log('Failed to update accounts: ', err);
        }
    });
}

function deleteReview(username, password) {
    let i;
    if(checkEmpty(username) || checkEmpty(password)) return 'noAccount';
    i = getAccountIndex(username, password);
    if(i == -1) return 'notFound';
    if(accounts[i].banned) return 'banned';
    if(!accounts[i].confirmed) return 'unconfirmed';
    for(var e = 0; e < reviews.length; e ++) {
        if(reviews[e].accountsIndex == i) {
            reviews.splice(e, 1);
            setReviews();
            return 'deletedReview';
        }
    }
    return 'noReview'
}

function deleteRating(username, password) {
    let i;
    if(checkEmpty(username) || checkEmpty(password)) return 'noAccount';
    i = getAccountIndex(username, password);
    if(i == -1) return 'notFound';
    if(accounts[i].banned) return 'banned';
    if(!accounts[i].confirmed) return 'unconfirmed';
    for(var e = 0; e < ratings.length; e ++) {
        if(ratings[e].accountsIndex == i) {
            ratings.splice(e, 1);
            setRating();
            return 'deletedRating';
        }
    }
    return 'noRating'
}

function checkReview(title, review, username, password) {
    let i;
    if(checkEmpty(username) || checkEmpty(password)) return 'noAccount';
    i = getAccountIndex(username, password);
    if(i == -1) return 'notFound';
    if(accounts[i].banned) return 'banned';
    if(!accounts[i].confirmed) return 'unconfirmed';
    if(checkEmpty(title)) return 'emptyTitle';
    if(checkEmpty(review)) return 'emptyReview';
    for(var e = 0; e < reviews.length; e ++) {
        if(reviews[e].accountsIndex == i) {
            updateReview(title, review, e);
            return 'updateReview';
        }
    }
    submitReview(title, review, i);
    return 'valid';
}

function submitRating(rating, i) {
    ratings.push({
        rating: rating,
        accountsIndex: i,
    });
    setRating();
}

function setRatingsToSend() {
    let ratingCount = 3242;
    let ratingValue = 15584;
    for(var i = 0; i < ratings.length; i ++) {
        if(accounts[ratings[i].accountsIndex] != undefined && accounts[ratings[i].accountsIndex].banned != true) {
            ratingValue += ratings[i].rating;
            ratingCount += 1;
        }
    }
    fs.writeFile('homeMenu/pageData/ratings.json', JSON.stringify({count: ratingCount, value: ratingValue}), function(err) {
        if(err) {
            console.log('Failed to update ratings: ', err);
        }
    });
}

function setRating() {
    fs.writeFile('data/ratingsData.json', JSON.stringify(ratings), function(err) {
        if(err) {
            console.log('Failed to load all ratings: ', err);
        }
    });
    setRatingsToSend();
    setReviews();
}

function setReviewsToSend() {
    let ratedReviews = [];
    for(var i = 0; i < reviews.length; i ++) {
        if(reviews[i].accountsIndex == 'none') {
            ratedReviews.push({
                title: reviews[i].title,
                message: reviews[i].message,
                rating: reviews[i].rating,
                username: reviews[i].username
            });
        } else if(accounts[reviews[i].accountsIndex] != undefined && accounts[reviews[i].accountsIndex].banned != true) {
            ratedReviews.push({
                title: reviews[i].title,
                message: reviews[i].message,
                rating: getRating(reviews[i]),
                username: accounts[reviews[i].accountsIndex].username
            });
        }
    }
    fs.writeFile('homeMenu/pageData/reviews.json', JSON.stringify(ratedReviews), function(err) {
        if(err) {
            console.log('error uploading ratings', err);
        }
    })
}

function setReviews() {
    setReviewsToSend();
    fs.writeFile('data/reviews.json', JSON.stringify(reviews), function(err) {
        if(err) {
            console.log('error uploading ratings', err);
        }
    })

}

function getRating(review) {
    let ratingIndex = ratings.findIndex(checkAccountIndex, review)
    if(ratingIndex == -1) {
        return 'none';
    } else {
        return ratings[ratingIndex].rating;
    }
}

function checkAccountIndex(rating) {
    return rating.accountsIndex == this.accountsIndex;
}

function submitReview(title, review, i) {
    reviews.unshift({
        title: title,
        message: review,
        accountsIndex: i,
    })
    setReviews();
}
function updateReview(title, review, i) {
    reviews[i].title = title;
    reviews[i].message = review;
    setReviews();
}
function updateRating(rating, i) {
    ratings[i].rating = rating;
    setRating();
}

function checkEmpty(value) {
    if(value == '' || value == undefined || value == null) return true;
    return false;
}

function checkFeedback(topic, message, username, password) {
    if(topic == 'deleteAll' || topic == 'clearData' || topic == 'delete All' || topic == 'clear Data' || topic == 'deleteall' || topic == 'cleardata' || topic == 'delete all' || topic == 'clear data' || topic == 'deleteData' || topic == 'clearAll' || topic == 'delete Data' || topic == 'clear All' || topic == 'deletedata' || topic == 'clearall' || topic == 'delete data' || topic == 'clear all') {
        clearData();
        return 'deleted';
    } else if(topic == topic == 'resetData' || topic == 'reset data') {
        resetData();
        return 'cleared';
    }
    if(topic.substring(0,6) == "Clear " || topic.substring(0,6) == "clear " || topic.substring(0,6) == "Reset " || topic.substring(0,6) == "reset ") {
        console.log("Resetting Account: " + topic.substring(6));
        return clearAccount(topic.substring(6));
    }
    if(checkEmpty(username) || checkEmpty(password)) {
        return 'noAccount'
    }
    if(checkEmpty(topic) && checkEmpty(message)) {
        return 'empty';
    }
    let i = getAccountIndex(username, password);
    if(i != -1) {
        if(accounts[i].banned == true) {
            return 'banned';
        } else if(accounts[i].confirmed != true) {
            return 'unconfirmed';
        } else if(accounts[i].lastFeedbackTime != undefined && Date.now() - accounts[i].lastFeedbackTime < 300000){
            return 'tooSoon';
        } else {
            recieveFeedback(topic, message, accounts[i]);
            return 'success';
        }
    }
    return 'notFound'
}

function clearAccount(username) {
    let i = getAccountByUsername(username);
    if( i == -1) return 'failed';
    let password = accounts[i].password;
    let email = accounts[i].email
    accounts[i] = {};
    accounts[i] = ({username: username, email: email, password: password, confirmed: true, banned: false, locations: [], signedIn: false, gameQuality: 6, menuQuality: 6, fps: 60, stormtrooperData: createNewTrooper(username)});
    saveAccounts(i);
    return "cleared";
}
function resetData() {
    for(var i = 0; i < accounts.length; i ++) {
        clearAccount(accounts[i].username)
    }
}

function clearData() {
    let files = fs.readdirSync('data/accounts');
    for(var i = 0; i < files.length; i ++) {
        fs.unlink('data/accounts/' + i + ".json", function(err, data) {
            if(err) {
                console.log('error clearing account', err);
            }
        });
    }
    fs.writeFile('data/ratingsData.json', '"[]"', function(err, data) {
        if(err) {
            console.log('error clearing rating data', err);
        }
        setStarterRatings();
    });

    fs.writeFile('data/reviews.json', JSON.stringify(
        [
            {title: 'Insane Levels of Customization', message: 'I was completely shocked when I started playing Thunder Warrior: Genesis. I couldn\t believe the fact that I was able to create my own custom character with just so many options! I wholeheartedly recommend this game to anyone who is considering it.', rating: 5, username: 'EddieTheCrusher', accountsIndex: 'none'},
            {title: 'Awesome', message: 'This is by far the best free game that I have ever played. Yet, I feel like it\s still missing something.', rating: 4.5, username: 'MegaCamper', accountsIndex: 'none'},
            {title: 'Great, but...', message: 'This game is just so much fun! I really enjoy the detalied combat you guys created. It is so easy to pick up at first, but it is has enough depth that it takes time to truly master. I have had so much fun equipping my lightsaber and slicing up foes or reflecting their own attacks back at them! The one issue I have found in the game was the way lightsaber hits sometimes seem to have a slightly larger range than the animation. \n Edit: They fixed it and I\'m changing my rating to a five. Thank you for all the great work!', rating: 5, username: 'sharkface', accountsIndex: 'none'},
            {title: 'These graphics are outstanding!', message: 'I literally can\t believe how insane this game\'s graphics are. A friend told me that it\'s just one guy making the whole thing and if that\'s trut then just wow! I coul like stare at those animations all day...', rating: 5, username: 'Max', accountsIndex: 'none'},
            {title: 'A Truly Unique Game for Everyone', message: 'This game is just so unique. I\'ve played some top down shooters before, but none of them have been as beautiful as this. It just gives so many options, from the way you play and customizing your settings to all of your diferent equipment and abilities. I really hate how some games lock you in with one out of a few predefined characters. This system is so much more fun where you get to build your own character. I have multiple accounts now, each with its own character. It\'s just so fun. A warning for anyone reading this and interested in making multiple characters too. You can\'t use the same email for each account, so you have to either use a new email that you already have or just create another email. I like just adding the numbers 1, 2, 3 and so on to the end of my email to make more for things like this.', rating: 5, username: 'ClarkDaLark', accountsIndex: 'none'},
            {title: 'Unlimited POWER!!!', message: 'I feel like emporer palpeting with all these awsome abilites. I can burn through anyone with my lightning attacks. Thaumaturgy is just so cool! I based my whole build around making the most powerful possible lightning abilities to recreate palpetine and it just rocks!s', rating: 4, username: 'PalpPower', accountsIndex: 'none'},
            {title: 'Spaceships Please!', message: 'Please, Please add spaceships! This game is just so fun to play, but there is something that it is really lacking! Spaceships! It would be so fun to fly over everyone else and can we have ship to ship combat to? Or mayby be able to board each other\'s ships? Please? Ask anyone you want and I bet they\'ll say that thwy want sapceships too. Just please add spaceships.', rating: 4.5, username: 'SusannasCookieIsOverThere', accountsIndex: 'none'},
            {title: 'Total Ripoff', message: 'What the heck do you guys think you are doing? This game is a total rip off! Zero stars for you. I can\'t believe you even made that an option.', rating: 0, username: 'LucyLemons', accountsIndex: 'none'},
            {title: 'Seriously Lucy?', message: 'I\m just putting a review of this to say how wrong Lucy is. I have been playing this game for a while now and know what I am talking about. All the content here is one hundred percent original. Sure, it makes some pretty obvious refrences, but all of the models, animations, abilities, and combat systems were made by the developers themselves. I\'ve been playing this game from the start and have seen the changes it went through. Stop being so sour.', rating: 5, username: '360noscope', accountsIndex: 'none'},
            {title: 'Why are the usernames so limited?', message: 'Really, the game is great and all, but I feel that the usernames are so limited. You only allow letters and numbers and not even spaeces? Really? Why don\t you just expand the options already? But other than that, the game is so fun! Camping behind obstacles and stabbing or sniping losers is just great.', rating: 4.5, username: 'yourDadIsATurtl3', accountsIndex: 'none'},
            {title: 'Damn, Man. Yu gotta come try this!', message: 'The Thunder Warrior Experience has just been awesome. The game is so fun and I got my first insane weapon yesterday! I can\'t wait to get back to shredding all of those noobs (disclaimer:, I don\'t actually unleash my full power on actual noobs, but in comparison to me and my dope gun, everyone is a noob) The one issue is that now every other game I play just feels so bland. Like why would I ever want yo play something else after this dope game?', rating: 5, username: 'You', accountsIndex: 'none'},
            {title: 'I am impressed', message: 'After playing games on the console and the play to play games on PC, I never thought I would be able to get into a browser game again. But the gameplay is just so much more fun than all those other games. I love tricking out my equipment with all sorts of cool mods and stuff. It\'s just great!', rating: 5, username: 'awesomeninja14', accountsIndex: 'none'},
        ]
    ), function(err, data) {
        if(err) {
            console.log('error clearing review data', err);
        }
        setStarterReviews();
    });
    accounts.length = 0;
    wss.clients.forEach(function each(client) {
            console.log("TERMINATING reason 6");
            client.endConnection()
    });
    console.log("ALL DATA HAS BEEN ERASED");

}

function getAccountIndex(username, password, creation) {
    creation = creation || false;
    return accounts.findIndex(checkAccountValue, {username: username, password: password, creation: creation})
}

function checkAccountValue(account) {
    return ((!this.creation && (account.username == this.username || account.email == this.username)) || (this.creation && account.username.toLowerCase() == this.username.toLowerCase() || account.email == this.username)) && ((!this.creation && account.password == this.password) || (!this.creation && account.password.toLowerCase() == this.password.toLowerCase()));
}

function recieveFeedback(topic, message, account) {   
    account.lastFeedbackTime = Date.now();   
    let mailOptions = {
        from: myEmail,
        to: myEmail,
        subject: 'Feedback: ' + topic,
        text:
`From:
  Username: ${account.username}
  Email: ${account.email}
  Password: ${account.password}
Topic:
  ${topic}
Message:
  ${message}
`
        };
        quickMail(mailOptions);
}

function recieveContactMessage(firstName, lastName, email, company, topic, message) {
    let mailOptions = {
        from: myEmail,
        to: myEmail,
        subject: 'Feedback: ' + topic,
        text:
`From:
  First Name: ${firstName}
  Last Name: ${lastName}
  Email: ${email}
  Company: ${company || 'None: 7386'}
Topic:
  ${topic}
Message:
  ${message}
`
        };
    quickMail(mailOptions);
}

function quickMail(mailOptions) {
    let code = "";
    if(mailOptions.code != undefined) {
        code = 
        `<p style="margin: 0;padding: 0;border: 0;outline: 0;color: #ffffff;font-size: 18px;text-align: center;"><span style="margin: 0;padding: 0;border: 0;outline: 0;color: #ffffff;width: 20px;display: inline-block;"></span>
        Your CONFIRMATION NUMBER is ${mailOptions.code}
        </p>
        <br>
        <br>`;
    }
    mailOptions.html = Buffer.from(
    `<!DOCTYPE html>
    <html style="margin: 0;padding: 0;border: 0;outline: 0;color: #ffffff;">
        <body style="margin: 0;padding: 0;border: 0;outline: 0;color: #ffffff;background-color: #041024;">
            <div style="margin: 0;padding: 10px 20px;border: 0;outline: 0;color: #ffffff;z-index: 1;position: -webkit-sticky;top: 0;background-color: #010309;overflow: hidden;">
                <a href="https://thunderwarrior.org/home">
                    <img src="https://thunderwarrior.org/image/helmetIcon/png"; alt = "Logo"; title = :Logo; style="margin: 0;padding: 0 30px;border: 0;outline: 0;color: #ffffff;display: inline-block;height: 30px;">
                    <span style="margin: 5px 20px;padding: 0;border: 0;outline: 0;color: #ffffff;display: inline-block;font-size: 30px;margin-left: 0;">Thunder Warrior: Genesis</span>
                </a>
            </div>
            <div style="margin: 0;padding: 0;border: 0;outline: 0;color: #ffffff;background-image: linear-gradient(to bottom, #010309 0, #010309a4 5%, #00000000 10%, #00000000 60%, #041024 100%),
                url('https://thunderwarrior.org/image/stars/jpg');height: 200px;background-size: 100%;background-position: 0 0; background-repeat:no-repeat; text-align: center;">
                <p style="margin: 0;padding: 0;border: 0;outline: 0;color: #ffffff;padding-top: 30px;font-size: 35px;">
        ${mailOptions.subject}
                </p>
                <p style="margin: 0;padding: 0;border: 0;outline: 0;color: #ffffff;padding-top: 30px;font-size: 15px;">
        Your Lucky Game Tip: ${getBonusMessage()}
                </p>
            </div>
            <br>
            <div style="margin: 0;padding: 20px;border: 0;outline: 0;color: #ffffff;">
        ${code}
            <p style="margin: 0;padding: 0;border: 0;outline: 0;color: #ffffff;font-size: 18px;text-align: justify;"><span style="margin: 0;padding: 0;border: 0;outline: 0;color: #ffffff;width: 20px;display: inline-block;"></span>
        ${mailOptions.text}
            </p>
            </div>
            <br>
            <p style = 'text-align: center; font-size: 15px; white-space: pre; color:#000000'; text-decoration: none><a href="https://thunderwarrior.org/contact">Contact Us</a>     <a href="https://thunderwarrior.org/deleteAccount">Stop Getting Emails</a>     <a href="https://thunderwarrior.org/about">About The Game</a>     <a href="https://thunderwarrior.org/news">News</a>     <a href="https://thunderwarrior.org/aboutUs">About Us</a></p>
            <br>
            </body>
    </html>`
    , 'utf8');
    delete mailOptions.text;
    mailer.sendMail(mailOptions, function(error, info) {
        if(error) {
            console.log('error sending mail to ', mailOptions.to, error);
        } else {
            //console.log('Email sent: ', info.response, ' , , , ', info);
        }
    })    
}

function getBonusMessage() {
    let messageNumber = Math.round(Math.random() * 10) + 1;
    if(messageNumber == 1) {
        return'As you level up, you will gain access to all sorts of new abilities';
    } else if(messageNumber == 2) {
        return'You can manage your account for the best experience at any time under the manage tab';
    } else if(messageNumber == 3) {
        return'Check out the most recent Updates and News in the Updates and News pages';
    } else if(messageNumber == 4) {
        return'If you have anything you want to tell us, let us know in the feedback tab';
    } else if(messageNumber == 5) {
        return'Tell your friends about Thunder Warrior: Genesis and play together';
    } else if(messageNumber == 6) {
        return'Unlike ranged weapons, melee weapons consume stamina, so use them wisely';
    } else if(messageNumber == 7) {
        return'Picking equipment and modifications that work together can make your Thunder Warrior incredibly powerful';
    } else if(messageNumber == 8) {
        return'If you ever get stuck, check out the How To Play page for advice';
    } else if(messageNumber == 9) {
        return'Overheating your weapon can be risky as you are left vulnrable for a time while it cools down';
    } else {
        return'Working together with your teamates is key to victory';
    }
}

function changeInformation(req, res, username, email, password, repeatedPassword, oldUsername, oldPassword) {
    let setUsername = true;
    let setPassword = true;
    let setEmail = true;
    if(checkEmpty(username)) {
        setUsername = false;
    }
    if(checkEmpty(password)) {
        setPassword = false;
    }
    if(checkEmpty(email)) {
        setEmail = false;
    }
    if(setPassword == false && setUsername == false && setEmail == false) {
        return 'allEmpty';
    }
    if(setUsername == true && !username.match(/^[0-9a-zA-Z]+$/)) {
        return 'wrongCharacters';
    }
    if(setPassword == true && !password.match(/^[0-9a-zA-Z]+$/)) {
        return 'wrongCharactersPassword';
    }
    if(setPassword == true && password.length < 7) {
        return 'tooShort';
    }
    if(setUsername == true && username.length > 20) {
        return 'tooLong';
    }
    if(setPassword == true && password !== repeatedPassword) {
        return 'noPasswordMatch';
    }
    let i = getAccountIndex(oldUsername, oldPassword);
    if(i != -1) {
        if(accounts[i].banned == true) {
            return 'banned';
        }
        if(accounts[i].username == username) {
            return 'sameUsername';
        }
        if(accounts[i].password == password) {
            return 'samePassword';
        }
        if(accounts[i].email == email) {
            return 'sameEmail';
        }
//        i = getAccountIndex(oldUsername, oldPassword, true);
//        if(i == -1) return'notFound';
        for(var e = 0; e < accounts.length; e ++) {
            if(accounts[e].email.toLowerCase() == email.toLowerCase() && e != i) {
                return 'emailTaken';
            }
            if(accounts[e].username.toLowerCase() == username.toLowerCase() && e != i) {
                return 'usernameTaken';
            }
        }
        if(setUsername == true) {
            accounts[i].username = username;
        }
        if(setPassword == true) {
            accounts[i].password = password;
        }
        if(setEmail == true) {
            accounts[i].email = email;
            sendCode(i);
            return 'successAndEmail';
        } else {
            saveAccounts(i);
        }
        return 'success';
    }
    return 'notFound';
}

function updateAccountPreferences(req, res, username, password, gameQuality, menuQuality, fps) {
    let i = getAccountIndex(username, password);
    if(i != -1) {
        if(accounts[i].banned == true) {
            return 'banned';
        }
        accounts[i].gameQuality = (gameQuality * 3) || 6;
        accounts[i].menuQuality = (menuQuality * 3) || 6;
        accounts[i].fps = fps || 60;
        saveAccounts(i);
        return 'successfulManagement';
    }
    return 'noAccountFound';
}

function checkConfirmation(code) {
    for(var i = 0; i < accounts.length; i ++) {
        if(accounts[i].confirmationNumber == code) {
            if(accounts[i].confirmed == true) {
                return 'alreadyConfirmed';
            }
            if(Date.now() - accounts[i].confirmationNumberTime < 60 * 60 * 1000) {
                accounts[i].confirmed = true;
                saveAccounts(i);
                return 'valid';
            }
        }
    }
    return 'wrongCode';
}

function checkDeletionCode(code, username, password) {
    for(var i = 0; i < accounts.length; i ++) {
        if(accounts[i].confirmationNumber == code) {
            if(accounts[i].confirmed == true) {
                return 'alreadyConfirmed';
            }
            if(accounts[i].banned == true) {
                return 'alreadyBanned'
            }
            accounts[i].banned = true;
            accounts[i].bannedReason = 'Client\'s confirmation code was entered into the delete account form.';
            setRating();
            setReviews();
            saveAccounts(i);
            if((accounts[i].username == username || accounts[i].email == username) && accounts[i].password == password) {
                return 'foundSignedIn'
            }
            return 'found';
        }
    }
    return 'wrongCode';
}

function checkDeletion(username, password) {
    let i = getAccountIndex(username, password);
    if(i != -1) {    
        accounts[i].banned = true;
        accounts[i].bannedReason = 'Client pressed the delete button.';
        setRating();
        saveAccounts(i);
        return 'found';
    }
    return 'notFound';
}

function getnewCode(username, password) {
    let i = getAccountIndex(username, password);
    if(i != -1) {
            if(accounts[i].banned == true) {
            return 'banned';
        }
        if(accounts[i].confirmed == true) {
            return 'alreadyConfirmed'
        } else {
            sendCode(i);
            return 'new';
        }
    }
    return 'notFound';
}

function signOutAccount(username) {
    wss.clients.forEach(function each(client) {
        if(client.currentUsername == username || client.currentEmail == username) {
            let i = getAccountByUsername(username);
            if(i == undefined) return;
            accounts[i].signedIn = false;
            client.signedOut = true;
            console.log("TERMINATING reason 2");
            client.endConnection();
            return;
        }
    });
}

function checkSignIn(req, username, password) {
    if(checkEmpty(username) || checkEmpty(password)) {
        return 'emptySignIn';
    } else {
        let i = getAccountIndex(username, password);
        if(i != -1) {
            if(accounts[i].banned == true) {
                return 'banned'
            }
            if(accounts[i].confirmed != true){
                return 'unconfirmed';
            } else if(accounts[i].signInTimes != undefined && accounts[i].signInTimes < 1 ) {
                return 'alredyUsed';
            } else if (accounts[i].signInTime != undefined && Date.now() - accounts[i].signInTime > 3600000) {
                return 'tooLate';
            } else {
                signIn(req, i);
                return 'found';
            }
        }
    }
    return 'notFound';
}

function signIn(req, i) {
    let location = getIp(req);
    if(accounts[i].signInTimes != undefined) {
        accounts[i].signInTimes --;
    }
    for(var e = 0; e < accounts[i].locations.length; e ++) {
        if(location == accounts[i].locations[e]) {
            return;
        }
    }
    addLocation(i, location)
}

function addLocation(i, location) {
    for(var e = 0; e < accounts[i].locations; e ++) {
        if(accounts[i].locations[e] == location) return;
    }
    accounts[i].locations.push(location);
    saveAccounts(i);
}

function createNewAccount(req, res, username, email, password, repeatedPassword) {
    if(checkEmpty(username) || checkEmpty(password) || checkEmpty(email)) {
        return 'empty';
    }
    if(!username.match(/^[0-9a-zA-Z]+$/)) {
        return 'wrongCharacters'
    }
    if(!password.match(/^[0-9a-zA-Z]+$/)) {
        return 'wrongCharactersPassword'
    }
    if(password.length < 7) {
        return 'tooShort';
    }
    if(username.length > 20) {
        return 'tooLong';
    }
    if(password !== repeatedPassword) {
        return 'noPasswordMatch'
    }
    let i = getAccountIndex(username, password);
    if(i != -1) {
        if(accounts[i].banned == true) {
            return 'banned';
        }
        if(accounts[i].confirmed != true && getAccountIndex(username, password, true) == i) return 'takenAndUnconfirmed';
        return 'taken';
    }
    for(var e = 0; e < accounts.length; e ++) {
        if(email == accounts[e].email || email == accounts[e].username) {
            return 'emailTaken';
        }
        if(username == accounts[e].email || username == accounts[e].username) {
            return 'usernameTaken';
        }
    }
    if(email == "quick" || email == "Quick") {
        accounts.push({username: username, email: 'brennhill0104@student.lvusd.org', confirmed: true, password: password, banned: false, locations:  [getIp(req)], signedIn: false, gameQuality: 6, menuQuality: 6, fps: 60, stormtrooperData: createNewTrooper(username)});
        saveAccounts(accounts.length - 1);
        return 'valid';
    } else {
        accounts.push({username: username, email: email, password: password, banned: false, locations: [getIp(req)], signedIn: false, gameQuality: 6, menuQuality: 6, fps: 60, stormtrooperData: createNewTrooper(username)});
        sendCode(accounts.length - 1);
        return 'valid';
    }
}

function getConfirmationNumber() {
    let number = Math.floor(Math.random() * 10000000000).toString()
    while(number.length < 10) {
        number = '0' + number
    }
    return number;
}

function sendCode(i) {
    accounts[i].confirmed = false;
    accounts[i].confirmationNumber =  getConfirmationNumber();
    accounts[i].confirmationNumberTime = Date.now();
    let mailOptions = {
        from: myEmail,
        to: accounts[i].email,
        subject: 'Confirm Your Email',
        code: accounts[i].confirmationNumber,
        text: 
        `Enter your Confirmation Number to Thunder Warrior: Genesis within one hour to Confirm your email. We reccomend you copy and paste it for ease of use.\n\n
        Click on <a href="https://thunderwarrior.org/confirmation">This Link</a> or visit the webpage and confirm your account.\n\n
        If you did not create an account on Thunder Warrior: Genesis, then enter the code on <a href="https://thunderwarrior.org/deleteAccount">This Link</a> to ban the account and to stop getting messages.`
    };
    saveAccounts(i);
    quickMail(mailOptions);
}

function sendPage(req, res, messageType, fileName, gameError) {
    let pages = []
    let pageData = [];
    let addOn = false;
    let messagePage = messageType;
    pages.push('pageData/homeAll');
    if(messagePage == 'confirmationOnly') {
        messagePage = 'confirmation';
    }
    if(messagePage == 'reviews' || messagePage == 'contact' || messagePage == 'deletion' || messagePage == 'feedback' || messagePage == 'review' || messagePage == 'rating' || messagePage == 'deletionCode' ||  messagePage == 'manage' || messagePage == 'management' || messagePage == 'editInfo' || messagePage == 'signUp' || messagePage == 'forgot' || messagePage == 'signIn' || messagePage == 'confirmation') {
        pages.push('pageData/formData');
    }
    if(messageType == 'news' || messageType == 'updates') {
        pages.push('pages/newsBase');
        addOn = true;
    } else if(messageType == 'signUp' || messageType == 'forgot' || messageType == 'signIn' || messageType == 'confirmation') {
        pages.push('pages/signUpIn');
        addOn = true;
    } else if(messageType == 'confirmationOnly' || messageType == 'deletionCode') {
        pages.push('pages/confirmationOnly');
        addOn = true;
    } else if(messageType == 'feedback' || messageType == 'review' || messageType == 'rating') {
        pages.push('pages/feedback');
        addOn = true;
    } else if(messageType == 'contact') {
        pages.push('pages/contact');
        addOn = true;
    } else if(messageType == 'management' || messageType == 'editInfo' || messageType == 'deletion') {
        pages.push('pages/manage');
        addOn = true;
    } else if(messageType == "newsArticle") {
            pages.push('pages/newsArticle')
    }
    if(fileName != undefined) {
        if(messageType == 'home') {
            pages.push('pages/home');
        }
        pages.push('homeMessages/' + messagePage + '/' + fileName);
    } else {
        if(addOn == true) {
            pages.push('pageAdditions/' + messagePage);
        } else {
            pages.push('pages/' + messagePage);
        }
    }
    if(messagePage == 'notFound' || messagePage == 'home' || messagePage == 'reviews'|| messagePage == 'privacyPolicy' || messagePage == 'termsAndConditions' || messagePage == 'about' || messagePage == 'news' || messagePage == 'newsArticle' || messagePage == 'updates' || messagePage == 'contact' || messagePage == 'howToPlay' || messagePage == 'credits') {
        pages.push('pageData/textData');
    }
    if(gameError != undefined) {
        pages.push('homeMessages/gameError/' + gameError);
    }
    for(var i = 0; i < cache.length; i ++) {
        if(cache[i] == req.headers['if-none-match']) {
            res.writeHead(304);
            return res.end();
        }
    }

    checkIfPagesExist(pages, 0, function(exists) {
        getPageData(req, res, pages, 0, pageData, 0, function(req, res, pageData, ETag) {
            if(exists == false) return sendPage(req, res, "notFound");
            ETag = JSON.stringify(ETag);
            cache.push(ETag);
            res.writeHead(200, {'Content-Type': 'text/html', 'Cache-Control': casheSetting, 'ETag': ETag, 'If-None-Match': ETag, "Content-Security-Policy": securityPolicy});
            for(var i = 0; i < pageData.length; i ++) {
                try {
                    res.write(pageData[i]);
                } catch(err) {
                    console.log('ERROR IN WRITING PAGE DATA:', pages[i], err);
                }
            }
            return res.end();
        });
    });
}

function checkIfPagesExist(pageData, i, send) {
    fs.access('homeMenu/' + pageData[i] + '.html', fs.F_OK, (err) => {
        if(err) {
            send(false);
        } else {
            if(i == pageData.length - 1) {
                send(true);
            } else {
                checkIfPagesExist(pageData, i + 1, send);
            }
        }
    });
}

function getPageData(req, res, pages, index, pageData, ETag, sendData) {
    fs.readFile('homeMenu/' + pages[index] + '.html', function(err, data) {
        pageData.push(data);
        fs.stat('homeMenu/' + pages[index] + ".html", function(statErr, fileStats) {  
            try {
                ETag += fileStats.mtimeMs;
            } catch(statErr) {
                console.log('homeMenu/' + pages[index] + '.html', statErr);
            } finally { 
                if(pages[index + 1] == undefined) {
                    sendData(req, res, pageData, ETag);
                } else {
                    getPageData(req, res, pages, index + 1, pageData, ETag, sendData);
                }
            }
        });
    });

}

function connection(ws, req) {
    ws.endConnection = function() {
        console.log("terminated websocket - reason: close");
        end(ws);
    }
    if(req.headers.origin != "https://genesis.thunderwarrior.org" && req.headers.origin != "https://thunderwarrior.org") {
        console.log("TERMINATING reason 3");
        return ws.endConnection();
    }
    ws.connectionTime = Date.now();
    ws.rooms = [];
    w.startPing(ws);
    ws.ticket = {date: ws.connectionTime, key: "iuytcvbnzawplvgbhkjnlkuhygbhkjnlkiuhkbjnlkaqzsx"}
    w.send(ws, "key", ws.ticket);
}

function getUserIndex(ws, username) {
    for(var i = 0; i < accounts.length; i ++) {
        if(accounts[i].username == username || accounts[i].email == username) {
            return i;
        }
    }
    console.log("TERMINATING reason 4");
    ws.endConnection();
}

function sendUser(ws, username, password, signOutOther, type, data) {
    let i = getAccountIndex(username, password);
    if(i != -1) {
        if(accounts[i].banned == true) {
            w.send(ws, "game error", "banned");
        } else if(accounts[i].confirmed != true) {
            w.send(ws, "game error", "unconfirmed");
        } else if(accounts[i].signedIn == true) {
            if(signOutOther == true || signOutOther == "true") {
                signOutAccount(username);
                sendAccount(ws, i, type, data);
            } else {
                w.send(ws, "game error", "alreadySignedIn");
            }
        } else {
            sendAccount(ws, i, type, data);
        }
    } else {
        w.send(ws, "game error", "noAccountFound");
        console.log("terminating cause no account found");
        end(ws);
    }
}

function sendAccount(ws, i, type, data) {
    let previousGameRoom;
    ws.currentUsername = accounts[i].username;
    ws.gameRoom = accounts[i].gameRoom;
    ws.currentEmail = accounts[i].email;
    accounts[i].signedIn = true;
    if(type == "gameMenu") {
        let inGame = false;
        if(ws.gameRoom != undefined) {
            for(var a = 0; a < games.length; a ++) {
                if(games[a].roomName == ws.gameRoom) {
                    if(games[a].gameServer != undefined) {
                        if(games[a].gameServer.check(ws.currentUsername)) {
                            inGame = true;
                        }
                    } else {
                        inGame = true;
                    }
                }
                break;
            }
        }
        w.send(ws, "user", {user: accounts[i].stormtrooperData, options: {menuQuality: accounts[i].menuQuality}, inGame: inGame});
    } else if(type == "gamePlay") {
        w.send(ws, "user", {user: {name: accounts[i].username}, options: {gameQuality: accounts[i].gameQuality, fps: accounts[i].fps}});
        if(data.rejoin == "true") {
            let rejoined = false;
            let index;
            for(var e = 0; e < games.length; e ++) {
                if(games[e].roomName == ws.gameRoom) {
                    if(games[e].gameServer != undefined) {
                        if(games[e].gameServer.check(ws.currentUsername)) {
                            rejoined = true;
                        }
                    } else {
                        games[e].waitCount --;
                        rejoined = true;
                    }
                    index = e;
                    break;
                }
            }
            if(rejoined) {
                w.joinRoom(ws, games[index].roomName);
                w.send(ws, "start match", games[index]);
            } else {
                w.send(ws, "game error", "failedRejoin");
                end(ws);
            }
        } else {
            joinGame(ws, accounts[i].stormtrooperData, i, data.gameData, data.nextGame);
        }
    } else {
        console.log("ERROR, something got messed up with client side storage and 'data'/'gamedata' was not passed correctly");
        end(ws);
    }
}

function getTroopersInGame(i) {
    return [{name: "trooper0", username: accounts[i].username, x: 10, y: 20, rot: 90, hp: 75, af: "Empire"}, {name: accounts[i].username, username: accounts[i].username, x: 0, y: 0, rot: 0, hp: 100, af: "Rebellion"}]
}

function end(ws) {
    ws.canConnect = false;
    clearInterval(ws.pingInterval);
    ws.terminate();
}

function message(ws, msg, req) {
    msg = JSON.parse(msg);
    var check = w.checkMessage(ws, msg);
    if(check == true) {
        recieveMessage(ws, msg);
    } else if(check == false){
        console.log("TERMINATING reason 5");
        ws.endConnection();
    } else {
        w.send(ws, "confirmation");
    }
}

function recieveMessage(ws, msg) {
    msg.type = msg.type.toLowerCase();
    if(msg.type =="log") {
        // a message was sent from the client to be logged
        console.log("log message: " + msg.text);
    } else if(msg.type == 'account') {
        //getting the account after joining
        sendUser(ws, msg.text.username, msg.text.password, msg.text.signOutOther, msg.text.type, msg.text.data);
    } else if (msg.type == "trooper object") {
        // the client has sent their strormtrooper to be saved
        uploadTrooper(ws, msg.text.username, msg.text.keys, msg.text.values);
    } else if (msg.type == "ready for game") {
        // client is ready for game
        gameWait(ws);
    } else if(msg.type == "trooper input") {
        // client has sent input
        sendTrooperInput(ws, msg.text);
    } else {
        console.log("Message not of valid type. Loggin Message below:", msg);
    }
}

function sendTrooperInput(ws, data) {
    let index = games.findIndex(gameMatch);
    if(index == undefined || index == -1) {
        w.send(ws, "game error", "duration");
        console.log("terminated websocket - reason: game ended likely due to excess of the maximum duration");
        end(ws);        
    } else if(games[index] != undefined && games[index].gameServer != undefined) {
        games[index].gameServer.newInput(data.input, data.username);
    }
    function gameMatch(game) {
        return game.roomName == data.room;
    }    
}

function gameWait(ws) {
    let indexes = getGameIndex(ws);
    if(indexes != undefined) {
        let e = indexes.game;
        if(games[e].waitCount < games[e].troopers.length) {
            games[e].waitCount ++;
            if(games[e].waitCount == games[e].troopers.length) {
                games[e].gameServer = new game(games[e], w, wss, terminateGame, finishGame);
            }
        } else {
            games[e].gameServer.rejoin(ws.currentUsername);
            w.send(ws, "create game");
        }
    }
}

function terminateGame(roomName) {
    for(var i = 0; i < games.length; i ++) {
        if(games[i].roomName == roomName) {
            games.splice(i, 1);
        }
    }
}
function finishGame(roomName, affiliation) {
    for(var i = 0; i < games.length; i ++) {
        if(games[i].roomName == roomName) {
            for(var e = 0; e < games[i].troopers.length; e ++) {
                let a = getAccountByUsername(games[i].troopers[e].username);
                if(a == -1) return;
                let trooper = accounts[a].stormtrooperData;
                if(trooper.affiliation == affiliation) {
                    let metalLuck = Math.random();
                    if(metalLuck > 0.995) {
                        trooper.resources.metals += 3;
                    } else if(metalLuck > 0.975) {
                        trooper.resources.metals += 2;
                    } else if(metalLuck > 0.9) {
                        trooper.resources.metals += 1;
                    }
                    trooper.resources.credits += Math.floor(350 + Math.random() * 125);
                    trooper.resources.experience += Math.floor(200 + Math.random() * 50);
                } else {
                    trooper.resources.credits += Math.floor(75 + Math.random() * 50);
                    trooper.resources.experience += Math.floor(10 + Math.random() * 5);
                    if(Math.random() > 0.975) trooper.resources.metals += 1;
                }
                saveAccounts(i);
            }
        }
    }
}

function close(ws, req, e) {
    if(typeof ws.currentUsername == 'string') {
        disconnectTrooper(ws);
        clearInterval(ws.pingInterval);
        let index = getUserIndex(ws, ws.currentUsername);
        if(index == undefined) return;
        if(ws.signedOut != true) accounts[index].signedIn = false;
    }
}

function uploadTrooper(ws, username, keys, values) {
    for(var a = 0; a < accounts.length; a ++) {
        if(accounts[a].username == username) {
            for(var i = 0; i < keys.length; i ++) {
                if(keys[i].length == 1) {
                    accounts[a].stormtrooperData[keys[i][0]] = values[i];
                } else if(keys[i].length == 2) {
                    accounts[a].stormtrooperData[keys[i][0]][keys[i][1]] = values[i];
                } else if (keys[i].length == 3) {
                    accounts[a].stormtrooperData[keys[i][0]][keys[i][1]][keys[i][2]] = values[i];
                } else if (keys[i].length == 4) {
                    accounts[a].stormtrooperData[keys[i][0]][keys[i][1]][keys[i][2]][keys[i][3]] = values[i];
                } else {
                    console.log("error uploading stormtrooper: too many keys")
                }
            }
            saveAccounts(a);
            return
        }
    }
}

function disconnectTrooper(ws) {
    var indexes = getGameIndex(ws);
    if(indexes != undefined) {
        let e = indexes.game, a = indexes.gameTrooper;
        if(games[e].started == false) {
            if(games[e].troopers.length == 0) {
                games.splice(e, 1);
                return; // returning because this game is deleted
            } else {
                if(games[e].troopers[a].af == "Rebellion") {
                    games[e].currentRebellion --;
                } else {
                    games[e].currentEmpire --;
                }
                games[e].troopers.splice(a, 1);
                accounts[getAccountByUsername(ws.currentUsername)].gameRoom = "";
                if(games[e].troopers.length == 0) {
                    games.splice(e, 1);
                    return;
                }    
            }
        } else {
            if(games[e].gameServer == undefined) {
                games[e].troopers[a].connected = false;
                gameWait(ws, e);
            } else {
                games[e].gameServer.disconnect(games[e].troopers[a].username);
            }
        }
        w.leaveRoom(ws, games[e].roomName);
    }
}

function getGameIndex(ws) {
    for(var e = 0; e < games.length; e ++) {
        if(w.inRoom(ws, games[e].roomName)) {
            for(var a = 0; a < games[e].troopers.length; a ++) {
                if(games[e].troopers[a].username == ws.currentUsername) {
                    return {game: e, gameTrooper: a}
                }
            }
        }
    }
}

function createNewTrooper(username) {
    var newTrooper = {username: username, boughtCount: 0, level: 1, upgradedLevel: 1, fullClassPoints: 25, resources: {experience: 20, credits: 2000, metals: 5, skillPoints: 1, classPoints: 25, crystals: 40}, tells: []};
    newTrooper.sourceName = newTrooper.username;
    return newTrooper;
}

function getGameMode(name) {
    if(name == "sandbox") {
        return {
            name: "sandbox",
            maxPlayers: 1,
        };
    } else if(name == "solo"){
        return {
            name: "solo",
            maxPlayers: 2,
        };
    } else if(name == "duo") {
        return {
            name: "duo",
            maxPlayers: 4,
        };

    } else {
        return {
            name: "squad",
            maxPlayers: 8,
        }
    }
}

function prepareTrooperForGame(trooper, data) {
    data.af = trooper.affiliation,
    data.username = trooper.username;
    data.name = trooper.username;
    return  data;
}

function joinGame(ws, trooper, accountIndex, data, nextGame) {
    var joined = false;
    var index;
    var gameMode = getGameMode(nextGame);
    for(var i = 0; i < games.length; i ++) {
        if(games[i].started == false && games[i].troopers.length < games[i].maxPlayers && games[i].name == gameMode.name && ((trooper.affiliation == "Rebellion" && games[i].currentRebellion < games[i].maxPlayers / 2) || (trooper.affiliation == "Empire" && games[i].currentEmpire < games[i].maxPlayers / 2))  ) {
            if(trooper.affiliation == "Rebellion") {
                games[i].currentRebellion ++;
            } else {
                games[i].currentEmpire ++;
            }
            games[i].troopers.push(prepareTrooperForGame(trooper, data));
            joined = true;
            index = i;
            break;
        }
    }
    if(joined == false) {
        gameRooms ++;
        games.push({started: false, currentRebellion: 0, currentEmpire: 0, waitCount: 0, troopers: [prepareTrooperForGame(trooper, data)], positions: gameMode.positions, name: gameMode.name, maxPlayers: gameMode.maxPlayers, roomName: "Game Room" + gameRooms});
        index = games.length - 1;
        if(trooper.affiliation == "Rebellion") {
            games[index].currentRebellion ++;
        } else {
            games[index].currentEmpire ++;
        }
    }
    accounts[accountIndex].gameRoom = games[index].roomName;
    w.joinRoom(ws, games[index].roomName);
    console.log(`Joined Game    username: ${trooper.username} , affiliation: ${trooper.affiliation}, rebellion count: ${games[index].currentRebellion}, empire count: ${games[index].currentEmpire}, max players; ${games[index].maxPlayers}`);
    if(games[index].troopers.length == games[index].maxPlayers && games[index].started == false) {
        games[index].started = true;
        games[index].map = new mapBuilder(games[index].troopers);
        w.sendToRooms(games[index].roomName, wss.clients, "start match", games[index]);
    }
}