const WebSocket = require('ws');
const mysqlConn = require('mysql');
const crypto = require('crypto');
const xss = require('xss');
const https = require('https');
const http = require('http');
const fs = require('fs');
const request = require("request");
const bunyan = require('bunyan');
const url = require('url');
const config = require('./config'); // Personal Configuration File

// Initialize Starts Here //

// Seriously without config file I will be out of my mind lol...
if (typeof config === 'undefined') {
  console.error("Where's ur config file bro? I'm leaving now...");
  process.exit();
}

// Log Module by bunyan
const logMysql = bunyan.createLogger({name: "MySQL"});
const logWss = bunyan.createLogger({name: "WebSocket-Server"});
const logWsscp = bunyan.createLogger({name: "WebSocket-ContentParse"});
const logHttp = bunyan.createLogger({name: "HTTP-Server"});
const logHttps = bunyan.createLogger({name: "HTTPS-Server"});

// HTTPS Config
const keypath = '/etc/letsencrypt/live/sf2018.dev.iblueg.cn/privkey.pem'; // HTTPS Server Certificate Key
const certpath = '/etc/letsencrypt/live/sf2018.dev.iblueg.cn/fullchain.pem'; // HTTPS Server Certificate

// HTTP jumps to HTTPS - Hostname Config
// PLEASE MAKE SURE THIS IS CORRECTLY CONFIGURED!
// NO NEED FOR "/" OR "http://"!
const serverHostname = "sf2018.dev.iblueg.cn";

// Use request to get the api and then echo it.
// MAKE SURE this is CORRECTLY CONFIGURED
// Otherwise History Message WILL NOT WORK
const historyMessageApi = "http://localhost:8888/";

// WebSocket Ping Interval (miliseconds)
const pingInterval = 15000;

// IP cause Problems...
// Believe me.
var userIp = "";

// Initialize Ends Over Here ~ //

function insertSql(name, comment, time) {
  ip = (userIp) ? userIp : "0.0.0.0";
  var sqlParam = [ip, time, name, comment];
  
  connection.query('INSERT INTO comments(id,ip,time,name,comment) VALUES(0,?,?,?,?);', sqlParam, function (error, results, fields) {
    if (error) throw error;
    log('Message Inserted. MySQL Response: ' + results, "INFO");
  });
}

const connection = mysqlConn.createConnection({
  host     : "localhost",
  port     : "3306",
  user     : "sf2018",
  password : "sf2018",
  database : "sfcomments"
});

connection.connect(handleError);
connection.on('error', handleError);

function handleError (err) {
  if (err) {
    // 如果是连接断开，自动重新连接
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      log("MySQL Connection Lost. Reconnecting...", "WARN");
      connection.connect();
    } else {
      log("MySQL Error:", "FATAL");
      logMysql.error(err.stack || err);
    }
  }
}

var sslOptions = {
  key: fs.readFileSync(keypath),
  cert: fs.readFileSync(certpath)
};

var sslServer = https.createServer(sslOptions, function (req, res) {
  //res.writeHead(403); // Response https connections
  //res.end("403 Forbidden\nPowered by NodeJS\nCopyright by Galvin.G 2017-2018. All rights reserved.");
  reqPath = url.parse(req.url)['pathname'];
  switch (reqPath) {
    case "/":
      res.setHeader('Content-Type', 'text/html');
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET");
      res.setHeader("Content-Encoding", "utf-8");
      res.write(fs.readFileSync("../clients/client-user.html"));
      res.end();
      break;
    case "/api/history":
      res.setHeader('Content-Type', 'application/json');
      res.setHeader("Expires", "Thu, 01 Jan 1970 00:00:01 GMT"); 
      res.setHeader("Cache-Control", "no-cache"); 
      res.setHeader("Cache-Control", "must-revalidate");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET");
      res.setHeader("Content-Encoding", "utf-8");
      request.get(historyMessageApi).pipe(res);
      break;
    case config.adminUrl:
      var token = function(){
      	try {
      	  var tokenParsed = querystring.parse(url.parse(req.url)['query'])['token'];
      	  logHttps.info("Token %s received", tokenParsed);
      	  return tokenParsed;
      	} catch (e) {
      	  logHttps.warn("Query string parse error.");
      	  return;
      	}
      }
      if (token() === config.adminToken) {
      	// Authed.
      	logHttps.info("Admin Stats page authed using token %s.", "PFaHq1hC");
      	res.end("You have been authed baby! Yeah!");
      } else {
      	logHttps.warn("Admin Stats page is not authed due to wrong token %s.", token());
      	// Pretend to be Nothing Happened LOLLLLLLL.
      	res.writeHead(404);
        res.write(fs.readFileSync("../clients/404.html"))
        res.end();
      }
      break;
    default:
      res.writeHead(404);
      res.write(fs.readFileSync("../clients/404.html"))
      res.end();
  }
}).listen(443);

var httpServer = http.createServer(function (req, res) {
  logHttp.info({req: req}, 'HTTP Request received.');
  res.writeHead(301, { 'Location': 'https://' + serverHostname + req.url });
  res.end("Redirecting...");
}).listen(80);
 
const wss = new WebSocket.Server({ server: sslServer, clientTracking: true });

function noop() {}

function heartbeat() {
  this.isAlive = true;
  log("WebSocket Heartbeat package received.", "DEBUG");
}

wss.on('listening', function(){
  log("Listening for incoming WebSockets...", "INFO");
})

wss.on('connection', function connection(ws) {
  log("New WebSocket Connection Established.", "INFO");
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
}, pingInterval);

function log(msg, state) {
  var time = new Date();
  var hour = time.getHours();
  var min = time.getMinutes();
  var sec = time.getSeconds();
  var ms = time.getMilliseconds();
  console.log("[%i:%i:%i.%i] [%s] %s", hour, min, sec, ms, state, msg);
}

// procReq = processRequest

function procReq(msg, wsObject) {
  console.log('Received (JSON): %j', msg);
  // console.log('Received (String): %s', msg);
  try {
    var message = JSON.parse(msg);
  } catch (e) {
    log("Not a valid JSON client request.", "ERROR");
    wsObject.send("{status: \"error\", message: \"Invalid JSON\"}");
    return;
  }
  var action = message.action;

  switch (action) {
    case "post":
      //console.log("message.name: %s", message.data.name);
      //console.log("message.message: %s", message.data.message);
      //console.log("message.time: %s", message.data.time);
      var names = xss(message.data.name);
      var messages = xss(message.data.message);
      var times = xss(message.data.time);
      insertSql(names, messages, times);
      var dexss = {
        name: names,
        message: messages,
        time: times
      }
      wsObject.send(respParse(dexss, "received"));
      boardcast(dexss, "newmessage");
      break;
    default:
      log("Invalid client action type: " + action, "ERROR");
  }

}

function boardcast(message, type) {
  log("Broadcasting: " + respParse(message, type), "INFO");
  wss.clients.forEach(function each(client) {
    if (client !== wss && client.readyState === WebSocket.OPEN) {
      client.send(respParse(message, type));
    }
  });
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
