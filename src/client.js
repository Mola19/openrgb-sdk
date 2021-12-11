const EventEmitter = require("events")
const { Socket } = require("net")
const bufferpack = require("bufferpack")

const utils = require("./utils.js")
const Device = require("./device.js")

const HEADER_SIZE = 16
const clientProcotolVersion = 3

module.exports = class Client extends EventEmitter {
	/**
	 * @param {string} name name for the client
	 * @param {number} port port of the connection
	 * @param {string} host host of the connection
	 * @param {object} settings settings for the connection
	 */
	constructor (name, port, host, settings = {}) {
		super()

		this.name = name  || "nodejs"
		this.port = +port || 6742
		this.host = host  || "127.0.0.1"

		if (this.host == "localhost") this.host = "127.0.0.1" // node v17 doesn't acccept localhost anymore (bug?)

		this.isConnected = false
		this.resolver = []

		if (typeof settings == "object") this.settings = settings
	}
	/**
	 * connect to the OpenRGB-SDK-server
	 */
	async connect (timeout = 1000) {
		this.socket = new Socket()

		let connectionPromise = Promise.race([
			new Promise((resolve) => this.socket.once("connect", resolve)),
			new Promise((resolve) => this.socket.once("error", resolve)),
			new Promise((resolve) => setTimeout(() => resolve("timeout"), timeout))
		])

		this.socket.connect(this.port, this.host)

		let res = await connectionPromise

		if (res == "timeout") throw new Error("timeout")

		if (typeof res == "object") throw new Error(res)

		this.socket.on("close", () => {
			this.emit("disconnect")
			this.isConnected = false
		})

		this.socket.on("error", (err) => { 
			this.emit("error", err)
		})

		this.isConnected = true

		this.socketQueue = 0

		this.socket.on("readable", () => {
			while (true) {
				if (this.socketQueue > 0) {
					let res = this.socket.read(this.socketQueue)
					if (!res) return

					this.socketQueue = 0

					if (this.resolver.length) {
						resolve.bind(this)(Buffer.concat([this.resolver[0].header, res]))
					}
				}
	
				let header = this.socket.read(HEADER_SIZE)
				if (!header) return

				if (!(header.slice(0, 4).equals(Buffer.from([0x4f, 0x52, 0x47, 0x42])))) return
				if (header.readUInt32LE(12) > 0) {
					this.socketQueue = header.readUInt32LE(12)

					if (this.resolver.length) {
						this.resolver[0].header = header
					}
				} else {
					if (this.resolver.length) {
						resolve.bind(this)(header)
					}
				}
			}
		})

		let serverProtocolVersion = await new Promise(async (resolve, reject) => {
			setTimeout(() => reject(0), timeout)
			resolve(await this.getProtocolVersion())
		}).catch(_ => _)

		if (this.settings.forceProtocolVersion && serverProtocolVersion == 0) {
			this.protocolVersion = this.settings.forceProtocolVersion
		} else {
			let clientVersion = ("forceProtocolVersion" in this.settings) ? this.settings.forceProtocolVersion : clientProcotolVersion
			this.protocolVersion = (serverProtocolVersion < clientVersion) ? serverProtocolVersion : clientVersion
		}
		
		this.setClientName(this.name)
		this.emit("connect")
	}
	/**
	 * disconnect from the OpenRGB-SDK-server
	 */
	disconnect () {
		if (this.isConnected) {
			this.socket.end()
			this.resolver = []
		}
	}
	/**
	 * get the amount of devices
	 * @returns {Promise<number>}
	 */
	async getControllerCount () {
		this.sendMessage(utils.command.requestControllerCount)
		const buffer = await this.readMessage(utils.command.requestControllerCount)
		return buffer.readUInt32LE()
	}
	/**
	 * get the protocol version
	 * @returns {Promise<number>}
	 */
	async getProtocolVersion () {
		let clientVersion = ("forceProtocolVersion" in this.settings) ? this.settings.forceProtocolVersion : clientProcotolVersion
		this.sendMessage(utils.command.requestProtocolVersion, bufferpack.pack("<I", [clientVersion]))
		const buffer = await this.readMessage(utils.command.requestProtocolVersion)
		return buffer.readUInt32LE()
	}
	/**
	 * get the properties of a device
	 * @param {number} deviceId the id of the requested device
	 * @returns {Promise<Device>}
	 */
	async getControllerData (deviceId) { 
		this.sendMessage(utils.command.requestControllerData, bufferpack.pack("<I", [this.protocolVersion]), deviceId)
		const buffer = await this.readMessage(utils.command.requestControllerData, deviceId)
		return new Device(buffer, deviceId, this.protocolVersion)
	}
	/**
	 * get the properties of all devices
	 * @returns {Promise<Device>[]}
	 */
	async getAllControllerData () {
		let devices = []
		for (let i = 0; i < await this.getControllerCount(); i++) {
			devices.push(await this.getControllerData(i))
		}
		return devices
	}
	/**
	 * get a list of all profiles
	 * @returns {Promise<String>[]}
	 */
	async getProfileList () {
		this.sendMessage(utils.command.requestProfileList)
		const buffer = (await this.readMessage(utils.command.requestProfileList)).slice(4)
		let count = buffer.readUInt16LE()
		let offset = 2
		let profiles = []
		for (let i = 0; i < count; i++) {
			let length = buffer.readUInt16LE(offset)
			offset += 2
			profiles.push(bufferpack.unpack(`<${length-1}c`, buffer, offset).join(""))
			offset += length
		}
		return profiles
	}
	/**
	 * set the name of the client
	 * @param {string} name the name displayed in openrgb
	 */
	setClientName (name) {
		let nameBytes = new TextEncoder().encode(name)
		nameBytes = Buffer.concat([nameBytes, Buffer.from([0x00])])
		this.sendMessage(utils.command.setClientName, nameBytes)
	}
	/**
	 * update all leds of a device
	 * @param {number} deviceId the id of the device
	 * @param {Object[]} colors the colors the device should be set to
	 */
	updateLeds (deviceId, colors) {
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

		this.sendMessage(utils.command.updateLeds, Buffer.concat([prefixBuffer, colorsBuffer]), deviceId)
	}
	/**
	 * update all leds of a zone
	 * @param {number} deviceId the id of the device
	 * @param {number} zoneId the id of the zone
	 * @param {Object[]} colors the colors the zone should be set to
	 */
	updateZoneLeds (deviceId, zoneId, colors) {
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
		this.sendMessage(utils.command.updateZoneLeds, Buffer.concat([prefixBuffer, colorsBuffer]), deviceId)
	}
	/**
	 * update one led of a device
	 * @param {number} deviceId the id of the device
	 * @param {number} ledId the id of the led
	 * @param {Object} colors the color the led should be set to
	 */
	updateSingleLed (deviceId, ledId, color) {
		let buff = Buffer.concat([bufferpack.pack("<I", [ledId]), bufferpack.pack("<BBB", [color.red, color.green, color.blue]), new Buffer.alloc(1)])
		this.sendMessage(utils.command.updateSingleLed, buff, deviceId)
	}
	/**
	 * sets the device to its mode for individual led control
	 * @param {number} deviceId the id of the requested device
	 * @returns {Promise<Device>}
	 */
	setCustomMode (deviceId) {
		this.sendMessage(utils.command.setCustomMode, undefined, deviceId)
	}
	/**
	 * update the mode of a device
	 * @param {number} deviceId the id of the device
	 * @param {number|string} mode either the id or name of a mode
	 * @param {Object} custom the settings of this mode e.g. speed, color etc.
	 */
	async updateMode (deviceId, mode, custom) {
		await sendMode.bind(this)(deviceId, mode, custom, false)
	}
	/**
	 * update the mode of a device and save it to the device
	 * @param {number} deviceId the id of the device
	 * @param {number|string} mode either the id or name of a mode
	 * @param {Object} custom the settings of this mode e.g. speed, color etc.
	 */
	 async saveMode (deviceId, mode, custom) {
		await sendMode.bind(this)(deviceId, mode, custom, true)
	}
	/**
	 * resize a zone
	 * @param {number} deviceId the id of the device
	 * @param {number} zoneId the id of the zone
	 * @param {number} zoneLength the length the zone should be set to
	 */
	resizeZone (deviceId, zoneId, zoneLength) {
		this.sendMessage(utils.command.resizeZone, bufferpack.pack("<ii", [zoneId, zoneLength]), deviceId)
	}
	/**
	 * create a new profile with the current state of the devices in openrgb
	 * @param {string} name the name of the new profile
	 */
	saveProfile (name) {
		let nameBytes = new TextEncoder().encode(name)
		nameBytes = Buffer.concat([nameBytes, Buffer.from([0x00])])
		this.sendMessage(utils.command.saveProfile, nameBytes)
	}
	/**
	 * load a profile out of the storage
	 * @param {string} name the name of the profile that should be loaded
	 */
	loadProfile (name) {
		let nameBytes = new TextEncoder().encode(name)
		nameBytes = Buffer.concat([nameBytes, Buffer.from([0x00])])
		this.sendMessage(utils.command.loadProfile, nameBytes)
	}
	/**
	 * delete a profile out of the storage
	 * @param {string} name the name of the profile that should be deleted
	 */
	deleteProfile (name) {
		let nameBytes = new TextEncoder().encode(name)
		nameBytes = Buffer.concat([nameBytes, Buffer.from([0x00])])
		this.sendMessage(utils.command.deleteProfile, nameBytes)
	}
	/**
	 * @private
	 */
	sendMessage (commandId, buffer = Buffer.alloc(0), deviceId = 0) {
		if (!this.isConnected) throw new Error("can't write to socket if not connected to OpenRGB")
		const header = this.encodeHeader(commandId, buffer.byteLength, deviceId)
		const packet = Buffer.concat([header, buffer])
		this.socket.write(packet)
	}
	/**
	 * @private
	 */
	async readMessage (commandId, deviceId = 0) {
		if (!this.isConnected) throw new Error("can't read from socket if not connected to OpenRGB")
		return new Promise(resolve => this.resolver.push({resolve, commandId, deviceId}))
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
		return Buffer.concat([bufferpack.pack(`<H${string.length}s`, [string.length + 1, string]), Buffer.from('\x00')])
	}
}

