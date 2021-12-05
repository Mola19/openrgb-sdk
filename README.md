# About

An SDK client for the RGB Software [OpenRGB](https://gitlab.com/CalcProgrammer1/OpenRGB/ "gitlab/CalcProgramer1/OpenRGB")

It is based on the already written, but apparently abandoned, [node.js OpenRGB](https://github.com/zebp/openrgb "github/zebp/openrgb") library by [zebp](https://github.com/zebp "zebp") and the [Python implementation](https://github.com/jath03/openrgb-python "github/jath03/openrgb-python") by [jath03](https://github.com/jath03 "jath03").

It is still under heavy development, poorly written, and inconvenient to use, but since I'll probably forget this project in the next 5 seconds, I wanted to make this accessible for later generations of confused people.

# Installation

```
$ npm install openrgb-sdk
```

# Table of Content

- [About](#about)
- [Installation](#installation)
- [Table of Content](#table-of-content)
- [Guide](#guide)
	- [Setup](#setup)
		- [OpenRGB](#openrgb)
		- [Start the SDK-Server](#start-the-sdk-server)
		- [Node.js](#nodejs)
	- [Getting Started](#getting-started)
	- [Functions](#functions)
		- [Get device data](#get-device-data)
		- [Changing the LEDs of your device](#changing-the-leds-of-your-device)
			- [Setting it to a native mode](#setting-it-to-a-native-mode)
			- [Modify the LEDs yourself](#modify-the-leds-yourself)
		- [Make RGB objects](#make-rgb-objects)
- [Documentation](#documentation)
- [Examples](#examples)

# Guide

## Setup

### OpenRGB

Installation: [Gitlab OpenRGB Setup and Usage](https://gitlab.com/CalcProgrammer1/OpenRGB/-/wikis/OpenRGB-Windows-Setup-and-Usage)

### Start the SDK-Server

After successful installation click on the SDK-Client tab and click on `Start Server`, which should then set the Server Status to `online`. If you want it to start the SDK client on startup [follow this guide](https://www.howtogeek.com/228467/how-to-make-a-program-run-at-startup-on-any-computer/). Next, for Windows, right click on the icon and paste `--server` behind `target`, and for Linux paste `--server` behind `command`. This also applies if you are launching it through your console.

### Node.js

**most of the functions in openrgb-sdk rely on the javascript async/await functionality so you are going to have to put all of your code in a function similar to:**

```js
async function start () {
	
}

start()
```

## Getting Started

```js
const { Client } = require("openrgb-sdk")

async function start () {
	const client = new Client("Example", 6742, "localhost")
	
	await client.connect()

	/*
		- your code -
	*/

	await client.disconnect()
}

start()

```
You can familliarise yourself with this syntax [here.](https://javascript.info/async-await)

## Functions

### Get device data

You have two functions to get device data:

First, get the amount of devices connected to OpenRGB:

```js
	const amount = await client.getControllerCount()
```

Then, you can get the data of a specific device:

```js
	const device_0 = await client.getControllerData(0)
```

This function needs the ID of the device. The ID is just an ascending number, starting at 0, of the devices you have. They are given to the device just like they are listed in OpenRGB. This means, that if `getControllerCount()` gives back 2, you know that there are 3 devices: device 0, 1 and 2. With that knowledge you can just use a `for` loop to get all your devices.

```js
	let deviceList = []
	for (let deviceId = 0; deviceId < controllerCount; deviceId++) {
		deviceList.push(await client.getControllerData(deviceId))		
	}
```

### Changing the LEDs of your device

**[First of all ensure, that all other RGB programms on your PC are either uninstalled or closed. This includes background-programs.](https://gitlab.com/CalcProgrammer1/OpenRGB/-/wikis/OpenRGB-Windows-Setup-and-Usage#disable-other-rgb-applications)**

There are two ways to change the leds of your devices:

#### Setting it to a native mode

Every device has native modes you can set it to. They are saved on a chip inside of the device, and if you set a device to a mode, it will stay in this mode until it is changed by you or another RGB program in the background. This is more convenient, but almost impossible to synchronise across other devices. With the array you created before, you can now see the modes a device has and 
set a device to one of it's modes. This function takes the device id first, and then either accepts the name (as String/Text) or the id (as Number).

```js
	console.log(deviceList[0].modes) 
	await client.updateMode(0, deviceList[0].modes[5].id)
	await client.updateMode(1, deviceList[1].modes[3].name)
```

#### Modify the LEDs yourself

You can also change the LEDs of the device by yourself. These will also be set until changed, but you might want animated modes. They need the process to be running, and if its stopped the LEDs will be frozen in their color until they are changed. This is easier to sync, which is the why you'll probably use this more often. Also, you probably want to set the device before to the `direct` mode (which should be always mode 0), although they should be set to this at start.

The function first needs the device ID, and then an array of colors in RGB scheme. One item in the array resembles one LED, so to set all LEDs you have to create an array with the amount of LEDs the device has. If you only want one single color for the whole device you can just fill the array with the `.fill()` method.

```js
	const colors = Array(deviceList[2].colors.length).fill({
		red: 0xFF,
		green: 0xA5,
		blue: 0x00
	})
	
	console.log(`Setting the color of ${deviceList[2].name}`)
	await client.updateLeds(2, colors)
```

You can also set the LEDs for only one zone, or for a single LED, with simliar funtions.

An example for a custom mode using with updateLeds is found in `rainbow.js` in the `examples` folder.

### Make RGB objects

There are few ways to make RGB objects:

This is the regular way to of doing this, every value has to be set manually. All following ways output this kind of object:

```js
let violet = {
	red: 138,
	green: 43,
	blue: 226
}
```

This is quite long, and there are ways to compact it and/or use a different colour representation.

To simply compact it,

```js
const { utils } = require("openrgb-sdk")
let violet = utils.color(138, 43, 226)
```

To use a hex-string like CSS uses,

```js
const { utils } = require("openrgb-sdk")
let violet = utils.hexColor("#8a2be2")
```

to use the HSL-representation:

```js
const { utils } = require("openrgb-sdk")
let violet = utils.HSLColor(271.1, 0.759, 0.527)
```

or to use the HSV-representation:

```js
const { utils } = require("openrgb-sdk")
let violet = utils.HSVColor(271.1, 0.81, 0.886)
```

if any of the values are invalid or negative, they will default to 0. Values that are too high will be defaulted to their highest possible value.

# Documentation

A full documentation is available under [docs.m4rch.xyz](https://docs.m4rch.xyz/openrgb/).

# Examples

For examples, take a look at the `examples` folder in the downloaded package in your `node_modules` folder. 
