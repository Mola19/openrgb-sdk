// this is an example of an advanced mode, meaning it is easier for the computer to calculate

const { Client } = require("../src/index.js"); // for your usecase use require("openrgb-sdk")
const ms = 100;

async function rainbow_advanced () {
	// initiate a client and connect to it
	const client = new Client("Example", 6742, "localhost")
	await client.connect()

	// create deviceList
	let deviceList = []
	let deviceCount = await client.getControllerCount()
	
	// fill deviceList
	for (let deviceId = 0; deviceId < deviceCount; deviceId++) {
		let device = await client.getControllerData(deviceId)
		// filter out devices, that don't have a direct mode and set remaining to direct
		if (device.modes.filter(el => el.name == "Direct")[0]) {
			await client.updateMode(deviceId, "Direct")
			deviceList[deviceId] = device
		}
	}

	// get length of biggest zone
	let longestZone = Math.max(...new Set(deviceList.map(el => Math.max(...new Set(el.zones.map(el1 => el1.ledsCount))))))

	// create the first colors of the rainbow 
	let rainbow = get_rainbow(longestZone, 0)

	// function, that creates an amout of rgb objects in an array based on the given number
	function get_rainbow (amount, offset) {
		let output = []
		var frequency = 0.15;
		for (var i = 0; i < amount; ++i) {
			red = Math.round(Math.sin(frequency * i - offset * frequency - 0) * 127 + 128)
			green = Math.round(Math.sin(frequency * i - offset * frequency - 2) * 127 + 128)
			blue = Math.round(Math.sin(frequency * i - offset * frequency - 4) * 127 + 128)
	
			output.push({red, green, blue})
		}
		return output
	}

	async function loop (offset = longestZone) {
		// delete the last rgb object and add one to the front
		rainbow.pop()
		rainbow.unshift(get_rainbow(1, offset)[0])

		// update colors of all devices
		for (let deviceId = 0; deviceId < deviceCount; deviceId++) {
			if (!deviceList[deviceId]) continue;

			let colors = []
			
			// concatenating all Zones instead of using updateZoneLeds, because that minimizes cpu usage
            for (let zoneId = 0; zoneId < deviceList[deviceId].zones.length; zoneId++) {
				colors = colors.concat(rainbow.slice(0, deviceList[deviceId].zones[zoneId].ledsCount))
            }

			await client.updateLeds(deviceId, colors)
		}
		
		// restart the loop
		setTimeout(_ => loop(offset + 1), ms)
	}

	// start the loop
	loop()
}

rainbow_advanced()

