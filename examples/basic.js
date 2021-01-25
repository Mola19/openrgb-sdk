const { Client } = require("../src/index.js"); // for your usecase use require("openrgb-sdk")

async function basic() {
	// initiate a client and connect to it
	const client = new Client("Example", 6742, "localhost")
	await client.connect()

	// get the amount of connected devices
	let deviceCount = await client.getControllerCount()
	console.log(deviceCount)

	// set the first device to its third mode
	await client.updateMode(0, 3)

	// get the data of the first device and console log it
	let device = await client.getControllerData(0)
	console.log(device)

	// disconnect the client
	await client.disconnect()
}

basic()
