const { Client } = require("../src/index.js"); // for your usecase use require("openrgb-sdk")
const ms = 100;

async function rainbow () {
	// initiate a client and connect to it
	const client = new Client("example", 6742, "localhost");
	await client.connect()
	
	const deviceCount = await client.getControllerCount()
	
	for (let deviceId = 0; deviceId < deviceCount; deviceId++) {
		await client.updateMode(deviceId, 0)
	}

	// function that returns an array with rgb-objects
	function get_rainbow(offset) {
		let rainbow = []
		var frequency = .3;

		for (var i = 0; i < 120; ++i) {
			red = Math.round(Math.sin(frequency * i - offset * frequency - 0) * 127 + 128)
			green = Math.round(Math.sin(frequency * i - offset * frequency - 2) * 127 + 128)
			blue = Math.round(Math.sin(frequency * i - offset * frequency - 4) * 127 + 128)
	
			rainbow.push({red, green, blue})
		}

		return rainbow
	}
	
	async function loop (offset = 0) {
		// get a new rainbow
		let rainbow = get_rainbow(offset)

		// loop through every device to update the leds to the rainbow
		for (let deviceId = 0; deviceId < deviceCount; deviceId++) {
			const { colors } = await client.getControllerData(deviceId);
			
			await client.updateLeds(deviceId, rainbow.slice(0, colors.length))
		}

		// restart the loop
		setTimeout(_ => loop(offset + 1), ms)
	}

	// start the loop
	loop()
}

rainbow()
