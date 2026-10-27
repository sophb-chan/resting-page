let estimateTimeout;
const batteryInfoSection = getInfoSection('battery');
navigator.getBattery().then((battery) => {
	battery.exists = !(
		(
			battery.level === 1 &&
			battery.charging === true &&
			battery.dischargingTime === Infinity
		) ||
		!('onlevelchange' in battery) ||
		navigator?.battery != null
	);

	if (!battery.exists) {
		batteryInfoSection.style.display = 'none';
		return;
	} else {
		batteryInfoSection.style.display = 'revert';
	}

	const updateBatteryPercentage = () => {
		batteryPercentage.textContent = Math.trunc(battery.level * 100);
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
				// TODO: make your own (working) estimation system
				batteryChargeTime.textContent =
					"Estimating... (Giving up in 10 seconds...)";
				estimateTimeout = setTimeout(() => {
					batteryChargeTime.textContent = `Could not estimate battery ${battery.charging ? "charge" : "discharge"} time :(`;
				}, 10e3);
			}, 20e3);
		} else {
			clearTimeout(estimateTimeout);
			const estimated = {
				chargingTime: battery.chargingTime,
				dischargingTime: battery.dischargingTime,
			};
			batteryChargeTime.textContent = displayStackedTime(
				Math.min(estimated.chargingTime, estimated.dischargingTime) *
				1e3,
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
