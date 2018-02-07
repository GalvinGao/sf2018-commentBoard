const config = {
	adminUrl: "/admin/stats",
	adminToken: "PFaHq1hCgq4jovF3zEmalezz",
	keypath: "/etc/letsencrypt/live/sf2018.dev.iblueg.cn/privkey.pem", // HTTPS Server Private Key
	certpath: "/etc/letsencrypt/live/sf2018.dev.iblueg.cn/fullchain.pem", // HTTPS Server Certificate		
	// HTTP jumps to HTTPS - Hostname Config
	// PLEASE MAKE SURE THIS IS CORRECTLY CONFIGURED!
	// NO NEED FOR "/" OR "http://"!
	serverHostname: "sf2018.dev.iblueg.cn",
	// Use request to get the api and then echo it.
	// MAKE SURE this is CORRECTLY CONFIGURED
	// Otherwise History Message WILL NOT WORK
	historyMessageApi: "http://localhost:8888/",
	// WebSocket Ping Interval (miliseconds)
	pingInterval: 15000,
	// Debug Switcher
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
			type: 'rotating-file',
			level: 'trace',
			path: 'log/main.log',
			period: '1h',
			count: 1000
		}
	]
}

module.exports = config;