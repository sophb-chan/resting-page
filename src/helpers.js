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
	return new Promise((r) => setTimeout(r, ms));
}
function getInfoSection(infoSectionName) {
	return document.querySelector(`.info-section#${infoSectionName}`);
}

// element variables
const batteryPercentage = document.getElementById("battery-percent"),
	batteryIsCharging = document.getElementById("battery-ischarging"),
	batteryChargeType = document.getElementById("battery-chargetype"),
	batteryChargeTime = document.getElementById("battery-chargetime"),
	restingTime = document.getElementById("resting-time"),
	timeAndDate = document.getElementById("time-and-date"),
	isOnline = document.getElementById("is-online"),
	connectionType = document.getElementById("connection-type"),
	effectiveType = document.getElementById("effective-type"),
	pingTime = document.getElementById("ping"),
	fpsCounter = document.getElementById("fps"),
	heapUsed = document.getElementById("heap-used");
