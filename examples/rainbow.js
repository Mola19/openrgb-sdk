const openrgb = require("../src/index.js"); // for your usecase use require("openrgb-sdk")
const ms = 100; // you might want to change the time between updates for better performance and more smoothness

async function start() {
	const client = new openrgb.OpenRGBClient({
		host: "localhost",
		port: 6742,
		name: "Example"
	})
	
	await client.connect()
	const controllerCount = await client.getControllerCount()
	
	for (let deviceId = 0; deviceId < controllerCount; deviceId++) {
		await client.updateMode(deviceId, 0)
	}

	function get_rainbow(offset) {
		let rainbow = []
		var frequency = .3;
		for (var i = 0; i < 120; ++i) {
			red   = Math.round(Math.sin(frequency * i - offset * frequency - 0) * 127 + 128)
			green = Math.round(Math.sin(frequency * i - offset * frequency - 2) * 127 + 128)
			blue  = Math.round(Math.sin(frequency * i - offset * frequency - 4) * 127 + 128)
	
			rainbow.push({red, green, blue})
		}
		return rainbow
	}
	
	(async function loop (offset = 0) {
		let rainbow = get_rainbow(offset)
		for (let deviceId = 0; deviceId < controllerCount; deviceId++) {
			const { colors } = await client.getControllerData(deviceId);
			
			await client.updateLeds(deviceId, rainbow.slice(0, colors.length))
		}
		setTimeout(_ => loop(offset + 1), ms)
	})()
}

start()
