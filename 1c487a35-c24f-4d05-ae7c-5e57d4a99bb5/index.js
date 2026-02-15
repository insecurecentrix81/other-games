const GAMEVERSION = "dev-2.1.0"

let costMulti = 1.2;

let clicker = document.getElementById("clicker");
let clickerCountElem = document.getElementById("clicker-count");
let upgradeSection = document.getElementById("upgrade-section");
let prestigeBtn = document.querySelector("#prestige-btn");
let prestigeCountElem = document.querySelector("#prestige-count");
let shinyCountElem = document.querySelector("#shiny-count");
let currClickerSection;

class Upgrade {
    constructor(clicks, autoclicks, title, subtitle = "auto", cost = "auto") {
        this.cost = cost === "auto" ? clicks * 100 + autoclicks * 60 : cost;
        this.title = title;
        this.subtitle = subtitle === "auto" ? ((clicks === 0 ? "" : "+" + format(clicks) + " Anbu Power\n") + (autoclicks === 0 ? "" : "+" + format(autoclicks) + " SPS")) : subtitle;
        this.clicks = clicks;
        this.autoclicks = autoclicks;
    }
}

let upgrades = [
    new Upgrade(1000000000000000000000000, 1000000000000000000000000, "Anbu", "Final upgrade\n+10^24 Anbu Power\n+10^24 SPS"),
]

function resetGameState() {
    gameState.clickerCount = 0;
    gameState.prestigeCount = 0;
    gameState.shinyCount = 0;
    gameState.ownedUpgrades = new Array(upgrades.length).fill(0);
}

let gameState = {};
resetGameState();

let clickPower = 1;
let autoPerSec = 0;
let pendingPrestige = 0;

if (localStorage.getItem("gameState-v" + GAMEVERSION)) {
    try {
        gameState = JSON.parse(localStorage.getItem("gameState-v" + GAMEVERSION));
        if (!gameState.ownedUpgrades) {
            gameState.ownedUpgrades = new Array(upgrades.length).fill(0);
        }
    } catch (e) {
        //alert("Error in save state parsing");
        resetGameState();
    }
}

function format(num) {
    if (num < 1e3) {
        return num - Math.floor(num) === 0 ? num.toString() : num.toFixed(2);
    } else if (num < 1e12) {
        return Math.floor(num).toLocaleString();
    } else {
        return num.toExponential(6);
    }
}

function updateUpgradeSection() {
    let upgItems = document.querySelectorAll(".upgrade-item");

    let highestOwnedUpg = 0;
    for (let i = upgrades.length-1; i >= 0; i--) {
        if (gameState.ownedUpgrades[i] > 0) {highestOwnedUpg = i+1; break;}
    }

    for (let i = 0; i < upgItems.length; i++) {
        let upgrade = upgrades[i];
        let num = gameState.ownedUpgrades[i];
        let cost = Math.ceil(upgrade.cost * costMulti ** gameState.ownedUpgrades[i]);
        let item = upgItems[i];

        let isVisible = (i <= highestOwnedUpg || gameState.clickerCount >= upgrades[i - 1].cost);

        if (!isVisible) {
            item.innerHTML = `<pre class="upgrade-text"><strong>???</strong> <i class="small">(??? Anbu)</i></pre>`;
            item.classList.add("hidden");
        } else {
            item.classList.remove("hidden");
            if (gameState.clickerCount < cost) {
                item.classList.add("locked");
            } else {
                item.classList.remove("locked");
            }
            
            let desc = upgrade.subtitle ? upgrade.subtitle.replace(/\n/g, "<br>") : "";
            item.innerHTML = `<pre class="upgrade-text"><strong>${upgrade.title}</strong> <i class="small">(${format(cost)} Anbu)</i> <i class="small">(owned: ${num})</i>${desc ? "<p class=\"small\">" + desc + "</p>" : ""}</pre>`;
        }
    }

    if ((gameState.prestigeCount > 0 || gameState.clickerCount >= 1e27)) {
        prestigeBtn.innerHTML = `<pre class="upgrade-text"><strong>Anbu Prestige</strong> <p class="small">Ascend to a higher Anbu (+${pendingPrestige} Super Anbu)</p></pre>`;
    }
}

function updateCountDisplay() {
    clickerCountElem.innerHTML = `${format(gameState.clickerCount)}x Anbu`;
    shinyCountElem.innerHTML = `${format(gameState.shinyCount)}x Shiny Anbu`;
    shinyCountElem.style.display = gameState.shinyCount > 0 ? "block" : "none";
    prestigeCountElem.innerHTML = `${format(gameState.prestigeCount)}x Super Anbu <span class="small">(${format(2**gameState.prestigeCount)}x Anbu Production)</span>`
    prestigeCountElem.style.display = gameState.prestigeCount > 0 ? "block" : "none";
}

