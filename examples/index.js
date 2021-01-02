const openrgb = require("../src/index.js"); // for your usecase use require("openrgb-sdk")

async function start() {
    const client = new openrgb.OpenRGBClient({
        host: "localhost",
        port: 6742,
        name: "Example"
    });

    await client.connect();

    const controllerCount = await client.getControllerCount();
    console.log(controllerCount)

    await client.updateMode(0, 3)

    const device = await client.getDeviceController(2)
    console.log(device)

    client.disconnect()
}

start();
