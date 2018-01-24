const WebSocket = require('ws');
const mysqlConn = require('mysql');

function insertSql(ip, name, comment) {
	var sqlParam = [ip, name, comment];

	connection.query('INSERT INTO comments(id,ip,name,comment) VALUES(0,?,?,?)', function (error, results, fields) {
	  if (error) throw error;
	  console.log('The solution is: ', results[0].solution);
	});
}
/*
var connection = mysqlConn.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'commentdb'
});

connection.connect();
*/

const wss = new WebSocket.Server({ port: 8080 });

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
    var message = JSON.parse(message);
    console.log('received: %j', message);
    console.log("message.name: %s", message.name);
    console.log("message.message: %s", message.message);
    console.log("message.time: %s", message.time)
    //console.log('message.name: %s, message.message: %s', message.name, message.message)
    
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