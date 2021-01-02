export default class OpenRGBDevice {

    public type: number;
    public name: string;
    public desc: string;
    public version: string;
    public serial: string;
    public location: string;
    public activeMode: number;
    public leds: Led[];
    public colors: Color[];
    public modes: Mode[];
    public zones: Zone[];

    constructor(buffer: Buffer) {
        let offset = 4;

        this.type = buffer.readUInt32LE(offset);
        offset += 4;
        const { text: name, length: nameLength } = readString(buffer, offset);
        this.name = name;
        offset += nameLength;
        const { text: desc, length: descLength } = readString(buffer, offset);
        this.desc = desc;
        offset += descLength;
        const { text: version, length: versionLength } = readString(buffer, offset);
        this.version = version;
        offset += versionLength;
        const { text: serial, length: serialLength } = readString(buffer, offset);
        this.serial = serial;
        offset += serialLength;
        const { text: location, length: localLength } = readString(buffer, offset);
        this.location = location;
        offset += localLength;

        const modeCount = buffer.readUInt16LE(offset);
        offset += 2;

        this.activeMode = buffer.readUInt32LE(offset);
        offset += 4;

        const { modes, offset: readModesOffset } = readModes(buffer, modeCount, offset);
        this.modes = modes;
        offset = readModesOffset;

        const zoneCount = buffer.readUInt16LE(offset);
        offset += 2;

        const { zones, offset: readZonesOfsset } = readZones(buffer, zoneCount, offset);
        this.zones = zones;
        offset = readZonesOfsset;

        const ledCount = buffer.readUInt16LE(offset);
        offset += 2;

        this.leds = [];

        for (let ledIndex = 0; ledIndex < ledCount; ledIndex++) {
            const { text: ledName, length: ledNameLength } = readString(buffer, offset);
            offset += ledNameLength;
            const color = readColor(buffer, offset);
            offset += 4;

            this.leds.push({
                name: ledName,
                value: color
            })
        }

        const colorCount = buffer.readUInt16LE(offset);
        offset += 2;

        this.colors = [];

        for (let colorIndex = 0; colorIndex < colorCount; colorIndex++) {
            this.colors.push(readColor(buffer, offset));
            offset += 4;
        }
    }
}

export type Led = {
    name: string;
    value: Color;
}

export type Mode = {
    name: string;
    value: number;
    flags: number;
    speedMin: number;
    speedMax: number;
    colorMin: number;
    colorMax: number;
    speed: number;
    direction: number;
    colorMode: number;
    colors: Color[];
};

type ReadModesResult = {
    modes: Mode[];
    offset: number;
}

function readModes(buffer: Buffer, modeCount: number, offset: number): ReadModesResult {
    const modes = [];

    for (let modeIndex = 0; modeIndex < modeCount; modeIndex++) {
        const { text: modeName, length: modeNameLength } = readString(buffer, offset);
        offset += modeNameLength;
        const value = buffer.readInt32LE(offset);
        offset += 4;
        const flags = buffer.readUInt32LE(offset);
        offset += 4;
        const speedMin = buffer.readUInt32LE(offset);
        offset += 4;
        const speedMax = buffer.readUInt32LE(offset);
        offset += 4;
        const colorMin = buffer.readUInt32LE(offset);
        offset += 4;
        const colorMax = buffer.readUInt32LE(offset);
        offset += 4;
        const speed = buffer.readUInt32LE(offset);
        offset += 4;
        const direction = buffer.readUInt32LE(offset);
        offset += 4;
        const colorMode = buffer.readUInt32LE(offset);
        offset += 4;

        const colorLength = buffer.readUInt16LE(offset);
        offset += 2;

        const colors = [];

        for (let colorIndex = 0; colorIndex < colorLength; colorIndex++) {
            const color = readColor(buffer, offset);
            colors.push(color);
            offset += 4;
        }

        modes.push({
            name: modeName,
            value,
            flags,
            speedMin,
            speedMax,
            colorMin,
            colorMax,
            speed,
            direction,
            colorMode,
            colors
        });
    }

    return { modes, offset };
}

export type Zone = {
    name: string;
    type: number;
    ledsMin: number;
    ledsMax: number;
    ledsCount: number;
};

type ReadZonesResult = {
    zones: Zone[];
    offset: number;
}

function readZones(buffer: Buffer, zoneCount: number, offset: number): ReadZonesResult {
    const zones = [];

    for (let zoneIndex = 0; zoneIndex < zoneCount; zoneIndex++) {
        const { text: zoneName, length: zoneNameLength } = readString(buffer, offset);
        offset += zoneNameLength;
        const type = buffer.readInt32LE(offset);
        offset += 4;
        const ledsMin = buffer.readUInt32LE(offset);
        offset += 4;
        const ledsMax = buffer.readUInt32LE(offset);
        offset += 4;
        const ledsCount = buffer.readUInt32LE(offset);
        offset += 4;
        const matrixSize = buffer.readUInt16LE(offset);
        offset += 2 + matrixSize; // TODO: Parse matrix

        zones.push({
            name: zoneName,
            type,
            ledsMin,
            ledsMax,
            ledsCount,
        });
    }

    return { zones, offset };
}

type ReadStringResult = {
    length: number;
    text: string;
}

function readString(buffer: Buffer, offset: number): ReadStringResult {
    const length = buffer.readUInt16LE(offset);
    const text = new TextDecoder().decode(buffer.slice(offset + 2, offset + length + 1));

    return { text, length: length + 2 }
}

export type Color = {
    red: number;
    green: number;
    blue: number;
}

function readColor(buffer: Buffer, offset: number): Color {
    const red = buffer.readUInt8(offset++);
    const green = buffer.readUInt8(offset++);
    const blue = buffer.readUInt8(offset++);

    return { red, green, blue };
}