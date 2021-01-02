const { OpenRGBClient } = require("../dist/index.js");

async function start() {
    const client = new OpenRGBClient({
        host: "localhost",
        port: 6742,
        name: "Red Example"
    });

    await client.connect();
    const controllerCount = await client.getControllerCount();

    for (let deviceId = 0; deviceId < controllerCount; deviceId++) {
        const device = await client.getDeviceController(deviceId);
        const colors = Array(device.colors.length).fill({
            red: 0xFF,
            green: 0x00,
            blue: 0x00
        });

        console.log(`Setting the color of ${device.name}`);
        await client.updateLeds(deviceId, colors);
    }

    await client.disconnect();
}

start();