const openrgb = require("../src/index.js"); // for your usecase use require("openrgb-sdk")

async function start() {
	const client = new openrgb.OpenRGBClient({
		host: "localhost",
		port: 6742,
		name: "Example"
	});

	await client.connect();

	const controllerCount = await client.getControllerCount();

	await client.updateMode(0, 3);

	const device = await client.getControllerData(2);

	client.disconnect();
}

start();
