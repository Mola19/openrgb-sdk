export = Device;
declare class Device {
    constructor(buffer: any, deviceId: any, protocolVersion: any);
    deviceId: any;
    type: any;
    activeMode: any;
    modes: {
        id: number;
        name: string;
        colorLength: any;
        colors: any[];
        flagList: any[];
    }[];
    zones: {
        name: string;
        id: number;
    }[];
    leds: {
        name: string;
        value: {
            red: any;
            green: any;
            blue: any;
        };
    }[];
    colors: {
        red: any;
        green: any;
        blue: any;
    }[];
}
