const config = {
	adminUrl: "/admin",
	evalUrl: "/admin/api/eval",
	bigBoardUrl: "/view/board",
	adminToken: "PFaHq1hCgq4jovF3zEmalezz",
	adminPasswd: "Galvin-Gao-sf2018-ADMIN",
	keypath: "/etc/letsencrypt/live/dev.khs.science/privkey.pem", // HTTPS Server Private Key [ENV-FLAG]
	certpath: "/etc/letsencrypt/live/dev.khs.science/fullchain.pem", // HTTPS Server Certificate [ENV-FLAG]
	// HTTP jumps to HTTPS - Hostname Config
	// PLEASE MAKE SURE THIS IS CORRECTLY CONFIGURED!
	// NO NEED FOR "/" OR "http://"!
	serverHostname: "dev.khs.science",
	// Use request to get the api and then echo it.
	// MAKE SURE this is CORRECTLY CONFIGURED
	// Otherwise History Message WILL NOT WORK
    // [18.3.9]: Deprecated.
	historyMessageApi: "http://localhost:8888/",
	// WebSocket Ping Interval (miliseconds)
	pingInterval: 15000,
	// Debug Switcher [ENV-FLAG]
	// if true then when log (bunyan) it will trace the file
	debug: true,
	// Bunyan Log Stream, supports a lot of streams.
	// Detailed at: https://github.com/trentm/node-bunyan#adding-a-stream
	logStreams: [
		{
			level: 'info',
			stream: process.stdout
		},
		{
			level: 'trace',
			path: 'log/main.log'
		}
	],
  // Talk Admin Post API [Add]; Token already included in URI
  talkAdmin: {
    entry: "/admin/api/talkadmin/EV4kdK3LuuDyLVNjK5BlBlOa2U0zH8r1/talkadmin",
    // 'Downward Link' Token; Use this to control whether the choice from admin was authed
    downwardToken: "hQ1ZcX0SVOIv322CfdlwzY3nDIxieUd2"
  },
  // MySQL Credentials
  mysqlCredentials: {
    host: 'localhost',
    port: '3306',
    user: 'sf2018',
    password: 'sf2018',
    database: 'sfcomments'
  }
}

module.exports = config;
