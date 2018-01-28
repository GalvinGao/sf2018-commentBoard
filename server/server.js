const WebSocket = require('ws');
const mysqlConn = require('mysql');
const crypto = require('crypto');
const xss = require('xss');
const https = require('https');
const http = require('http');
const fs = require('fs');
const request = require("request");

// HTTPS Config
const keypath = '/etc/letsencrypt/live/sf2018.dev.iblueg.cn/privkey.pem'; // HTTPS Server Certificate Key
const certpath = '/etc/letsencrypt/live/sf2018.dev.iblueg.cn/fullchain.pem'; // HTTPS Server Certificate

// HTTP jumps to HTTPS - Hostname Config
// PLEASE MAKE SURE THIS IS CORRECTLY CONFIGURED!
// NO NEED FOR "/" OR "http://"!
const serverHostname = "sf2018.dev.iblueg.cn";

/*

function insertSql(name, comment, time) {
  var sqlParam = [userIp, time, name, comment];

  connection.query('INSERT INTO comments(id,ip,time,name,comment) VALUES(0,?,?,?,?);', sqlParam, function (error, results, fields) {
    if (error) throw error;
    log('Message Inserted. MySQL Response: ', results);
  });
}


var connection = mysqlConn.createConnection({
  host     : process.env.mysqlhost,
  port     : process.env.mysqlport,
  user     : process.env.mysqluser,
  password : process.env.mysqlpassword,
  database : process.env.mysqldatabase
});

connection.connect();

*/

var sslOptions = {
  key: fs.readFileSync(keypath),
  cert: fs.readFileSync(certpath)
};

var sslServer = https.createServer(sslOptions, function (req, res) {
  //res.writeHead(403); // Response https connections
  //res.end("403 Forbidden\nPowered by NodeJS\nCopyright by Galvin.G 2017-2018. All rights reserved.");
  const userIp = req.connection.remoteAddress;
  switch (req.url) {
    case "/":
      res.write(fs.readFileSync("../clients/client-user.html"));
      res.end();
      break;
    case "/api/history":
      request('http://www.google.com/robots.txt', function (error, response, body) {
        res.write(body);
        res.end();
      });
      break;
  }
}).listen(443);

var httpServer = http.createServer(function (req, res) {
  res.writeHead(301, { 'Location': 'https://' + serverHostname + req.url });
  res.end("Redirecting...");
}).listen(80);
 
const wss = new WebSocket.Server({ server: sslServer, clientTracking: true });

function noop() {}

function heartbeat() {
  this.isAlive = true;
  log("Heartbeat package received.", "DEBUG");
}

wss.on('listening', function(){
  log("Listening for incoming WebSockets...", "DEBUG");
})

wss.on('connection', function connection(ws) {
  log("New Connection Established. Current Online: " + JSON.stringify(wss.clients), "DEBUG");
  ws.isAlive = true;
  ws.on('pong', heartbeat);
  ws.on('message', function incoming(message, req) {
    procReq(message, ws);
  });
  ws.on('error', (e) => console.log('Client connection error: [ code:', e.code, ', errno:', e.errno, ']. More details:\n', e));
  ws.on('close', function close() { log('Connection Disconnected. Current Online:' + JSON.stringify(wss.clients), "DEBUG"); });
});


const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 15000);

function log(msg, state) {
  var time = new Date();
  var hour = time.getHours();
  var min = time.getMinutes();
  var sec = time.getSeconds();
  var ms = time.getMilliseconds();
  console.log("[%i:%i:%i.%i] [%s] %s", hour, min, sec, ms, state, msg);
}

// procReq = processRequest

function procReq(msg, wsObject, userIp) {
  var message = JSON.parse(msg);
  console.log('received: %j', msg);
  var action = message.action;

  switch (action) {
    case "post":
      //console.log("message.name: %s", message.data.name);
      //console.log("message.message: %s", message.data.message);
      //console.log("message.time: %s", message.data.time);
      //insertSql(message.name, message.message, message.time, userIp);
      var names = xss(message.data.name);
      var messages = xss(message.data.message);
      var times = message.data.time;
      var dexss = {
        name: names,
        message: messages,
        time: times
      }
      wsObject.send(respParse(dexss, "received"));
      boardcast(dexss, "newmessage");
      break;
    default:
      console.info("Invalid action type: ", action);
  }

}

function boardcast(message, type) {
  wss.clients.forEach(function each(client) {
    if (client !== wss && client.readyState === WebSocket.OPEN) {
      client.send(respParse(message, type));
    }
  });
  console.log("Sending: %s", respParse(message, type))
}

function formatSend(message, type) {
  wss.send(respParse(message, type));
}

function respParse(dataObject, type) {
  // 构造响应内容
  var time = new Date().getTime();
  var object = {
    "status": "ok",
    "time": time,
    "type": type,
    "hash": md5(JSON.stringify(dataObject)),
    "data": dataObject
  }
  return JSON.stringify(object);
}

function md5(text) {
	return crypto.createHash('md5').update(text).digest('hex');
}