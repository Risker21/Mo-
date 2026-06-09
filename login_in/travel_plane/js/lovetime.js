var boardingTime = new Date();
var TAKEOFF_OFFSET_MS = 13140;
var didTakeoffNotify = false;
var TICK_MS = 50;

function pad2(n) {
    return String(n).padStart(2, "0");
}

function formatSecondsCentis(ms) {
    var totalCentis = Math.max(0, Math.floor(ms / 10));
    var seconds = Math.floor(totalCentis / 100);
    var centis = totalCentis % 100;
    return seconds + "." + pad2(centis) + "s";
}

function updateFlightTimes() {
    var now = new Date();
    var takeoffTime = new Date(boardingTime.getTime() + TAKEOFF_OFFSET_MS);
    var timeToTakeoff = takeoffTime - now;

    var boardingEl = document.getElementById("boarding-time");
    var waitingEl = document.getElementById("waiting-time");
    var takeoffEl = document.getElementById("takeoff-time");
    var waitingLabelEl = document.getElementById("waiting-label");
    var takeoffStatusEl = document.getElementById("status-takeoff");
    var progressBarEl = document.getElementById("takeoff-progress-bar");

    if (!boardingEl || !takeoffEl) {
        return;
    }

    boardingEl.textContent = boardingTime.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    if (timeToTakeoff > 0) {
        takeoffEl.textContent = formatSecondsCentis(timeToTakeoff);
        if (takeoffStatusEl) {
            takeoffStatusEl.classList.toggle("is-urgent", timeToTakeoff <= 60 * 1000);
        }
        if (progressBarEl) {
            var progress = Math.min(1, Math.max(0, 1 - timeToTakeoff / TAKEOFF_OFFSET_MS));
            progressBarEl.style.width = Math.round(progress * 100) + "%";
        }

        if (waitingEl) {
            var waitingMs = now - boardingTime;
            waitingEl.textContent = formatSecondsCentis(waitingMs);
        }
        if (waitingLabelEl) {
            waitingLabelEl.textContent = "候机时间";
        }

        document.body.classList.remove("flight-takeoff");
        var bar = document.querySelector(".flight-info-bar");
        if (bar) {
            bar.classList.remove("is-takeoff");
        }
    } else {
        takeoffEl.textContent = "已起飞";
        document.body.classList.add("flight-takeoff");
        var bar2 = document.querySelector(".flight-info-bar");
        if (bar2) {
            bar2.classList.add("is-takeoff");
        }

        if (!didTakeoffNotify) {
            didTakeoffNotify = true;
            try {
                window.dispatchEvent(new CustomEvent("flight:takeoff"));
            } catch (e) {}
        }

        if (waitingEl) {
            var flightMs = now - takeoffTime;
            waitingEl.textContent = formatSecondsCentis(flightMs);
        }
        if (waitingLabelEl) {
            waitingLabelEl.textContent = "飞行时间";
        }

        if (progressBarEl) {
            progressBarEl.style.width = "100%";
        }
        if (takeoffStatusEl) {
            takeoffStatusEl.classList.remove("is-urgent");
        }
    }

    window.setTimeout(updateFlightTimes, TICK_MS);
}

updateFlightTimes();
