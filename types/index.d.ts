export const Client: {
    new (name: string, port: number, host: string, settings?: any): import("./client");
};
export const Device: {
    new (buffer: any, deviceId: any, protocolVersion: any): import("./device");
};
export const utils: {
    color(r: number, g: number, b: number): {
        red: number;
        green: number;
        blue: number;
    };
    hexColor(hex: string): {
        red: number;
        green: number;
        blue: number;
    };
    HSLColor(h: number, s: number, l: number): {
        red: number;
        green: number;
        blue: number;
    };
    HSVColor(h: number, s: number, v: any): {
        red: number;
        green: number;
        blue: number;
    };
    randomColor(): {
        red: number;
        green: number;
        blue: number;
    };
    randomHColor(): {
        red: number;
        green: number;
        blue: number;
    };
    command: {
        requestControllerCount: number;
        requestControllerData: number;
        requestProtocolVersion: number;
        setClientName: number;
        deviceListUpdated: number;
        requestProfileList: number;
        saveProfile: number;
        loadProfile: number;
        deleteProfile: number;
        resizeZone: number;
        updateLeds: number;
        updateZoneLeds: number;
        updateSingleLed: number;
        setCustomMode: number;
        updateMode: number;
        saveMode: number;
    };
    deviceType: {
        motherboard: number;
        dram: number;
        gpu: number;
        cooler: number;
        ledstrip: number;
        keyboard: number;
        mouse: number;
        mousemat: number;
        headset: number;
        headsetStand: number;
        gamepad: number;
        light: number;
        speaker: number;
        virtual: number;
        storage: number;
        unknown: number;
    };
    direction: {
        left: number;
        right: number;
        up: number;
        down: number;
        horizontal: number;
        vertical: number;
    };
};
