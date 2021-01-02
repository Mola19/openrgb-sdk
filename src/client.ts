import { Socket as NodeSocket } from "net";
import { PromiseSocket as Socket } from "promise-socket";
import Command from "./command";
import OpenRGBDevice, { Color } from "./device";

const HEADER_SIZE = 16;

type OpenRGBHeader = {
    deviceId: number;
    length: number;
    commandId: Command;
}

export type ClientOptions = {
    host: string;
    port: number;
    name: string;
};

export default class OpenRGBClient {
    private host: string;
    private port: number;
    private name: string;

    private socket?: Socket<NodeSocket>;

    public constructor(options: ClientOptions) {
        this.host = options.host;
        this.port = options.port;
        this.name = options.name;
    }

    public async connect(): Promise<void> {
        this.socket = new Socket(new NodeSocket());
        await this.socket.connect(this.port, this.host);

        const nameBytes = new TextEncoder().encode(this.name);
        await this.sendMessage(Command.SetClientName, nameBytes as Buffer);
    }

    public async disconnect(): Promise<void> {
        await this.socket?.end();
    }

    /**
     * Requests the number of controllers active on the OpenRGB server.
     * 
     * @returns a promise with the number of controllers the OpenRGB server can control.
     */
    public async getControllerCount(): Promise<number> {
        await this.sendMessage(Command.RequestControllerCount);

        const buffer = await this.readMessage();
        return buffer.readUInt32LE();
    }

    /**
     * Requests all information about an OpenRGB device.
     * 
     * @param deviceId The id of the device we want to request, these are sequential starting from 0.
     */
    public async getDeviceController(deviceId: number): Promise<OpenRGBDevice> {
        await this.sendMessage(Command.RequestControllerData, undefined, deviceId);

        const buffer = await this.readMessage();
        return new OpenRGBDevice(buffer);
    }

    public async updateLeds(deviceId: number, colors: Color[]): Promise<void> {
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

        await this.sendMessage(Command.UpdateLeds, Buffer.concat([prefixBuffer, colorsBuffer]), deviceId);
    }

    public async updateZoneLeds(deviceId: number, zoneId: 0, colors: Color[]): Promise<void> {
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

        await this.sendMessage(Command.UpdateLeds, Buffer.concat([prefixBuffer, colorsBuffer]), deviceId);
    }

    public async setCustomMode(deviceId: number): Promise<void> {
        await this.sendMessage(Command.SetCustomMode, undefined, deviceId);
    }

    private async sendMessage(commandId: Command, buffer = Buffer.alloc(0), deviceId = 0): Promise<void> {
        const header = this.encodeHeader(commandId, buffer.byteLength, deviceId);
        const packet = Buffer.concat([header, buffer]);
        await this.socket?.write(packet);
    }

    private async readMessage(): Promise<Buffer> {
        const headerBuffer = await this.socket?.read(HEADER_SIZE) as Buffer | undefined;

        if (headerBuffer === undefined) {
            throw new Error("connection has ended");
        }

        const header = this.decodeHeader(headerBuffer);
        const packetBuffer = await this.socket?.read(header.length) as Buffer | undefined;

        if (packetBuffer === undefined) {
            throw new Error("connection has ended");
        }

        return packetBuffer;
    }

    private encodeHeader(commandId: Command, length: number, deviceId: number): Buffer {
        const buffer = Buffer.alloc(HEADER_SIZE);

        // I have no idea why eslint thinks this variable is unused, so we'll disable the warning
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let index = buffer.write("ORGB", "ascii");
        index = buffer.writeUInt32LE(deviceId, index);
        index = buffer.writeUInt32LE(commandId as number, index);
        index = buffer.writeUInt32LE(length, index);

        return buffer;
    }

    private decodeHeader(buffer: Buffer): OpenRGBHeader {
        const deviceId = buffer.readUInt32LE(4);
        const commandId = buffer.readUInt32LE(8) as Command;
        const length = buffer.readUInt32LE(12);

        return { deviceId, commandId, length };
    }

}