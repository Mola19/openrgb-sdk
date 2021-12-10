# changelog

all notable changes to this project will be documented in this file.

the format is loosely based on [keep a changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [semantic versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2021-12-07

### added

- `"deviceListUpdated"` event when openrgb detects a new device
- `getAllControllerData` function, that returns all devices
- profile control functions to `Client`
  - `getProfileList`
  - `saveProfile`
  - `loadProfile`
  - `deleteProfile`
- `saveMode` function
- updated code for protocol v3 (brightness and saving support)
- moved setting the client name to it's own function `setClientName`
- automatically get protocol version on connect and add it to `client.protocolVersion`
- new command numbers in utils
- new device types in utils
- MIT license
- a settings object as the 4 (optional) argument 
  - `forceProtocolVersion`

### changed

- many functions aren't async anymore
- used shortcuts for function declaration in `util.js`

### fixed

- fixed jsdocs
- ignores now unexpected data from openrgb
- now working in v17
- "Invalid array length" bug 
- protocol version (never has been properly implemented)
- forwards compatibility
- support for procotol version 0

### removed

- dropped promise-socket dependency
- deleted useless tab-characters

## [0.4.3] - 2021-06-10

### changed

- changed name of credit in `README.md`
- made also compatible with node version less than 14 ([#2](https://github.com/Mola19/openrgb-sdk/issues/2))

### removed

- `package-lock.json`

## [0.4.2] - 2021-05-13

### added

- added `.isConnected` boolean to class `Client`
- color now possible in options even if mode has perLedColor (seperate updateLeds request)
- added speaker and virtual device types

### fixed

- fixed spelling in `README.md` ([#1](https://github.com/Mola19/openrgb-sdk/pull/1))
- fixed matrix size

## [0.4.1] - 2021-03-05

### added

- added matrix to device

### fixed

- fixed `HSLColor` and `HSVColor` for values higher than 360

## [0.4.0] - 2021-02-22

### added

- added EventEmitter
- `"connect"` and `"disconnect"` events
- utils: added `randomColor` and `randomHColor`hexColor
- `package.json`: added repo and homepage

### changed

- utils: made `hexColor` safe to `undefined`

### fixed

- fixed typo in `client.js`
- fixed speed and direction not working
- utils: `color` will now always return whole numbers

## [0.3.1] - 2021-01-25

### fixed

- fixed code in `README.md`
- examples: added `await` to disconnect in `basic.js`

### changed

- renamed `HEXColor` => `hexColor`

## [0.3.0] - 2021-01-25

### added

- added updateSingleLed
- expanded utils
- utils: added `color`, `HEXColor`, `HSLColor` and `HSVColor` functions
- utils: added `command` function
- added and improved examples
- added JSDoc

### changed

- renamed OpenRGBClient => Client
- renamed OpenRGBDevice => Device

### removed

- utils: function for `command`, `deviceType`, `direction` object

### fixed

- fixed casing in `README.md`

## [0.2.0] - 2021-01-04

### added

- added `example/rainbow.js`
- added utils
- added command getProtocolVersion
- added command resizeZone

### changed

- significantly improved `README.md`
- removed unnecessary semicolons

### removed

- removed `example/index.js`
- removed `src/command.js`

### fixed

- fixed indentation

## [0.1.0] - 2021-01-02

### added

- forked [https://github.com/zebp/openrgb](openrgb by zebp)
- added updateMode

### changed

- improved `README.md`
- converted typescript to javascript

### removed

- removed eslint

### fixed

- fix: getDeviceController