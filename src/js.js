// helpers
function debounce(func, ms) {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(function () {
			func.apply(this, args);
		}, ms);
	};
}
function displayTime(ms) {
	if (ms < 1e3) {
		return `${ms}ms`;
	} else if (ms < 60e3) {
		return `${Math.trunc(ms / 1e3)}s`;
	} else if (ms < 3.6e6) {
		return `${Math.trunc(ms / 60e3)}m`;
	} else if (ms < 8.64e7) {
		return `${Math.trunc(ms / (60e3 * 60))}h`;
	} else if (ms < 6.048e8) {
		return `${(ms / 8.64e7).toFixed(2)}d`;
	} else {
		return `${(ms / (60e3 * 60 * 24 * 7)).toFixed(2)}w`;
	}
}
function displayStackedTime(time, includeMs = false) {
	function displayedTimeScale(time) {
		const displayedTime = displayTime(time);
		return /\d+([a-z]+)$/.exec(displayedTime)?.[1] ?? "";
	}

	const displayedTimes = [];
	do {
		displayedTimes.push(displayTime(time));
		const timeScale = displayedTimeScale(time);
		if (timeScale === "ms") break;
		const wraparounds = {
			w: 6.048e8,
			d: 8.64e7,
			h: 3.6e6,
			m: 60e3,
			s: 1e3,
		};
		time %= wraparounds[timeScale];
	} while (displayedTimeScale(time) !== "ms");
	if (includeMs && !displayedTimes[displayedTimes.length - 1].endsWith("ms"))
		displayedTimes.push(displayTime(time));

	return displayedTimes.join(" ");
}
function delay(ms) {
	return new Promise((res) => setTimeout(res, ms));
}

// element variables
const batteryPercentage = document.getElementById("battery-percent");
const batteryIsCharging = document.getElementById("battery-ischarging");
const batteryChargeType = document.getElementById("battery-chargetype");
const batteryChargeTime = document.getElementById("battery-chargetime");
const restingTime = document.getElementById("resting-time");
const timeAndDate = document.getElementById("time-and-date");
const isOnline = document.getElementById("is-online");
const connectionType = document.getElementById("connection-type");
const effectiveType = document.getElementById("effective-type");
const pingTime = document.getElementById("ping");
const fpsCounter = document.getElementById("fps");
const heapUsed = document.getElementById("heap-used");

// interactions
let lastMouseMove = Date.now();
let restTime = 0;
document.addEventListener("mousemove", () => {
	lastMouseMove = Date.now();
	restTime = 0;
});

// battery charge/discharge estimation
localStorage.batteryEstim ??= JSON.stringify({
	recordedChargeTimes: [],
	recordedDischargeTimes: [],
});
const batteryEstimation = JSON.parse(localStorage.batteryEstim);
let lastBatteryChargeTime, lastBatteryDischargeTime, lastBatteryLevel;

// battery
let estimateTimeout;
navigator.getBattery().then((battery) => {
	lastBatteryLevel = battery.level;
	const estimate = () => {
		return {
			chargeTime: battery.charging || batteryEstimation.recordedChargeTimes.length === 0
				? batteryEstimation.recordedChargeTimes.reduce(
						(accumulator, time, index) =>
							(accumulator + time) /
							(index === batteryEstimation.recordedChargeTimes
								? batteryEstimation.recordedChargeTimes.length
								: 1),
						0,
					)
				: Infinity,
			dischargeTime: !battery.charging || batteryEstimation.recordedDischargeTimes.length === 0
				? batteryEstimation.recordedDischargeTimes.reduce(
						(accumulator, time, index) =>
							(accumulator + time) /
							(index === batteryEstimation.recordedDischargeTimes
								? batteryEstimation.recordedDischargeTimes
										.length
								: 1),
						0,
					)
				: Infinity,
		};
	};
	const updateBatteryLevelChangeRecords = () => {
		if (battery.charging && battery.level - lastBatteryLevel >= 0) {
			if (lastBatteryChargeTime)
				batteryEstimation.recordedChargeTimes.push(
					Date.now(lastBatteryChargeTime),
				);
			lastBatteryChargeTime = Date.now();
		} else {
			if (lastBatteryDischargeTime)
				batteryEstimation.recordedDischargeTimes.push(
					Date.now(lastBatteryDischargeTime),
				);
			lastBatteryDischargeTime = Date.now();
		}

		localStorage.batteryEstim = JSON.stringify(batteryEstimation);
	};
	const updateBatteryPercentage = () => {
		batteryPercentage.textContent = Math.trunc(battery.level * 100);
		updateBatteryLevelChangeRecords();
		lastBatteryLevel = battery.level;
	};
	const updateBatteryCharging = () => {
		batteryIsCharging.textContent = battery.charging ? "yes" : "no";
		updateBatteryStatus();
	};
	const updateBatteryStatus = () => {
		batteryChargeType.textContent = battery.charging ? "is full" : "drains";
		if (
			!isFinite(battery.chargingTime) &&
			!isFinite(battery.dischargingTime)
		) {
			batteryChargeTime.textContent = "Estimating...";
			clearTimeout(estimateTimeout);
			estimateTimeout = setTimeout(() => {
				// TODO: make your own estimation system
				batteryChargeTime.textContent =
					"Estimating... (Switching to non-native estimation in 0 seconds...)";
				estimateTimeout = setTimeout(() => {
					batteryChargeTime.textContent = `Could not estimate battery ${battery.charging ? "charge" : "discharge"} time (natively), trying custom estimation...`;
					const estimated = estimate();
					console.log(estimated);
					batteryChargeTime.textContent = `Estimated. Check console!`;
				}, 0e3);
			}, 0e3);
		} else {
			clearTimeout(estimateTimeout);
			batteryChargeTime.textContent = displayStackedTime(
				Math.min(battery.chargingTime, battery.dischargingTime) * 1e3,
			);
		}
	};

	updateBatteryPercentage();
	updateBatteryCharging();
	updateBatteryStatus();

	battery.onlevelchange = updateBatteryPercentage;
	battery.onchargingchange = updateBatteryCharging;
	battery.ondischargingtimechange = battery.onchargingtimechange =
		updateBatteryStatus;
});

