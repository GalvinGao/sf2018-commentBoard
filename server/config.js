const config = {
	adminUrl: "/admin/stats",
	evalUrl: "/admin/api/eval",
	adminToken: "PFaHq1hCgq4jovF3zEmalezz",
	keypath: "/etc/letsencrypt/live/dev.khs.science/privkey.pem", // HTTPS Server Private Key
	certpath: "/etc/letsencrypt/live/dev.khs.science/fullchain.pem", // HTTPS Server Certificate		
	// HTTP jumps to HTTPS - Hostname Config
	// PLEASE MAKE SURE THIS IS CORRECTLY CONFIGURED!
	// NO NEED FOR "/" OR "http://"!
	serverHostname: "dev.khs.science",
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
			path: 'log/main.log'
		}
	]
}

module.exports = config;