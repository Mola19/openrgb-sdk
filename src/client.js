const EventEmitter = require("events")
const { Socket } = require("net")
const { PromiseSocket } = require("promise-socket")
const { Buffer } = require("buffer")
const bufferpack = require("bufferpack")

const utils = require("./utils.js")
const Device = require("./device")
const HEADER_SIZE = 16

module.exports = class Client extends EventEmitter {
	/**
	 * @param {string} name name for the client
	 * @param {number} port port of the connection
	 * @param {string} host host of the connection
	 */
	constructor (name, port, host) {
		super()

		this.name = name || "nodejs"
		this.port = +port || 6742
		this.host = host || "localhost"

		this.isConnected = false
	}
	/**
	 * connect to the OpenRGB-SDK-server
	 */
	async connect () {
		let socket = new Socket()
		this.socket = new PromiseSocket(socket)
		await this.socket.connect(this.port, this.host)

		this.emit("connect")
		this.isConnected = true

		socket.on("close", () => {
			this.emit("disconnect")
			this.isConnected = false
		})

		let nameBytes = new TextEncoder().encode(this.name)
		nameBytes = Buffer.concat([nameBytes, Buffer.from([0x00])])
		await this.sendMessage(utils.command.setClientName, nameBytes)
	}
	/**
	 * disconnect from the OpenRGB-SDK-server
	 */
	async disconnect () {
		if (this.isConnected) await this.socket.end()
	}
	/**
	 * get the amount of devices
	 * @returns {Promise<number>}
	 */
	async getControllerCount () {
		await this.sendMessage(utils.command.requestControllerCount)
		const buffer = await this.readMessage()
		return buffer.readUInt32LE()
	}
	/**
	 * get the protocol version
	 * @returns {Promise<string>}
	 */
	async getProtocolVersion () {
		await this.sendMessage(utils.command.requestProtocolVersion)
		const buffer = await this.readMessage()
		return buffer.readUInt32LE()
	}
	/**
	 * get the properties of a device
	 * @param {number} deviceId the id of the requested device
	 * @returns {Promise<Device>}
	 */
	async getControllerData (deviceId) {
		await this.sendMessage(utils.command.requestControllerData, undefined, deviceId)
		const buffer = await this.readMessage()
		return new Device(buffer, deviceId)
	}
	/**
	 * update all leds of a device
	 * @param {number} deviceId the id of the device
	 * @param {Array<object>} colors the colors the device should be set to
	 */
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
	/**
	 * update all leds of a device
	 * @param {number} deviceId the id of the device
	 * @param {number} zoneId the id of the zone
	 * @param {Array<object>} colors the colors the zone should be set to
	 */
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
		await this.sendMessage(utils.command.updateZoneLeds, Buffer.concat([prefixBuffer, colorsBuffer]), deviceId)
	}
	/**
	 * update all leds of a device
	 * @param {number} deviceId the id of the device
	 * @param {number} ledId the id of the led
	 * @param {Object} colors the color the led should be set to
	 */
	async updateSingleLed (deviceId, ledId, color) {
		let buff = Buffer.concat([bufferpack.pack("<I", [ledId]), bufferpack.pack("<BBB", [color.red, color.green, color.blue]), new Buffer.alloc(1)])
		await this.sendMessage(utils.command.updateSingleLed, buff, deviceId)
	}
	/**
	 * sets the device to its mode for individual led control
	 * @param {number} deviceId the id of the requested device
	 * @returns {Promise<Device>}
	 */
	async setCustomMode (deviceId) {
		await this.sendMessage(utils.command.setCustomMode, undefined, deviceId)
	}
	/**
	 * update all leds of a device
	 * @param {number} deviceId the id of the device
	 * @param {number|string} mode either the id or name of a mode
	 * @param {Object} custom the settings of this mode e.g. speed, color etc.
	 */
	async updateMode (deviceId, mode, custom) {
		//TODO: shorten and beautify
		let modeData

		if (typeof deviceId != "number") throw new Error("arg deviceId not given")
		let device = await this.getControllerData(deviceId)

		if (typeof mode == "number") {
			if (!device.modes.filter(elem => elem.id == mode)[0]) throw new Error("Number given is not the id of a mode")
			modeData = device.modes.filter(elem => elem.id == mode)[0]
		} else if (typeof mode == "string") {
			if (!device.modes.filter(elem => elem.name.toLowerCase() == mode.toLowerCase())[0]) throw new Error("Name given is not the name of a mode")
			modeData = device.modes.filter(elem => elem.name == mode)[0]
		} else throw new Error("arg mode is either not given or not an instance of string or number")

		if (typeof custom != "object" && typeof custom != "undefined") throw new Error("3rd argument must be either an object ore undefined")
		
		if (typeof custom != "undefined") {
			if (custom.random) {
				if (!modeData.flagList.includes("randomColor")) throw new Error("Random color can't be chosen")
				modeData.colorMode = 3
			} else if (modeData.flagList.includes("modeSpecificColor")) {
				modeData.colorMode = 2
			} else if (modeData.flagList.includes("perLedColor")) {
				modeData.colorMode = 1
			} else {
				modeData.colorMode = 0
			}
			if (!isNaN(+custom.speed)) {
				if (modeData.flagList.includes("speed")) {
					if (custom.speed < modeData.speedMin || custom.speed > modeData.speedMax) throw new Error("Speed either to high or to low")
					if ((custom.speed % 1) != 0) throw new Error("Speed must be a round number")
					modeData.speed = custom.speed
				} else throw new Error("Speed can't be set for this mode")
			}
			if (!isNaN(+custom.direction)) {
				if (modeData.flagList.includes("direction")) {
					let arr = ["directionLR", "directionUD", "directionHV"]
					if (modeData.flagList.includes(arr[Math.floor(custom.direction / 2)])) {
						modeData.direction = custom.direction
					} else throw new Error("Can't set direction to this value")
					
					if ((custom.direction % 1) != 0) throw new Error("Direction must be a round number")
					
				} else throw new Error("Direction can't be set for this mode")
			}
			if (custom.colors) {
				if (modeData.colorMode == 1) {
					await this.updateLeds(deviceId, custom.colors)
				} else {
					if (custom.colors.length > modeData.colorMax) throw new Error("Too many colors.")
					if (modeData.colorLength <= 0) throw new Error("Color can't be set for this mode")
					modeData.colors = custom.colors
				}
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
	/**
	 * update all leds of a device
	 * @param {number} deviceId the id of the device
	 * @param {number} zoneId the id of the zone
	 * @param {number} zoneLength the length the zone should be set to
	 */
	async resizeZone (deviceId, zoneId, zoneLength) {
		await this.sendMessage(utils.command.resizeZone, bufferpack.pack("<ii", [zoneId, zoneLength]), deviceId)
	}
	/**
	 * @private
	 */
	async sendMessage (commandId, buffer = Buffer.alloc(0), deviceId) {
		if (!this.isConnected) throw new Error("can't write to socket if not connected to OpenRGB")
		const header = this.encodeHeader(commandId, buffer.byteLength, deviceId)
		const packet = Buffer.concat([header, buffer])
		await this.socket.write(packet)
	}
	/**
	 * @private
	 */
	async readMessage () {
		if (!this.isConnected) throw new Error("can't read from socket if not connected to OpenRGB")
		const headerBuffer = await this.socket.read(HEADER_SIZE)
		const header = this.decodeHeader(headerBuffer)
		const packetBuffer = await this.socket.read(header.length)
		return packetBuffer
	}
	/**
	 * @private
	 */
	encodeHeader (commandId, length, deviceId) {
		const buffer = Buffer.alloc(HEADER_SIZE)

		let index = buffer.write("ORGB", "ascii")
		index = buffer.writeUInt32LE(deviceId, index)
		index = buffer.writeUInt32LE(commandId, index)
		index = buffer.writeUInt32LE(length, index)
		
		return buffer
	}
	/**
	 * @private
	 */
	decodeHeader (buffer) {
		const deviceId = buffer.readUInt32LE(4)
		const commandId = buffer.readUInt32LE(8)
		const length = buffer.readUInt32LE(12)
		return { deviceId, commandId, length }
	}
	/**
	 * @private
	 */
	pack_list (arr) {
		let out = bufferpack.pack("<H", [arr.length])
		arr.forEach(element => {
			out = Buffer.concat([out, new Buffer.from(""), bufferpack.pack("<BBBx", [element.red, element.green, element.blue])])
		})
		return out
	}
	/**
	 * @private
	 */
	pack_string (string) {
		return Buffer.concat([bufferpack.pack(`<H${string.length}s`, [string.length + 1, encodeURIComponent(string)]), Buffer.from('\x00')])
	}
}
