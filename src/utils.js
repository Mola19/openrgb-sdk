let utils = (type, value) => {
	if (!type || !value) throw new Error("no type or value given")

	if (utils[type] && typeof utils[type] == "function") {
		return utils[type](value)
	} else throw "type is invalid"
}

let config = {
	direction: {
		func: function (value) {
			if (isNaN(+utils["direction"][value])) throw new Error("invalid value")

			return utils["direction"][value]
		},
		obj: {
			left: 0,
			right: 1,
			up: 2,
			down: 3,
			horizontal: 4,
			vertical: 5 
		}
	},
	deviceType: {
		func: function (value) {
			if (isNaN(+utils["deviceType"][value])) throw new Error("invalid value")

			return utils["deviceType"][value]
		},
		obj: {
			motherboard: 0,
			dram: 1,
			gpu: 2,
			cooler: 3,
			ledstrip: 4,
			keyboard: 5,
			mouse: 6,
			mousemat: 7,
			headset: 8,
			headsetStand: 9,
			gamepad: 10,
			light: 11,
			unknown: 12
		}
	},
	command: {
		func: function (value) {
			if (isNaN(+utils["command"][value])) throw new Error("invalid value")

			return utils["command"][value]
		},
		obj: {
			requestControllerCount: 0,
			requestControllerData: 1,
			requestProtocolVersion: 40,
			setClientName: 50,
			deviceListUpdated: 100,
			resizeZone: 1000,
			updateLeds: 1050,
			updateZoneLeds: 1051,
			updateSingleLed: 1052,
			setCustomMode: 1100,
			updateMode: 1101,
		}
	}
}

for (let type in config) {
	let { func, obj } = config[type]

	utils[type] = func

	for (val in obj) {
		utils[type][val] = obj[val]
	}
}

module.exports = utils
