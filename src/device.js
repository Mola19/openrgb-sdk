module.exports = class Device {
	constructor (buffer, deviceId) {
		this.deviceId = deviceId
		
		let offset = 4
		this.type = buffer.readUInt32LE(offset)
		offset += 4;
		
		["name", "description", "version", "serial", "location"].forEach(value => {
			let { text, length } = readString(buffer, offset)
			this[value] = text
			offset += length
		})

		const modeCount = buffer.readUInt16LE(offset)
		offset += 2
		this.activeMode = buffer.readUInt32LE(offset)
		offset += 4
		const { modes, offset: readModesOffset } = readModes(buffer, modeCount, offset)
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
			const { text: ledName, length: ledNameLength } = readString(buffer, offset)
			offset += ledNameLength
			const color = readColor(buffer, offset)
			offset += 4
			this.leds.push({
				name: ledName,
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

function readModes (buffer, modeCount, offset) {
	const modes = []
	for (let modeIndex = 0; modeIndex < modeCount; modeIndex++) {
		let mode = {}

		mode.id = modeIndex

		let { text: modeName, length: modeNameLength } = readString(buffer, offset)
		mode.name = modeName
		offset += modeNameLength;

		["value", "flags", "speedMin", "speedMax", "colorMin", "colorMax", "speed", "direction", "colorMode"].forEach(value => {
			mode[value] = buffer.readInt32LE(offset)
			offset += 4
		})
		mode.colorLength = buffer.readUInt16LE(offset)
		offset += 2

		mode.colors = []
		
		mode.flagList = []

		let flagcheck = Math.abs(mode.flags).toString(2)
		flagcheck = Array(8 - flagcheck.length).concat(flagcheck.split("")).reverse()
		const flags = ["speed", "directionLR", "directionUD", "directionHV", "brightness", "perLedColor", "modeSpecificColor", "randomColor"]
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

		const matrixSize = buffer.readUInt16LE(offset)
		offset += 2 + matrixSize // TODO: Parse matrix

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
