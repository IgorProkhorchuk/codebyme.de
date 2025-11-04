document.addEventListener("DOMContentLoaded", function () {
    const countdownUnixElement = document.getElementById("countdown-unix");
    if (!countdownUnixElement) {
        return;
    }
    const openingDate = new Date("2025-11-25T00:00:00");
    let intervalId;
    const updateCountdown = () => {
        const now = Date.now();
        const distanceInMs = openingDate.getTime() - now;
        if (distanceInMs <= 0) {
            countdownUnixElement.textContent = "Welcome!";
            clearInterval(intervalId);
            return;
        }

        const totalSeconds = Math.floor(distanceInMs / 1000);
        countdownUnixElement.textContent = "time remaining: " + totalSeconds;
    };

    intervalId = setInterval(updateCountdown, 1000);
    updateCountdown();
});