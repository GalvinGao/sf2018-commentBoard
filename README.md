# sf-2018 Comment Board

## Features

- Uses **NodeJS**, **PHP**, **MySQL** as backend and flavored with **WebSocket**.
- JSON data transmitting.
- HTTPS backend and WebSocketSecure (wss://) supported.
- Message delivery checking.
- XSS Blocked.
- Friendly UI.
- ~ 5,000 Request/s processing speed.
- Be able to keep ~ 300 Connections per CPU Core.

## Server Configuration

Vultr's **Bare Metal Instance**
- CPU: E3-1270v6 (8 Cores @ 3.8GHz)
- Memory: 32768MB
- Bandwidth: 5000GB
- SSD Disk: 2x240 Software RAID1


## Install

### Ready the environment

```shell
$ cd server
$ chmod -R 777 deploy-env.sh
$ ./deploy-env.sh
$ mysql -u <username> -p sfcomments < create-tables.sql
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

##### `action: checkcount` (Deprecated)

```javascript
{
	"count": $server-comments-count,
	"counttime": $counted-at-this-time
}
```

##### `event: received-other-posts`
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