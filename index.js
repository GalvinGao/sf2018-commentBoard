const WebSocket = require('ws')
const mysqlConn = require('mysql')
const crypto = require('crypto')
const xss = require('xss')
const https = require('https')
const http = require('http')
const fs = require('fs')
// const request = require('request')
const bunyan = require('bunyan')
const url = require('url')
const querystring = require('querystring')
const config = require('./config') // Personal Configuration File

// New Frameworks
const express = require('express')
const app = express()

// Initialize Starts Here //

// Seriously without config file I will be out of my mind lol...
if (typeof config === 'undefined') {
  console.error('Where\'s ur config file bro? I\'m leaving now...')
  process.exit(-1)
}

// Log Module by bunyan
const logService = bunyan.createLogger({ name: 'MainService', src: false, streams: config.logStreams })
const logMysql = bunyan.createLogger({ name: 'MySQL', src: config.debug, streams: config.logStreams })
const logWss = bunyan.createLogger({ name: 'WebSocket-Server', src: config.debug, streams: config.logStreams })
const logWsscp = bunyan.createLogger({ name: 'WebSocket-ContentParse', src: config.debug, streams: config.logStreams })
const logHttp = bunyan.createLogger({ name: 'HTTP-Server', src: config.debug, streams: config.logStreams })
const logHttps = bunyan.createLogger({ name: 'HTTPS-Server', src: config.debug, streams: config.logStreams })
const logRequest = bunyan.createLogger({ name: 'WebRequest', streams: [ { level: 'trace', path: 'log/request.log' } ], serializers: { req: requestSerializer } })
const logReport = bunyan.createLogger({ name: 'ReportAPI', streams: [ { level: 'info', stream: process.stdout }, { level: 'trace', path: 'log/report.log' } ] })

logService.info('Service Initialized. Launching server...')

// Initialize Ends Over Here ~ //

function insertSql (name, comment, time) {
  var sqlParam = [time, name, comment]
  connection.query('INSERT INTO comments(id,time,name,comment) VALUES(0,?,?,?)', sqlParam, function (error, results, fields) {
    if (error) {
      logMysql.error('Insert Error: %s', error)
    }
    logMysql.trace('Message Inserted Successfully.')
  })
}

function connectMysql () {
  global.connection = mysqlConn.createConnection(config.mysqlCredentials)
  connection.connect(handleError)
  connection.on('error', handleError)
}
connectMysql()

function handleError (err) {
  if (err) {
    // 如果是连接断开，自动重新连接
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      logMysql.warn('MySQL Connection Lost. Error [%s]. Reconnecting...', JSON.stringify(err))
      connectMysql()
    } else {
      logMysql.fatal('MySQL Connection Error Occurred. Trying to reconnect... Detail: %s', err.stack || err)
      connectMysql()
    }
  }
}

function requestSerializer(requestObj) {
  return {
    method: requestObj.method,
    url: requestObj.url,
    query: requestObj.query,
    headers: requestObj.headers
  }
}

// Create Server. If certificate is usable, then use HTTPS as
// the current server; HTTP requests will automatically being redirected to HTTPS request.
// Otherwise if certificate is unusable, then use HTTP as the current server.
// New created servers will be automatically attached to express and ready to be use.

try {
  var certKey = fs.readFileSync(config.keypath)
  var certFile = fs.readFileSync(config.certpath)
  var sslOptions = {
    key: certKey,
    cert: certFile
  }
  global.currentServer = https.createServer(sslOptions, app).listen(443)
  global.httpServer = http.createServer(httpServerHandler).listen(80)
} catch (e) {
  logService.info('Certificate read error. Launching HTTP server instead of HTTPS.')
  global.currentServer = http.createServer(app).listen(80)
}

// Request Logger
var myLogger = function (req, res, next) {
  logRequest.trace({req: req}, 'HTTPS Request received.')
  res.setHeader('Access-Control-Allow-Origin', 'khs.science')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
  res.setHeader('Content-Encoding', 'utf-8')
  next()
}

app.use(myLogger)

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.end(fs.readFileSync('public/v2.html'))
})

/*

app.get('/new', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.end(fs.readFileSync('public/v2.html'))
})

*/

app.get('/api/history', (req, res) => {
  // /api/history?page=2&eachpage=5 [ 10, 5 ]
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Expires', 'Thu, 01 Jan 1970 00:00:01 GMT')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Cache-Control', 'must-revalidate')
  // request.get(config.historyMessageApi).pipe(res)
  try {
    var eachpage = parseInt(req.query.eachpage) || 20
    var page = (parseInt(req.query.page) - 1) * eachpage || 1
    var sqlParam = [ page, eachpage ]
  } catch (err) {
    logHttps.debug('historyFetch Param Parsing error: ', err)
  }
  connection.query('SELECT name, comment, time FROM `comments` ORDER BY `comments`.`id` DESC LIMIT ?, ?', sqlParam, function (err, result, fields) {
    if (err) {
      logMysql.error('historyFetch Error: %s', err)
      res.end(genStatus(false))
      return
    }
    logMysql.trace(result)
    res.json(respParse(result, 'history'))
    res.end()
  })
})

app.get('/api/report', (req, res) => {
  var success = true
  try {
    var ulevel = req.query.level
    var udata = req.query.data
    var umodule = req.query.module
    var success = true
  } catch (e) {
    var success = false
    logHttps.warn({data: {clientQueries: req.query, parseErrorMsg: e}}, 'Client send an invalid report request, parse error.')
  }

  var reportData = {level: ulevel, module: umodule, data: udata}

  logReport.info({data: reportData}, 'Client report.')

  res.end(genStatus(success))
})

