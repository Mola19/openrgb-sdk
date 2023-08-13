export = Device;
declare class Device {
    constructor(buffer: any, deviceId: any, protocolVersion: any);
    deviceId: number;
    type: number;
    name: string;
    vendor?: string
    description: string;
    version: string;
    serial: string;
    location: string;
    activeMode: number;
    modes: {
        id: number;
        name: string;
        value: number;
        flags: number;
        speedMin: number;
        speedMax: number;
        brightnessMin?: number;
        brightnessMax?: number;
        colorMin: number;
        colorMax: number;
        speed: number;
        brightness?: number;
        direction: number;
        colorMode: number;
        colorLength: any;
        colors: RGBColor[];
        flagList: string[];
    }[];
    zones: {
        name: string;
        id: number;
        type: number;
        ledsMin: number;
        ledsMax: number;
        ledsCount: number;
        resizable: boolean;
        segments?: {
            name: string;
            type: number;
            start: number;
            length: number;
        }[]
    }[];
    leds: {
        name: string;
        value: RGBColor;
    }[];
    colors: RGBColor[];
}

interface RGBColor {
    red: number;
    green: number;
    blue: number;
}