async function sendMode (deviceId, mode, custom, save) {
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
		 
		if (!isNaN(+custom.brightness)) {
			if (modeData.flagList.includes("brightness")) {
				if (custom.brightness < modeData.brightnessMin || custom.brightness > modeData.brightnessMax) throw new Error("Brightness either to high or to low")
				if ((custom.brightness % 1) != 0) throw new Error("Brightness must be a round number")
				modeData.brightness = custom.brightness
			} else throw new Error("Brightness can't be set for this mode")
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
				this.updateLeds(deviceId, custom.colors)
			} else {
				if (custom.colors.length > modeData.colorMax) throw new Error("Too many colors.")
				if (modeData.colorLength <= 0) throw new Error("Color can't be set for this mode")
				modeData.colors = custom.colors
			}
		}
	}

	let pack

	if (this.protocolVersion >= 3) {
		pack = bufferpack.pack("<12I", [
			modeData.value, 
			modeData.flags, 
			modeData.speedMin, 
			modeData.speedMax, 
			modeData.brightnessMin, 
			modeData.brightnessMax, 
			modeData.colorMin, 
			modeData.colorMax, 
			modeData.speed,
			modeData.brightness,
			modeData.direction, 
			modeData.colorMode
		])
	} else {
		pack = bufferpack.pack("<9I", [
			modeData.value, 
			modeData.flags, 
			modeData.speedMin, 
			modeData.speedMax, 
			modeData.colorMin, 
			modeData.colorMax, 
			modeData.speed, 
			modeData.direction, 
			modeData.colorMode
		])
	}

	let data = Buffer.concat([
		bufferpack.pack("<I", [modeData.id]),
		this.pack_string(modeData.name),
		pack,
		this.pack_list(modeData.colors ? modeData.colors : 0), 
	])
	data = Buffer.concat([bufferpack.pack("<I", [data.length, bufferpack.calcLength("<I")]), data])

	this.sendMessage(save ? utils.command.saveMode : utils.command.updateMode, data, deviceId)
}

function resolve (buffer) {
	let { deviceId, commandId } = this.decodeHeader(buffer)
	switch (commandId) {
		case utils.command.deviceListUpdated: {
			this.emit("deviceListUpdated")
			break
		}
		default: {
			if (this.resolver.length) {
				let index = this.resolver.findIndex( resolver => resolver.deviceId == deviceId && resolver.commandId == commandId)
				if (index < 0) return

				this.resolver.splice(index, 1)[0].resolve(buffer.slice(16))
			}
		}
	}
}