const { Client, utils } = require("../src/index.js"); // for your usecase use require("openrgb-sdk")
const ms = 200;

async function random () {
	// initiate a client and connect to it
	const client = new Client("Example", 6742, "localhost"); 
	await client.connect()

	const controllerCount = await client.getControllerCount() 
	
	// set devices to direct mode
	for (let deviceId = 0; deviceId < controllerCount; deviceId++) { 
		await client.updateMode(deviceId, "Direct")
	}

	// function that retruns array of random rgb objects
	function get_random (length) {

		let random = []
		for (var i = 0; i < length; ++i) {
			red = Math.floor(Math.random() * 128)
			green = Math.floor(Math.random() * 128)
			blue = Math.floor(Math.random() * 128)
	
			random.push({red, green, blue})
		}

		return random
	}
	
	// function that loops and calls above function to create random colors
	async function loop () {
		for (let deviceId = 0; deviceId < controllerCount; deviceId++) {
			const { colors } = await client.getControllerData(deviceId);
			
			await client.updateLeds(deviceId, get_random(colors.length))
		}

		// restart the loop
		setTimeout(loop, ms)
	}

	// start the loop
	loop()
}

random()
