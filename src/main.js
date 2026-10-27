// main loop
let battery = {};
let debuggingMode = false;
let lastFpsMeasure = 0,
	frame,
	fps;
const weeks = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
];
Object.seal(weeks);
const cursorHideDelay = 3e3;
async function main() {
	// cursor hiding
	if (Date.now() - lastMouseMove >= cursorHideDelay) {
		document.body.style.cursor = "none";
		restTime = Date.now() - lastMouseMove - cursorHideDelay;
		restingTime.textContent = displayTime(restTime);
	} else {
		document.body.style.cursor = "auto";
		restTime = 0;
		restingTime.textContent = "Not resting";
	}

	// fps
	if (document.hasFocus()) {
		if (Date.now() - lastFpsMeasure >= 1e3) {
			fps = frame;
			fpsCounter.textContent = fps ?? "Measuring...";
			lastFpsMeasure = Date.now();
			frame = 0;
		} else frame += 1;
	} else {
		frame = 0;
		lastFpsMeasure = Date.now();
	}

	// short-circuit for optimization
	if (!document.hasFocus()) {
		requestAnimationFrame(main);
		return;
	}

	// battery probe
	if (debuggingMode && restTime < 60e3)
		battery = await navigator.getBattery();

	// time and date
	const now = new Date();
	timeAndDate.textContent = `${weeks[now.getDay()]}, ${now.toLocaleDateString()} - ${now.toLocaleTimeString().replaceAll(':', now.getSeconds() % 2 ? ' ' : ':')}`;

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
