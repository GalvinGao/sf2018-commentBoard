# sf-2018 Public Site

Uses **NodeJS** and **PHP** as backend, and **WebSocket** to dynamically update posts.

## Client -> Server

### Actions & Data Arguments

`String post`: Post new _comments_ to the server.
- `String name`: Comment's _name_.
- `String comment`: Comment _content_.
- `Int time`: Client _time_.

`String checkcount`: Check if all of the comments are synced.
- `Int count`: Client's comment count.

## Server -> Client

### Structure

```javascript
{
	"status": "ok | warn | error | fatal",
	"time": "$server-time",
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

#### `action: checkcount`

```javascript
{
	"count": $server-comments-count,
	"counttime": $counted-at-this-time
}
```

#### `event: received-other-posts`
##### ! IMPORTANT: When event is received and check it is valid, then **broadcast** to all other clients. !

```javascript
{
	"name": $other-post-name,
	"comment": $other-post-comment,
	"time": $other-post-time
}
```
