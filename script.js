document.addEventListener("DOMContentLoaded", function () {
    const countdownElement = document.getElementById("countdown");
    if (!countdownElement) {
        return;
    }
    const openingDate = new Date("2025-11-25T00:00:00");
    let intervalId;
    const updateCountdown = () => {
        const now = Date.now();
        const distance = openingDate - now;

        if (distance <= 0) {
            countdownElement.textContent = "Welcome!";
            clearInterval(intervalId);
            return;
        }

        const dayInMs = 1000 * 60 * 60 * 24;
        const hourInMs = 1000 * 60 * 60;
        const minuteInMs = 1000 * 60;

        const days = Math.floor(distance / dayInMs);
        const hours = Math.floor((distance % dayInMs) / hourInMs);
        const minutes = Math.floor((distance % hourInMs) / minuteInMs);
        const seconds = Math.floor((distance % minuteInMs) / 1000);

        const pad = (value) => String(value).padStart(2, "0");

        countdownElement.textContent = `${days} days ${pad(hours)} hours ${pad(minutes)} minutes ${pad(seconds)} seconds`;
    };

    intervalId = setInterval(updateCountdown, 1000);
    updateCountdown();
});