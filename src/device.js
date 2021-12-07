const bufferpack = require("bufferpack")

module.exports = class Device {
	constructor (buffer, deviceId, protocolVersion) {
		this.deviceId = deviceId

		let offset = 4
		this.type = buffer.readUInt32LE(offset)
		offset += 4;

		let arr = ["name", "description", "version", "serial", "location"]

		if (protocolVersion >= 1) {
			arr = ["name", "vendor", "description", "version", "serial", "location"]
		}

		arr.forEach(value => {
			let { text, length } = readString(buffer, offset)
			this[value] = text
			offset += length
		})

		const modeCount = buffer.readUInt16LE(offset)
		offset += 2
		this.activeMode = buffer.readUInt32LE(offset)
		offset += 4
		const { modes, offset: readModesOffset } = readModes(buffer, modeCount, offset, protocolVersion)
		this.modes = modes
		offset = readModesOffset
		const zoneCount = buffer.readUInt16LE(offset)
		offset += 2
		const { zones, offset: readZonesOffset } = readZones(buffer, zoneCount, offset)
		this.zones = zones
		offset = readZonesOffset

		const ledCount = buffer.readUInt16LE(offset)
		offset += 2

		this.leds = []
		for (let ledIndex = 0; ledIndex < ledCount; ledIndex++) {
			const { text, length } = readString(buffer, offset)
			offset += length
			const color = readColor(buffer, offset)
			offset += 4
			this.leds.push({
				name: text,
				value: color
			})
		}

		const colorCount = buffer.readUInt16LE(offset)
		offset += 2

		this.colors = []
		for (let colorIndex = 0; colorIndex < colorCount; colorIndex++) {
			this.colors.push(readColor(buffer, offset))
			offset += 4
		}
	}
}

function readModes (buffer, modeCount, offset, protocolVersion) {
	const modes = []
	for (let modeIndex = 0; modeIndex < modeCount; modeIndex++) {
		let mode = {}

		mode.id = modeIndex

		let { text: modeName, length: modeNameLength } = readString(buffer, offset)
		mode.name = modeName

		offset += modeNameLength

		let arr = ["value", "flags", "speedMin", "speedMax", "colorMin", "colorMax", "speed", "direction", "colorMode"]

		if (protocolVersion >= 3) {
			arr = ["value", "flags", "speedMin", "speedMax", "brightnessMin", "brightnessMax", "colorMin", "colorMax", "speed", "brightness", "direction", "colorMode"]
		}

		arr.forEach(value => {
			mode[value] = buffer.readInt32LE(offset)
			offset += 4
		})

		mode.colorLength = buffer.readUInt16LE(offset)
		offset += 2

		mode.colors = []

		mode.flagList = []

		let flags = ["speed", "directionLR", "directionUD", "directionHV", "brightness", "perLedColor", "modeSpecificColor", "randomColor", "manualSave", "automaticSave"]


		let flagcheck = Math.abs(mode.flags).toString(2)
		flagcheck = Array(flags.length - flagcheck.length).concat(flagcheck.split("")).reverse()

		flagcheck.forEach((el, i) => {
			if (el == "1") mode.flagList.push(flags[i])
		})

		if (+flagcheck[1] || +flagcheck[2] || +flagcheck[3]) {
			mode.flagList.push("direction")
		}

		if (!+flagcheck[0]) {
			mode.speedMin = 0
			mode.speedMax = 0
			mode.speed = 0
		}

		if (protocolVersion >= 3 && !+flagcheck[4]) {
			mode.brightnessMin = 0
			mode.brightnessMax = 0
			mode.brightness = 0
		}

		if (!+flagcheck[1] && !+flagcheck[2] && !+flagcheck[3]) {
			mode.direction = 0
		}

		if ((!+flagcheck[5] && !+flagcheck[6] && !+flagcheck[7]) || !mode.colorLength) {
			mode.colorLength = 0
			mode.colorMin = 0
			mode.colorMax = 0
		}

		for (let colorIndex = 0; colorIndex < mode.colorLength; colorIndex++) {
			mode.colors.push(readColor(buffer, offset));
			offset += 4;
		}
		modes.push(mode)
	}
	return { modes, offset }
}

function readZones (buffer, zoneCount, offset) {
	const zones = []
	for (let zoneIndex = 0; zoneIndex < zoneCount; zoneIndex++) {
		const { text, length } = readString(buffer, offset)
		let zone = { name: text, id: zoneIndex }
		offset += length;

		["type", "ledsMin", "ledsMax", "ledsCount"].forEach(value => {
			zone[value] = buffer.readInt32LE(offset)
			offset += 4
		})

		zone.resizable = !(zone.ledsMin == zone.ledsMax)

		let matrixSize = bufferpack.unpack("<H", buffer, offset)[0]
		offset+=2
		if (matrixSize) {
			zone.matrix = {}
			zone.matrix.size = matrixSize / 4 - 2
			zone.matrix.height = bufferpack.unpack("<I", buffer, offset)[0]
			zone.matrix.width = bufferpack.unpack("<I", buffer, offset + 4)[0]

			offset += 8

			zone.matrix.keys = []
			for (let index = 0; index < zone.matrix.height; index++) {
				zone.matrix.keys[index] = []
				for (let i = 0; i < zone.matrix.width; i++) {
					let led = bufferpack.unpack("<I", buffer, offset)[0]
					zone.matrix.keys[index].push(led != 4294967295 ? led : undefined)
					offset += 4
				}
			}
		}
		zones.push(zone)
	}
	return { zones, offset }
}

function readString (buffer, offset) {
	const length = buffer.readUInt16LE(offset)
	const text = new TextDecoder().decode(buffer.slice(offset + 2, offset + length + 1))
	return { text, length: length + 2 }
}

function readColor (buffer, offset) {
	const red = buffer.readUInt8(offset++)
	const green = buffer.readUInt8(offset++)
	const blue = buffer.readUInt8(offset++)
	return { red, green, blue }
}
