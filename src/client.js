// "use strict";
// var __importDefault = (this && this.__importDefault) || function (mod) {
//     return (mod && mod.__esModule) ? mod : { "default": mod };
// };
// Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = require("net");
const promise_socket_1 = require("promise-socket");
const { isConstructorDeclaration, isIndexedAccessTypeNode } = require("typescript");
const command_1 = require("./command")
const device_1 = require("./device")
const bufferpack = require("bufferpack");
const { Buffer } = require("buffer");
const HEADER_SIZE = 16;
class OpenRGBClient {
	constructor(options) {
		this.host = options.host;
		this.port = options.port;
		this.name = options.name;
	}
	async connect() {
		this.socket = new promise_socket_1.PromiseSocket(new net_1.Socket());
		await this.socket.connect(this.port, this.host);
		const nameBytes = new TextEncoder().encode(this.name);
		await this.sendMessage(command_1.default.SetClientName, nameBytes);
	}
	async disconnect() {
		await this.socket?.end();
	}
	/**
	 * Requests the number of controllers active on the OpenRGB server.
	 *
	 * @returns a promise with the number of controllers the OpenRGB server can control.
	 */
	async getControllerCount() {
		await this.sendMessage(command_1.default.RequestControllerCount);
		const buffer = await this.readMessage();
		return buffer.readUInt32LE();
	}
	/**
	 * Requests all information about an OpenRGB device.
	 *
	 * @param deviceId The id of the device we want to request, these are sequential starting from 0.
	 */
	async getDeviceController(deviceId) {
		await this.sendMessage(command_1.default.RequestControllerData, undefined, deviceId);
		const buffer = await this.readMessage();
		return new device_1.default(buffer);
	}
	async updateLeds(deviceId, colors) {
		const size = 2 + (4 * colors.length);
		const colorsBuffer = Buffer.alloc(size);
		colorsBuffer.writeUInt16LE(colors.length);
		for (let i = 0; i < colors.length; i++) {
			const color = colors[i];
			const offset = 2 + (i * 4);
			colorsBuffer.writeUInt8(color.red, offset);
			colorsBuffer.writeUInt8(color.green, offset + 1);
			colorsBuffer.writeUInt8(color.blue, offset + 2);
		}
		const prefixBuffer = Buffer.alloc(4);
		prefixBuffer.writeUInt32LE(size);
		await this.sendMessage(command_1.default.UpdateLeds, Buffer.concat([prefixBuffer, colorsBuffer]), deviceId);
	}
	async updateZoneLeds(deviceId, zoneId, colors) {
		const size = 6 + (4 * colors.length);
		const colorsBuffer = Buffer.alloc(size);
		colorsBuffer.writeUInt32LE(zoneId);
		colorsBuffer.writeUInt16LE(colors.length, 4);
		for (let i = 0; i < colors.length; i++) {
			const color = colors[i];
			const offset = 6 + (i * 4);
			colorsBuffer.writeUInt8(color.red, offset);
			colorsBuffer.writeUInt8(color.green, offset + 1);
			colorsBuffer.writeUInt8(color.blue, offset + 2);
		}
		const prefixBuffer = Buffer.alloc(4);
		prefixBuffer.writeUInt32LE(size);
		await this.sendMessage(command_1.default.UpdateLeds, Buffer.concat([prefixBuffer, colorsBuffer]), deviceId);
	}
	async setCustomMode(deviceId) {
		await this.sendMessage(command_1.default.SetCustomMode, undefined, deviceId);
	}
	async updateMode(deviceId, mode) {
		let mode_name
		let mode_data 
		if (typeof(deviceId) != "number" && typeof(deviceId) != "string") throw new Error("arg deviceId is either not given or not an instance of string or number")
		if (!mode) throw new Error("arg mode not given")
		let device = await this.getDeviceController(2)
		if (typeof(mode) == "number") {
			if (!device.modes.filter(elem => elem.value == mode)[0]) throw new Error("Number given is not the value of a mode")
			mode_name = device.modes.filter(elem => elem.value == mode)[0].name
			mode_data = device.modes.filter(elem => elem.value == mode)[0]
		} else if (typeof(mode) == "string") {
			if (!device.modes.filter(elem => elem.name == mode)[0]) throw new Error("Name given is not the name of a mode")
			mode_name = mode
			mode_data = device.modes.filter(elem => elem.name == mode)[0]
		}
		let data = Buffer.concat([
			bufferpack.pack("<i", [mode_data.id]),
			this.pack_string(mode_data.name),
			bufferpack.pack("<iiiiiiiii", [
				mode_data.value, 
				mode_data.flags, 
				mode_data.speedMin, 
				mode_data.speedMax, 
				mode_data.colorMin, 
				mode_data.colorMax, 
				mode_data.speed, 
				mode_data.direction, 
				mode_data.colorMode
			]),
			this.pack_list(mode_data.colors ? mode_data.colors : 0), 
		])

		data = Buffer.concat([bufferpack.pack("<I", [data.length, bufferpack.calcLength("<I")]), data])
		await this.sendMessage(command_1.default.UpdateMode, data, deviceId);
	}
	async sendMessage(commandId, buffer = Buffer.alloc(0), deviceId) {
		const header = this.encodeHeader(commandId, buffer.byteLength, deviceId);
		
		const packet = Buffer.concat([header, buffer]);
		await this.socket?.write(packet);
	}
	async readMessage() {
		const headerBuffer = await this.socket?.read(HEADER_SIZE);
		if (headerBuffer === undefined) {
			throw new Error("connection has ended");
		}
		const header = this.decodeHeader(headerBuffer);
		const packetBuffer = await this.socket?.read(header.length);
		if (packetBuffer === undefined) {
			throw new Error("connection has ended");
		}
		return packetBuffer;
	}
	encodeHeader(commandId, length, deviceId) {
		const buffer = Buffer.alloc(HEADER_SIZE);
		// I have no idea why eslint thinks this variable is unused, so we'll disable the warning
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		let index = buffer.write("ORGB", "ascii");
		index = buffer.writeUInt32LE(deviceId, index);
		index = buffer.writeUInt32LE(commandId, index);
		index = buffer.writeUInt32LE(length, index);
		return buffer;
	}
	decodeHeader(buffer) {
		const deviceId = buffer.readUInt32LE(4);
		const commandId = buffer.readUInt32LE(8);
		const length = buffer.readUInt32LE(12);
		return { deviceId, commandId, length };
	}
	pack_list(arr) {
		let out = bufferpack.pack("<H", [arr.length])
		arr.forEach(element => {
			out = Buffer.concat([out, new Buffer.from(""), bufferpack.pack("<BBBx", [element.red, element.green, element.blue])])
		})
		return out
	}
	pack_string(string) {
		return Buffer.concat([bufferpack.pack(`<H${string.length}s`, [string.length + 1, encodeURIComponent(string)]), Buffer.from('\x00')])
	}
}
exports.default = OpenRGBClient;

// \x05\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00
// \x00\x00\x00\x05\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00 
// \x06\x00\x00\x00\x0197\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x02\x00\x00\x00\x02\x00\x00\x00\x01\x00\x00\x00\x02\x00\x00\x00\x02\x00\x00\x00