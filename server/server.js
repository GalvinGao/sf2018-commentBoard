const WebSocket = require('ws');
const mysqlConn = require('mysql');
const crypto = require('crypto');
const xss = require('xss');
const https = require('https');
const fs = require('fs');

// HTTPS Config
const keypath = process.cwd()+'/server.key'; // HTTPS Server Certificate Key
const certpath = process.cwd()+'/server.crt'; // HTTPS Server Certificate

/*

function insertSql(name, comment, time) {
  var ip = req.connection.remoteAddress;
  var sqlParam = [ip, time, name, comment];

  connection.query('INSERT INTO comments(id,ip,time,name,comment) VALUES(0,?,?,?,?)', sqlParam, function (error, results, fields) {
    if (error) throw error;
    console.log('MySQL Response: ', results);
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

var server = https.createServer(sslOptions, function (req, res) {
    res.writeHead(403); // Response https connections
    res.end("403 Forbidden\nPowered by NodeJS\nCopyright by Galvin.G 2017-2018. All rights reserved.");
}).listen(443);
 

const wss = new WebSocket.Server({ server: server });

function noop() {}

function heartbeat() {
  this.isAlive = true;
  log("Heartbeat package received.")
}

wss.on('listening', function(){
  log('Listening for incoming WebSockets...');
})

wss.on('connection', function connection(ws) {
  ws.isAlive = true;
  ws.on('pong', heartbeat);
  ws.on('message', function incoming(message) {
    procReq(message, ws);
  });
  ws.on('error', (e) => console.log('Client connection error: [ code:', e.code, ', errno:', e.errno, ']. More details:\n', e));
});


const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 15000);

function log(msg) {
  var time = new Date();
  var hour = time.getHours();
  var min = time.getMinutes();
  var sec = time.getSeconds();
  var ms = time.getMilliseconds();
  console.log("[%i:%i:%i.%i] %s", hour, min, sec, ms, msg);
}

// procReq = processRequest

function procReq(msg, wsObject) {
  var message = JSON.parse(msg);
  console.log('received: %j', msg);
  var action = message.action;

  switch (action) {
    case "post":
      console.log("message.name: %s", message.data.name);
      console.log("message.message: %s", message.data.message);
      console.log("message.time: %s", message.data.time);
      //insertSql(message.name, message.message, message.time);
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