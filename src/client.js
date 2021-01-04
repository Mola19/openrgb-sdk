const net_1 = require("net")
const promise_socket_1 = require("promise-socket")
const device_1 = require("./device")
const bufferpack = require("bufferpack")
const { Buffer } = require("buffer")
const utils = require("./utils.js")
const HEADER_SIZE = 16
class OpenRGBClient {
	constructor (options) {
		this.host = options.host
		this.port = options.port
		this.name = options.name
	}
	async connect () {
		this.socket = new promise_socket_1.PromiseSocket(new net_1.Socket())
		await this.socket.connect(this.port, this.host)
		
		const nameBytes = new TextEncoder().encode(this.name)
		await this.sendMessage(utils.command.setClientName, nameBytes)
	}
	async disconnect () {
		await this.socket?.end()
	}
	async getControllerCount () {
		await this.sendMessage(utils.command.requestControllerCount)
		const buffer = await this.readMessage()
		return buffer.readUInt32LE()
	}
	async getProtocolVersion () {
		await this.sendMessage(utils.command.requestProtocolVersion)
		const buffer = await this.readMessage()
		return buffer.readUInt32LE()
	}
	async getControllerData (deviceId) {
		await this.sendMessage(utils.command.requestControllerData, undefined, deviceId)
		const buffer = await this.readMessage()
		return new device_1(buffer)
	}
	async updateLeds (deviceId, colors) {
		const size = 2 + (4 * colors.length)

		const colorsBuffer = Buffer.alloc(size)
		colorsBuffer.writeUInt16LE(colors.length)

		for (let i = 0; i < colors.length; i++) {
			const color = colors[i]
			const offset = 2 + (i * 4)
			colorsBuffer.writeUInt8(color.red, offset)
			colorsBuffer.writeUInt8(color.green, offset + 1)
			colorsBuffer.writeUInt8(color.blue, offset + 2)
		}

		const prefixBuffer = Buffer.alloc(4)
		prefixBuffer.writeUInt32LE(size)

		await this.sendMessage(utils.command.updateLeds, Buffer.concat([prefixBuffer, colorsBuffer]), deviceId)
	}
	async updateZoneLeds (deviceId, zoneId, colors) {
		const size = 6 + (4 * colors.length)
		const colorsBuffer = Buffer.alloc(size)
		colorsBuffer.writeUInt32LE(zoneId)
		colorsBuffer.writeUInt16LE(colors.length, 4)
		for (let i = 0; i < colors.length; i++) {
			const color = colors[i]
			const offset = 6 + (i * 4)
			colorsBuffer.writeUInt8(color.red, offset)
			colorsBuffer.writeUInt8(color.green, offset + 1)
			colorsBuffer.writeUInt8(color.blue, offset + 2)
		}
		const prefixBuffer = Buffer.alloc(4)
		prefixBuffer.writeUInt32LE(size)
		await this.sendMessage(utils.command.updateLeds, Buffer.concat([prefixBuffer, colorsBuffer]), deviceId)
	}
	async setCustomMode (deviceId) {
		await this.sendMessage(utils.command.setCustomMode, undefined, deviceId)
	}
	async updateMode (deviceId, mode, custom) {
		//TODO: shorten and beautify
		let modeData

		if (typeof deviceId != "number") throw new Error("arg deviceId not given")
		let device = await this.getControllerData(deviceId)

		if (typeof mode == "number") {
			if (!device.modes.filter(elem => elem.id == mode)[0]) throw new Error("Number given is not the id of a mode")
			modeData = device.modes.filter(elem => elem.id == mode)[0]
		} else if (typeof mode == "string") {
			if (!device.modes.filter(elem => elem.name == mode)[0]) throw new Error("Name given is not the name of a mode")
			modeData = device.modes.filter(elem => elem.name == mode)[0]
		} else throw new Error("arg mode is either not given or not an instance of string or number")

		if (typeof custom != "object" && typeof custom != "undefined") throw new Error("3rd argument must be either an object ore undefined")
		
		if (typeof custom != "undefined") {
			if (custom.speed) {
				if (modeData.flagList.includes("speed")) {
					if (typeof custom.speed == "number") {
						if (custom.speed < modeData.speedMin || custom.speed > modeData.speedMax) throw new Error("Speed either to high or to low")
						if ((custom.speed % 1) != 0) throw new Error("Speed must be a round number")
						modeData.speed = custom.speed
					}
				} else throw new Error("Speed can't be set for this mode")
			}
			if (custom.direction) {
				if (modeData.flagList.includes("direction")) {
					if (typeof custom.direction == "number") {
						let arr = ["directionLR", "directionUD", "directionHV"]

						if (modeData.flagList.includes(arr[Math.floor(custom.direction / 2)])) {
							modeData.direction = custom.direction
						} else throw new Error("Can't set direction to this value")
						
						if ((custom.direction % 1) != 0) throw new Error("Direction must be a round number")
					}
				} else throw new Error("Direction can't be set for this mode")
			}
			if (custom.colors) {
				if (modeData.colorLength <= 0) throw new Error("Color can't be set for this mode")
				if (custom.colors.length < modeData.colorMin || custom.colors.length > modeData.colorMax) throw new Error("Either to many or the few colors")

				modeData.colors = custom.colors
			}
		}
		
		let data = Buffer.concat([
			bufferpack.pack("<I", [modeData.id]),
			this.pack_string(modeData.name),
			bufferpack.pack("<IIIIIIIII", [
				modeData.value, 
				modeData.flags, 
				modeData.speedMin, 
				modeData.speedMax, 
				modeData.colorMin, 
				modeData.colorMax, 
				modeData.speed, 
				modeData.direction, 
				modeData.colorMode
			]),
			this.pack_list(modeData.colors ? modeData.colors : 0), 
		])
		data = Buffer.concat([bufferpack.pack("<I", [data.length, bufferpack.calcLength("<I")]), data])
		
		await this.sendMessage(utils.command.updateMode, data, deviceId)
	}
	async resizeZone (deviceId, zoneId, zoneLength) {
		await this.sendMessage(utils.command.resizeZone, bufferpack.pack("<ii", [zoneId, zoneLength]), deviceId)
	}
	async sendMessage (commandId, buffer = Buffer.alloc(0), deviceId) {
		const header = this.encodeHeader(commandId, buffer.byteLength, deviceId)
		const packet = Buffer.concat([header, buffer])
		await this.socket?.write(packet)
	}
	async readMessage () {
		const headerBuffer = await this.socket?.read(HEADER_SIZE)
		if (headerBuffer === undefined) {
			throw new Error("connection has ended")
		}
		const header = this.decodeHeader(headerBuffer)
		const packetBuffer = await this.socket?.read(header.length)
		if (packetBuffer === undefined) {
			throw new Error("connection has ended")
		}
		return packetBuffer
	}
	encodeHeader (commandId, length, deviceId) {
		const buffer = Buffer.alloc(HEADER_SIZE)
		// I have no idea why eslint thinks this variable is unused, so we'll disable the warning
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		let index = buffer.write("ORGB", "ascii")
		index = buffer.writeUInt32LE(deviceId, index)
		index = buffer.writeUInt32LE(commandId, index)
		index = buffer.writeUInt32LE(length, index)
		return buffer
	}
	decodeHeader (buffer) {
		const deviceId = buffer.readUInt32LE(4)
		const commandId = buffer.readUInt32LE(8)
		const length = buffer.readUInt32LE(12)
		return { deviceId, commandId, length }
	}
	pack_list (arr) {
		let out = bufferpack.pack("<H", [arr.length])
		arr.forEach(element => {
			out = Buffer.concat([out, new Buffer.from(""), bufferpack.pack("<BBBx", [element.red, element.green, element.blue])])
		})
		return out
	}
	pack_string (string) {
		return Buffer.concat([bufferpack.pack(`<H${string.length}s`, [string.length + 1, encodeURIComponent(string)]), Buffer.from('\x00')])
	}
}

module.exports = OpenRGBClient
