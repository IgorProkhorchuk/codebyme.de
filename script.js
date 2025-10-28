 const countDownDate = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;

const x = setInterval(function() {

const now = new Date().getTime();

const distance = countDownDate - now;

const days = Math.floor(distance / (1000 * 60 * 60 * 24));
const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
const seconds = Math.floor((distance % (1000 * 60)) / 1000);

document.getElementById("countdown").innerHTML = `(${days}d ${hours}h ${minutes}m ${seconds}s)`;

const remainingSeconds = Math.floor(distance / 1000);
document.getElementById("countdown-unix").innerHTML = `${remainingSeconds} seconds remaining`;

if (distance < 0) {
    clearInterval(x);
    document.getElementById("countdown").innerHTML = "SYSTEM ONLINE";
    document.getElementById("countdown-unix").innerHTML = "0 seconds remaining";
}
  }, 1000);