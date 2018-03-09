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
  global.connection = mysqlConn.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'sf2018',
    password: 'sf2018',
    database: 'sfcomments'
  })

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
    headers: requestObj.headers
  }
}

var sslOptions = {
  key: fs.readFileSync(config.keypath),
  cert: fs.readFileSync(config.certpath)
}

var sslServer = https.createServer(sslOptions, function (req, res) {
  // res.writeHead(403) // Response https connections
  // res.end('403 Forbidden\nPowered by NodeJS\nCopyright by Galvin.G 2017-2018. All rights reserved.')
  logRequest.trace({req: req}, 'HTTPS Request received.')
  var reqPath = url.parse(req.url)['pathname']
  var queries = querystring.parse(url.parse(req.url)['query'])
  switch (reqPath) {
    case '/':
      res.setHeader('Content-Type', 'text/html')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET')
      res.setHeader('Content-Encoding', 'utf-8')
      res.write(fs.readFileSync('public/client-user.html'))
      res.end()
      break
    case '/api/history':
      // /api/history?page=2&eachpage=5 [ 10, 5 ]
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Expires', 'Thu, 01 Jan 1970 00:00:01 GMT')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Cache-Control', 'must-revalidate')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET')
      res.setHeader('Content-Encoding', 'utf-8')
      // request.get(config.historyMessageApi).pipe(res)
      try {
        var eachpage = parseInt(queries['eachpage']) || 20
        var page = (parseInt(queries['page']) - 1) * eachpage || 1
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
        res.end(respParse(result, 'history'))
      })
      break
    case '/api/report':
      var success = true
      try {
        var ulevel = queries['level']
        var udata = queries['data']
        var umodule = queries['module']
        var success = true
      } catch (e) {
        var success = false
        logHttps.warn({clientQueries: queries, parseErrorMsg: e}, 'Client send an invalid report request, parse error.')
      }

      var reportData = {level: ulevel, module: umodule, data: udata}

      logReport.info({data: reportData}, 'Client report.')

      if (success) {
        res.end(genStatus(true))
      } else {
        res.end(genStatus(false))
      }
      break
    case config.adminUrl:
      if (queries['passwd'] === config.adminPasswd) {
        // Authed.
        res.write(fs.readFileSync('public/admin.html'))
        res.end()
        logHttps.info('Admin page authed.')
      } else {
        logHttps.debug('Admin page NOT authed: Token Invalid.')
        // Pretend to be Nothing Happened LOLLLLLLL.
        res.writeHead(404)
        res.write(fs.readFileSync('public/404.html'))
        res.end()
      }
      break
    case config.evalUrl:
      if (adminAuth(req.url)) {
        var code = queries['code']
        switch (queries['action']) {
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
            res.end('Unknown action type %s.', queries['action'])
            break
        }
      } else {
        res.writeHead(404)
        res.write(fs.readFileSync('public/404.html'))
        res.end()
      }
      break
    case config.bigBoardUrl:
      res.write(fs.readFileSync('public/client-bigboard.html'))
      res.end()
      break
    case config.talkAdminAdd:
      switch (req.method) {
        /*case 'GET':
          switch (queries['action']) {
            case 'nothing':
              // Code: GET /api/{talkAdminApi}?action=nothing
              break
            default:
              res.writeHead(404)
              res.write(fs.readFileSync('public/404.html'))
              res.end()
          }
          break*/
        case 'POST':
          // Code: POST /api/{talkAdminApi}
          var dataSegment = ''
          req.addListener('data', function (chunk) {
            dataSegment += chunk
            if (dataSegment.length > 1e5) return request.connection.destory()
          })
            .addListener('end', function () {
              var postdata = decodeURIComponent(querystring.parse(dataSegment))
              console.log('dataSegment: %s', dataSegment)
              console.log('dataSegmentQuery: %s', querystring.parse(dataSegment))
              console.log('querystring.parse(dataSegment)["JSON"]: %s', querystring.parse(dataSegment)['json'])
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
          break
        default:
          res.writeHead(405)
          res.end(`Method ${req.method} is currently not supported yet`)
          break
      }
      break
    default:
      res.writeHead(404)
      res.write(fs.readFileSync('public/404.html'))
      res.end()
  }
}).listen(443)

