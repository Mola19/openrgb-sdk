const { Client, utils } = require("../src/index.js"); // for your usecase use require("openrgb-sdk")
const ms = 50;

async function breathing () {
	// initiate a client and connect to it
	const client = new Client("Example", 6742, "localhost")
	await client.connect()

	let frequency = 0.5
	let color = utils.color(255)

	// create deviceList
	let deviceList = []
	let deviceCount = await client.getControllerCount()
	
	// fill deviceList
	for (let deviceId = 0; deviceId < deviceCount; deviceId++) {
		let device = await client.getControllerData(deviceId)
		if (device.modes.filter(el => el.name == "Direct")[0]) {
			await client.updateMode(deviceId, "Direct")
			deviceList[deviceId] = device
		}
	}

	async function loop (offset = 0) {
		// get brightness via sine wave
		let brightness = Math.abs(Math.sin(offset * frequency))

		// multiply every value with the brightness to make it darker
		let new_color = Object.fromEntries(Object.entries(color).map(el => [el[0], Math.floor(el[1] * brightness)]))
		
		deviceList.forEach((element, i) => {
			if (!element) return

			// update the leds with the calculated color
			client.updateLeds(i, Array(element.colors.length).fill(new_color))
		})

		// restart the loop
		setTimeout(_ => loop(offset + 0.1), ms)
	}

	// start the loop
	loop()
}

breathing()

