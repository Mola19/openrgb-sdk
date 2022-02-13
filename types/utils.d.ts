/**
 * converts RGB values to an RGB-object
 * @param {number} r red value
 * @param {number} g green value
 * @param {number} b blue value
 */
export function color(r: number, g: number, b: number): {
    red: number;
    green: number;
    blue: number;
};
/**
 * converts a hex string to an RGB-Object
 * @param {string} hex the hex-string, does not have to start with a hashtag
 */
export function hexColor(hex: string): {
    red: number;
    green: number;
    blue: number;
};
/**
 * converts HSL values to an RGB-object based on the work of [mjackson](https://gist.github.com/mjackson/5311256)
 * @param {number} h hue value [0, 359]
 * @param {number} s saturation value [0, 1]
 * @param {number} l lightness value [0, 1]
 */
export function HSLColor(h: number, s: number, l: number): {
    red: number;
    green: number;
    blue: number;
};
/**
 * converts HSV values to an RGB-object based on the [wikipedia article](https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB)
 * @param {number} h hue value [0, 359]
 * @param {number} s saturation value [0, 1]
 * @param {number} v value value [0, 1]
 */
export function HSVColor(h: number, s: number, v: number): {
    red: number;
    green: number;
    blue: number;
};
/**
 * outputs a random color
 */
export function randomColor(): {
    red: number;
    green: number;
    blue: number;
};
/**
 * outputs a random color, that is more colourful than .randomColor()
 */
export function randomHColor(): {
    red: number;
    green: number;
    blue: number;
};
export namespace command {
    const requestControllerCount: number;
    const requestControllerData: number;
    const requestProtocolVersion: number;
    const setClientName: number;
    const deviceListUpdated: number;
    const requestProfileList: number;
    const saveProfile: number;
    const loadProfile: number;
    const deleteProfile: number;
    const resizeZone: number;
    const updateLeds: number;
    const updateZoneLeds: number;
    const updateSingleLed: number;
    const setCustomMode: number;
    const updateMode: number;
    const saveMode: number;
}
export namespace deviceType {
    const motherboard: number;
    const dram: number;
    const gpu: number;
    const cooler: number;
    const ledstrip: number;
    const keyboard: number;
    const mouse: number;
    const mousemat: number;
    const headset: number;
    const headsetStand: number;
    const gamepad: number;
    const light: number;
    const speaker: number;
    const virtual: number;
    const storage: number;
    const unknown: number;
}
export namespace direction {
    const left: number;
    const right: number;
    const up: number;
    const down: number;
    const horizontal: number;
    const vertical: number;
}
