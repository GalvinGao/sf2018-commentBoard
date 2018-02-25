<div align="center">
  <h1>Kinglee sf-2018: Comment Board System</h1>
  <blockquote>An SaaS architecture, event-driven and real-time synchronizing comment board system using NodeJS.</blockquote>
</div>

![David Dependencies Watcher](https://david-dm.org/GalvinGao/sf2018-commentBoard.svg)
[![Dependency Status](https://beta.gemnasium.com/badges/github.com/GalvinGao/sf2018-commentBoard.svg)](https://beta.gemnasium.com/projects/github.com/GalvinGao/sf2018-commentBoard)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FGalvinGao%2Fsf2018-commentBoard.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FGalvinGao%2Fsf2018-commentBoard?ref=badge_shield)
[![FOSSA Scan Report](https://img.shields.io/badge/license%20scan-report-blue.svg)](https://app.fossa.io/reports/68a548b4-d2e6-422c-bc6a-2830b1bb0296)

## Features

- Uses **NodeJS**, **MySQL** as backend and flavored with native **WebSocket**
- JSON data transmitting
- HTTPS backend and WebSocketSecure (wss://) supported
- Message delivery checking
- XSS Blocked
- Friendly UI
- Easily switch to backup backend
- Completed Logging System

## TODOS

- [ ] Improve `clients/client-user.html`; Major problem is the UI & Animation;
- [ ] Improve `clients/client-bigboard.html`; Major problem is object alignment;
- [ ] Make `clients/admin.html` usable;
- [ ] Complete test script;
- [ ] Make it more school...

## Server Configuration

```javascript
if (iCanUseSchoolsServer) {
  deployAt(SchoolsServer)
} else {
  deployAt(vultr)
  setUpPrivateNetwork()
  setUpStatusMonitor({ enable: ['dns', 'adminUI'] })
}
```

## Artitecture

```

                        +-----------+
                        |           |
                        |  Clients  |
                        |           |
                        +-----+-----+
                              ^
                              |
                              |
                              +-----+
                              | CN2 |
                              +-----+
                              |
                              |
+-----------------------------------------------------------------------------------------------------------+
|                             |                                                                             |
|                             |                                                                             |
|                +------------+-------------+           +----------------------------------+                |
|                |                          |           |                                  |                |
|                | Main Server (run NodeJS) | +-------+ | Main Database Server (run MySQL) |                |
|                | [Provide]                | |Vultr's| | [Provide]                        <----------+     |
|      +--------->  : HTTPS                 <-+Private+->  : MySQL Database                |          |     |
|      |         |  : WSS                   | |Network| |  : MySQL Hot Backup              |          |     |
|      |         |  : MySQL Actions         | +-------+ |                                  |          |     |
|      |         |                          |           +------------------^---------------+          |     |
|      |         +------------^-------------+                              |                          |     |
|      |                      |                                            |                          |     |
|      |                      |                                            |                          |     |
|      |                      |          +-----------------------+         |                          |     |
+----------------------------------------+ Hardware WAF by Vultr +------------------------------------------+
|      |                      |          +-----------------------+         |                          |     |
|      |                      |                                            |                          |     |
|      |                      |                                            |                          |     |
|      |                      |                     +----------------------v------------------+       |     |
|      |       +--------------v---------------+     |                                         |       |     |
|      |       |                              |     | Backup Database Server (run MySQL)      |       |     |
|      |       | Backup Server (run NodeJS)   |     | [Provide]                               |       |     |
|      +-------> [Provide]                    <----->  : Fully capability of the Main Server  <-------+     |
|      |       |  : {Fully Support on running |     | [Settings]                              |       |     |
|      |       |  : the Main Server Service } |     |  : MySQL will run in duplicate mode     |       |     |
|      |       |                              |     |                                         |       |     |
|      |       +------------------------------+     +-----------------------------------------+       |     |
|      |                                                                                              |     |
|      |                                                                                              |     |
|      |                                                                                              |     |
|      |                              +-----------------------------+                                 |     |
|      |                              |                             |                                 |     |
|      +------------------------------> Service Monitor (run:)      <---------------------------------+     |
|                                     |  : ServerStatus             |                                       |
|                                     |  : Down Detection           |                                       |
|                                     |  : DNS Switcher             |                                       |
|                                     | [Provide]                   |                                       |
|                                     |  : { Switch DNS to Backup   |                                       |
|                                     |  : Server when Main Server  |                                       |
|                                     |  : down }                   |                                       |
|                                     |  : Provide Status Page      |                                       |
|                                     |                             |               +-----------------------+
|                                     +-----------------------------+               |                       |
|                                                                                   | Software WAF by Vultr |
|                                                                                   |                       |
+-----------------------------------------------------------------------------------+-----------------------+

```


## Install

### Ready the environment

```shell
$ chmod -R 777 deploy.sh
$ ./deploy.sh
$ mysql -u [your_mysql_username_here] -p sfcomments < create-tables.sql
```

### Go!

```shell
$ node server.js
```

## Interface

### [WebSocket] Client -> Server _{Request}_

#### Actions & Data Arguments

`String post`: Post new _comments_ to the server.
- `String name`: Comment's _name_.
- `String comment`: Comment _content_.
- `Int time`: Client _time_.

#### Structure

```javascript
{
    "action": "post | ...",
    "time": $current-client-time,
    "data": {
        "name": $name,
        "message": $message,
        "time": $message-send-time
    }
}
```


### [WebSocket] Server -> Client _{Response}_

#### Structure

```javascript
{
    "status": "ok | warn | error | fatal",
    "time": $server-time,
    "type": "received | newmessage | history(php-api)",
    "hash": $data-md5-hash,
    "data": @SEE-BELOW@
}
```

#### `data` Structure

##### `action: post`

```javascript
{
    "name": $posted-name,
    "comment": $posted-comment,
    "time": $posted-time
}
```

##### `action: rce`

```javascript
{
    "code": "javascript",
    "evalcode": $javascript-code-to-execure,
    "time": $execute-time
}
```

##### `action: checkcount` (Deprecated)

```javascript
{
    "count": $server-comments-count,
    "counttime": $counted-at-this-time
}
```

##### `event: newmessage`
###### ! IMPORTANT: When event is received and check it is valid, then _**broadcast**_ to all other clients. !

```javascript
{
    "name": $other-post-name,
    "comment": $other-post-comment,
    "time": $other-post-time
}
```

### [historyFetch] Client(ajax) -https-> Server(php) _{Response}_

#### Structure

##### `response.data.status === "ok"`

```javascript
{
    "status": "ok",
    "type": "history",
    "data": [
        "name": $history-post-data-name,
        "message": $history-post-data-message,
        "time": $history-post-data-time
    ]
}
```

##### `response.data.status === "error"`

```javascript
{
    "status": "error",
    "message": $backend-error-message
}
```

## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FGalvinGao%2Fsf2018-commentBoard.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FGalvinGao%2Fsf2018-commentBoard?ref=badge_large)