// networking
isOnline.textContent = navigator.onLine ? "yes" : "no";
connectionType.textContent = navigator.connection.type;
effectiveType.textContent = navigator.connection.effectiveType;
let lastOnline = navigator.onLine;
navigator.connection.addEventListener("change", () => {
	if (navigator.onLine && !lastOnline) ping();
	lastOnline = navigator.onLine;
	isOnline.textContent = navigator.onLine ? "yes" : "no";
	connectionType.textContent = navigator.connection.type;
	effectiveType.textContent = navigator.connection.effectiveType;
});
const ping = async (...urls) => {
	if (urls.length === 0)
		urls = [
			"https://httpbin.org/",
			"http://dns.google/",
			"https://dns.opendns.com",
		];
	for (const [index, url] of urls.entries()) {
		pingTime.textContent = `Pinging '${url}'...`;
		if (!navigator.onLine) {
			pingTime.textContent =
				"Unable to ping - Device has no access to internet";
			return null;
		}
		const startTime = Date.now();
		try {
			await fetch(url, { mode: "no-cors" });
		} catch {
			pingTime.textContent = `Unable to ping '${url}' - Fetch failed`;
			if (index !== urls.length - 1) await delay(500);
			continue;
		}
		const totalTime = Date.now() - startTime;
		pingTime.textContent = displayStackedTime(totalTime, true);
		return totalTime;
	}
};
setInterval(ping, 15e3);
ping();

// check for updates
let lastSha;
async function updateCheck() {
	const latestSha = JSON.parse(
		await (
			await fetch(
				"https://api.github.com/repos/sophb-ccjt/resting-page/commits?per_page=1&sha=main&nocache=" +
					Math.random(),
			)
		).text(),
	)[0]?.sha;

	if (lastSha == null) lastSha = latestSha;
	else if (lastSha !== latestSha && navigator.onLine) location.reload();
}
updateCheck();
setInterval(updateCheck, 10 * 60e3);

// main loop
let battery = {};
let debuggingMode = false;
let lastFpsMeasure = 0,
	frame,
	fps;
async function main() {
	// cursor hiding
	if (Date.now() - lastMouseMove >= 3e3) {
		document.body.style.cursor = "none";
		restTime = Date.now() - lastMouseMove - 3e3;
		restingTime.textContent = displayTime(restTime);
	} else {
		document.body.style.cursor = "auto";
		restTime = 0;
		restingTime.textContent = "Not resting";
	}

	// short-circuit for optimization
	if (!document.hasFocus()) {
		requestAnimationFrame(main);
		return;
	}

	// fps
	if (Date.now() - lastFpsMeasure >= 1e3) {
		fps = frame;
		fpsCounter.textContent = fps ?? "Measuring...";
		lastFpsMeasure = Date.now();
		frame = 0;
	} else {
		frame += 1;
	}

	// battery probe
	if (debuggingMode && restTime < 60e3)
		battery = await navigator.getBattery();

	// time and date
	const now = new Date();
	timeAndDate.textContent = `${now.toLocaleTimeString()} ${now.toLocaleDateString()}`;

	// heap used
	heapUsed.textContent =
		(
			(performance.memory.usedJSHeapSize /
				performance.memory.jsHeapSizeLimit) *
			100
		).toFixed(2) + "%";
	requestAnimationFrame(main);
}
main();
