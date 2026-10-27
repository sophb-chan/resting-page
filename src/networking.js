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
