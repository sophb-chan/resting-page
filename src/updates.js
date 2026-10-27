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
