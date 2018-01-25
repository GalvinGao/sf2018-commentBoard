# sf-2018 Comment Board

Uses **NodeJS** and **PHP** as backend and flavored with **WebSocket**.

### Table of Contents

[TOC]



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

## Client -> Server

### Actions & Data Arguments

`String post`: Post new _comments_ to the server.
- `String name`: Comment's _name_.
- `String comment`: Comment _content_.
- `Int time`: Client _time_.

### Structure

```javascript
{
    "action": "post || ...",
    "time": $current-client-time,
    "data": {
        "name": $name,
        "message": $message,
        "time": $message-send-time
    }
}
```



## Server -> Client

### Structure

```javascript
{
	"status": "ok | warn | error | fatal",
	"time": $server-time,
	"type": "received | newmessage",
    "hash": $data-md5-hash,
	"data": @SEE-BELOW@
}
```

### `data` Structure

#### `action: post`

```javascript
{
	"name": $posted-name,
	"comment": $posted-comment,
	"time": $posted-time
}
```

#### `action: checkcount` (Deprecated)

```javascript
{
	"count": $server-comments-count,
	"counttime": $counted-at-this-time
}
```

#### `event: received-other-posts`
##### ! IMPORTANT: When event is received and check it is valid, then _**broadcast**_ to all other clients. !

```javascript
{
	"name": $other-post-name,
	"comment": $other-post-comment,
	"time": $other-post-time
}
```