function buyUpgrade(index) {
    let cost = Math.ceil(upgrades[index].cost * costMulti ** gameState.ownedUpgrades[index]);
    if (gameState.clickerCount >= cost) {
        gameState.clickerCount -= cost;
        gameState.ownedUpgrades[index]++;
    }
}

function click() {
    gameState.clickerCount += clickPower;

    let numText = document.createElement("div");
    numText.classList.add("click-number-text");
    numText.innerHTML = "+" + format(clickPower);
    numText.style.top = (window.innerHeight/2 + 20 + 20*(Math.random()-1/2)) + "px";
    numText.style.left = (window.innerWidth/2 - 15 + 200*(Math.random()-1/2)) + "px";
    numText.addEventListener('animationend', numText.remove);
    document.querySelector("#click-number-texts").appendChild(numText);

    if (Math.random() < 1/512) {
        gameState.shinyCount++;

        let numText = document.createElement("div");
        numText.classList.add("click-number-text");
        numText.style.color = "#ffbf00";
        numText.style.fontSize = "24px";
        numText.innerHTML = "+1";
        numText.style.top = (window.innerHeight/2 + 20 + 20*(Math.random()-1/2)) + "px";
        numText.style.left = (window.innerWidth/2 - 15 + 200*(Math.random()-1/2)) + "px";
        numText.addEventListener('animationend', numText.remove);
        document.querySelector("#click-number-texts").appendChild(numText);
    }
}

function doPrestige() {
    if (pendingPrestige >= 1) {
        gameState.prestigeCount += pendingPrestige;
        gameState.ownedUpgrades = new Array(upgrades.length).fill(0);
        gameState.clickerCount = 0;
    }
}

document.addEventListener("DOMContentLoaded", (e) => {
    updateUpgradeSection();
    currClickerSection = "clicker-game-section";

    for (let i = 0; i < upgrades.length; i++) {
        let upg = upgrades[i];
        let desc = upg.subtitle ? upg.subtitle.replace(/\n/g, "<br>") : "";

        let upgItem = document.createElement("div");
        upgItem.classList.add("upgrade-btn");
        upgItem.classList.add("upgrade-item");
        upgItem.innerHTML = `<pre class="upgrade-text"><strong>???</strong> <i class="small">(??? Anbu)</i></pre>`;
        upgradeSection.appendChild(upgItem);
    }

    prestigeBtn.classList.add("upgrade-btn");
    prestigeBtn.innerHTML = '<pre class="upgrade-text"><strong>???????</strong><p class="small"></p></pre>';
    upgradeSection.appendChild(prestigeBtn);

    addEventListener("mousemove", (e) => {
        customCursor.style.transform = `translate(${e.clientX-20}px, ${e.clientY-20}px)`;
    }, {passive: true});

    clicker.addEventListener("click", click);

    document.getElementById("upgrade-svg").addEventListener("click", (e) => {
        currClickerSection = currClickerSection === "clicker-upgrade-section" ? "clicker-game-section" : "clicker-upgrade-section";
    });

    upgradeSection.addEventListener("click", (e) => {
        let target = e.target.closest(".upgrade-btn");
        if (target !== null) {
            if (target.id === "prestige-btn") {
                doPrestige();
            } else {
                let ind = Array.from(document.querySelectorAll(".upgrade-item")).indexOf(target);
                buyUpgrade(ind);
            }
        }
    });

    // autosave
    setInterval(() => {
        localStorage.setItem("gameState-v" + GAMEVERSION, JSON.stringify(gameState));
    }, 1000);

    setInterval(() => {
        updateCountDisplay();
        if (document.querySelector("#clicker-upgrade-section").style.display !== "none") {
            updateUpgradeSection();
        }

        for (let elem of document.querySelectorAll(".clicker-section")) {
            elem.style.display = document.getElementById(currClickerSection) === elem ? "block" : "none";
        }

        clickPower = 1;
        autoPerSec = 0;
        for (let i = 0; i < upgrades.length; i++) {
            clickPower += upgrades[i].clicks * gameState.ownedUpgrades[i];
            autoPerSec += upgrades[i].autoclicks * gameState.ownedUpgrades[i];
        }
        clickPower *= 2**gameState.prestigeCount;
        autoPerSec *= 2**gameState.prestigeCount;

        gameState.clickerCount += autoPerSec/60;

        pendingPrestige = gameState.clickerCount < 1e27 ? 0 : (Math.log10(gameState.clickerCount) - 26) ** 2;
    }, 16);
})