app.get(config.adminUrl, (req, res) => {
  if (req.query.passwd === config.adminPasswd) {
    // Authed.
    res.end(fs.readFileSync('public/admin.html'))
    logHttps.info('Admin page authed.')
  } else {
    logHttps.debug('Admin page NOT authed: Token Invalid.')
    // Pretend to be Nothing Happened LOLLLLLLL.
    res.status(404).end(fs.readFileSync('public/404.html'))
  }
})

app.get(config.evalUrl, (req, res) => {
  if (adminAuth(req.url)) {
    var code = req.query.code
    switch (req.query.action) {
      case 'node':
        logService.info('RCE Event: Eval Node Code: %s', code)
        try {
          var result = eval(code)
        } catch (e) {
          logService.warn('RCE Event: Evaluate Node code error: %s', e)
        }
        // var result = eval(code)
        logService.info('RCE Event: Eval Result: %s', result)
        res.end('RCE: Evaluated node code. Result: %s', result)
        break
      case 'client':
        logService.info('RCE Event: Eval Client Code: %s', code)
        boardcast(code, 'rce')
        res.end('RCE: Boardcasted client code.')
        break
      default:
        res.end('Unknown action type %s.', req.query.action)
        break
    }
  } else {
    res.status(404).end(fs.readFileSync('public/404.html'))
  }
})

app.get(config.bigBoardUrl, (req, res) => {
  res.end(fs.readFileSync('public/client-bigboard.html'))
})

app.post(config.talkAdmin.entry, (req, res) => {
  var postdata = req.body.split('name="json"')[1].split('--------')[0]
  res.end(`Received data [${postdata}]`)
  try {
    var _name = JSON.parse(postdata)[1][0]
    var _comment = JSON.parse(postdata)[2][0]
  } catch (e) {
    return
  }
  var _time = new Date().getTime()
  insertSql(_name, _comment, _time)
  boardcast({
    name: _name,
    message: _comment,
    time: _time
  }, 'newmessage')
})

app.get('/admin/api/user', (req, res) => {
  res.json(respParse(userCount.toString(), 'userCount'))
  res.end()
})

app.all('*', (req, res) => {
  res.status(404).end(fs.readFileSync('public/404.html'))
})

function httpServerHandler (req, res) {
  logRequest.trace({req: req}, 'HTTP Request received.')
  res.writeHead(301, { 'Location': 'https://' + config.serverHostname + req.url })
  res.end('Redirecting...')
}


// ===== [ABOVE] HTTP & HTTPS Server  |  [BELOW] WebSocket Server ===== //


global.userCount = 0

const io = require('socket.io')(currentServer)

logWss.info('Listening for incoming WebSockets...')

io.on('connection', (socket) => {
  ++userCount
  logWss.debug('New WebSocket Connection Established. Current users [%i]', userCount)

  socket.on('hey heres a new message', function (data) {
    // console.info('Got message [%s] [%j]', data, data)
    logWsscp.info('Got a new message: %s, %s, %s', data.name, data.message, data.time)

    var names = xss(data.name)
    var messages = xss(data.message)
    var times = xss(data.time)
    logWsscp.debug('New Message dexss: %s, %s, %s', names, messages, times)
    insertSql(names, messages, times)
    var dexss = {
      name: names,
      message: messages,
      time: times
    }
    socket.broadcast.emit('new message guys', dexss)
    socket.emit('k got it but u have to verify it', dexss)
  })

  socket.on('i want to know everything', (data) => {
    var backdata = {
      id: socket.id,
      users: userCount
    }
    socket.emit('heres everything bro', backdata)
  })

  socket.on('error', (error) => {
    logWss.debug('Client connection error %s', error)
    --userCount
  })

  socket.on('disconnect', () => {
    --userCount
  })
})

// socket.emit('news', { hello: 'world' })

function respParse (dataObject, type) {
  // 构造响应内容
  var time = new Date().getTime()
  var object = {
    'status': 'ok',
    'time': time,
    'type': type,
    'data': dataObject
  }
  return object
}

function adminAuth (uurl) {
  var getToken = function (uurl) {
    try {
      var tokenParsed = querystring.parse(url.parse(uurl)['query'])['token']
      logHttps.debug('Token is %s', tokenParsed)
      return tokenParsed
    } catch (e) {
      logHttps.debug('Query string parse error: %s.', e)
      return false
    }
  }

  var getTimestamp = function (uurl) {
    try {
      var tokenParsed = querystring.parse(url.parse(uurl)['query'])['t']
      logHttps.debug('Timestamp is %s', tokenParsed)
      return tokenParsed
    } catch (e) {
      logHttps.debug('Query string parse error: %s.', e)
      return false
    }
  }

  var token = getToken(uurl)
  var timestamp = getTimestamp(uurl)

  var currentTime = new Date().getTime()

  if (Math.abs(currentTime - timestamp) > 30 * 1000) {
    // If time offset is greater than 30sec, then assume it is a invalid token.
    return false
  }

  var expected = md5(config.adminToken + timestamp)
  logService.debug('Expected MD5: %s. Dataset: [%s, %s]', expected, config.adminToken, timestamp)
  logService.debug('User Input MD5: %s', token)

  if (expected === token) {
    return true
  } else {
    return false
  }

  /*
  if (token == config.adminToken) {
    return true
  } else {
    return false
  }
  */
}

function md5 (text) {
  return crypto.createHash('md5').update(text).digest('hex')
}

function genStatus (success) {
  var status = success ? 'ok' : 'error'
  return '{ status: "' + status + '" }'
}
