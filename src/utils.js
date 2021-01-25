module.exports = {
	/**
	 * converts RGB values to an RGB-object
	 * @param {number} r red value 
	 * @param {number} g green value
	 * @param {number} b blue value
	 */
	color: function (r, g, b) {
		return {
			red: isNaN(+r) ? 0 : +r > 255 ? 255 : +r,
			green: isNaN(+g) ? 0 : +g > 255 ? 255 : +g,
			blue: isNaN(+b) ? 0 : +b > 255 ? 255 : +b,
		}
	},
	/**
	 * converts a hex string to an RGB-Object
	 * @param {string} hex the hex-string, does not have to start with a hashtag
	 */
	HEXColor: function (hex) {
		if (hex.startsWith("#")) hex = hex.slice(1)

		return {
			red: parseInt(hex.slice(0, 2), 16) || 0,
			green: parseInt(hex.slice(2, 4), 16) || 0,
			blue: parseInt(hex.slice(4, 6), 16) || 0,
		}
	},
	/**
	 * converts HSL values to an RGB-object based on the work of [mjackson](https://gist.github.com/mjackson/5311256)
	 * @param {number} h hue value [0, 359]
	 * @param {number} s saturation value [0, 1]
	 * @param {number} l lightness value [0, 1]
	 */
	HSLColor:  function (h, s, l) {
		let r, g, b

		h = (isNaN(+h) ? 0 : +h >= 360 ? 359 : +h) / 360
		s = isNaN(+s) ? 0 : +s > 1 ? 1 : +s
		l = isNaN(+l) ? 0 : +l > 1 ? 1 : +l

		if (s != 0) {
			function h2rgb (p, q, t) {
				if(t < 0) t += 1
				if(t > 1) t -= 1
				if(t < 1/6) return p + (q - p) * 6 * t
				if(t < 1/2) return q
				if(t < 2/3) return p + (q - p) * (2/3 - t) * 6
				return p
			}
	
			let q = l < 0.5 ? l * (1 + s) : l + s - l * s
			let p = 2 * l - q

			r = h2rgb(p, q, h + 1/3)
			g = h2rgb(p, q, h)
			b = h2rgb(p, q, h - 1/3)

		} else r = g = b = l

		return { red: Math.floor(r * 255), green: Math.floor(g * 255), blue: Math.floor(b * 255) }
	},
	/**
	 * converts HSL values to an RGB-object based on the [wikipedia article](https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB)
	 * @param {number} h hue value [0, 359]
	 * @param {number} s saturation value [0, 1]
	 * @param {number} l lightness value [0, 1]
	 */
	HSVColor: function (h, s, v) {
		let r, g, b

		h = isNaN(+h) ? 0 : +h >= 360 ? 359 : +h
		s = isNaN(+s) ? 0 : +s > 1 ? 1 : +s
		v = isNaN(+v) ? 0 : +v > 1 ? 1 : +v

		if (s != 0) {
			h /= 60
			let i = Math.floor(h)
			let f = h - i
			let p = v * (1 - s)
			let q = v * (1 - s * f)
			let t = v * (1 - s * (1 - f))
	
			switch (i) {
				case 0: r = v, g = t, b = p; break;
				case 1: r = q, g = v, b = p; break;
				case 2: r = p, g = v, b = t; break;
				case 3: r = p, g = q, b = v; break;
				case 4: r = t, g = p, b = v; break;
				default: r = v, g = p, b = q; break;
			}
		} else r = g = b = v;

		return { red: Math.floor(r * 255), green: Math.floor(g * 255), blue: Math.floor(b * 255) }
	},
	command: {
		requestControllerCount: 0,
		requestControllerData: 1,
		requestProtocolVersion: 40,
		setClientName: 50,
		deviceListUpdated: 100,
		resizeZone: 1000,
		updateLeds: 1050,
		updateZoneLeds: 1051,
		updateSingleLed: 1052,
		setCustomMode: 1100,
		updateMode: 1101,
	},
	deviceType: {
		motherboard: 0,
		dram: 1,
		gpu: 2,
		cooler: 3,
		ledstrip: 4,
		keyboard: 5,
		mouse: 6,
		mousemat: 7,
		headset: 8,
		headsetStand: 9,
		gamepad: 10,
		light: 11,
		unknown: 12
	},
	direction: {
		left: 0,
		right: 1,
		up: 2,
		down: 3,
		horizontal: 4,
		vertical: 5 
	}
}