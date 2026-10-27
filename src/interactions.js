let lastMouseMove = Date.now();
let restTime = 0;
document.addEventListener("mousemove", () => {
	lastMouseMove = Date.now();
	restTime = 0;
});
