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
}
module.exports = config;