http.createServer(function (req, res) {
  logRequest.trace({req: req}, 'HTTP Request received.')
  res.writeHead(301, { 'Location': 'https://' + config.serverHostname + req.url })
  res.end('Redirecting...')
}).listen(80)

const wss = new WebSocket.Server({ server: sslServer, clientTracking: true })

function noop () {}

function heartbeat () {
  this.isAlive = true
  // logWss.trace('WebSocket Heartbeat package received.')
}

wss.on('listening', function () {
  logWss.info('Listening for incoming WebSockets...')
})

wss.on('connection', function connection (ws) {
  logWss.debug('New WebSocket Connection Established.')
  ws.isAlive = true
  ws.on('pong', heartbeat)
  ws.on('message', function incoming (message, req) {
    procReq(message, ws)
  })
  ws.on('error', (e) => logWss.warn('Client connection error: [ code:', e.code, ', errno:', e.errno, ' ]. More details:', e))
  ws.on('close', function close () {
    logWss.debug('Connection Disconnected.')
  })
})

setInterval(function ping () {
  wss.clients.forEach(function each (ws) {
    if (ws.isAlive === false) return ws.terminate()
    ws.isAlive = false
    ws.ping(noop)
  })
}, config.pingInterval)

// procReq = processRequest

function procReq (msg, wsObject) {
  logWsscp.debug('Received WebSocket Data (formatted JSON): %j', msg)
  // console.log('Received (String): %s', msg)
  try {
    var message = JSON.parse(msg)
  } catch (e) {
    logWsscp.debug('Request invalid, parse error. Not a valid client request (JSON). Parsing Error [%s], message content [%s].', e, msg)
    wsObject.send('{ status: \'error\', message: \'Invalid JSON\' }')
    return
  }

  var action = message.action

  switch (action) {
    case 'post':
      logWsscp.info('Got a new message: %s, %s, %s', message.data.name, message.data.message, message.data.time)
      // console.log('message.name: %s', message.data.name)
      // console.log('message.message: %s', message.data.message)
      // console.log('message.time: %s', message.data.time)
      var names = xss(message.data.name)
      var messages = xss(message.data.message)
      var times = xss(message.data.time)
      logWsscp.debug('New Message dexss: %s, %s, %s', names, messages, times)
      insertSql(names, messages, times)
      var dexss = {
        name: names,
        message: messages,
        time: times
      }
      wsObject.send(respParse(dexss, 'received'))
      boardcast(dexss, 'newmessage')
      break
    default:
      logWsscp.debug('Invalid client action type: %s', action)
  }
}

function boardcast (message, type) {
  logWss.info('Broadcasting message: %s', respParse(message, type))
  wss.clients.forEach(function each (client) {
    if (client !== wss && client.readyState === WebSocket.OPEN) {
      client.send(respParse(message, type))
    }
  })
}

function respParse (dataObject, type) {
  // 构造响应内容
  var time = new Date().getTime()
  var object = {
    'status': 'ok',
    'time': time,
    'type': type,
    'data': dataObject
  }
  return JSON.stringify(object)
}

function adminAuth (uurl) {
  var getToken = function (uurl) {
    try {
      var tokenParsed = querystring.parse(url.parse(uurl)['query'])['token']
      logHttps.debug('Token is %s', tokenParsed)
      return tokenParsed
    } catch (e) {
      logHttps.debug('Query string parse error: %s.', e)
      return ''
    }
  }

  var getTimestamp = function (uurl) {
    try {
      var tokenParsed = querystring.parse(url.parse(uurl)['query'])['t']
      logHttps.debug('Timestamp is %s', tokenParsed)
      return tokenParsed
    } catch (e) {
      logHttps.debug('Query string parse error: %s.', e)
      return ''
    }
  }

  var token = getToken(uurl)
  var timestamp = getTimestamp(uurl)

  var expected = md5(config.adminToken + timestamp)
  logService.debug('Expected MD5: %s. Dataset: [%s, %s]', expected, config.adminToken, timestamp)
  var userinput = token
  logService.debug('User Input MD5: %s', userinput)

  if (expected === userinput) {
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
  if (success) {
    var status = 'ok'
  } else {
    var status = 'error'
  }

  return '{ status: "' + status + '" }'
}
