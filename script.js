const walletAmount = document.getElementById("walletAmount");
const addFundsBtn = document.getElementById("addFundsBtn");
const matchesGrid = document.getElementById("matchesGrid");
const template = document.getElementById("matchCardTemplate");
const searchInput = document.getElementById("searchInput");

const selectedMatchInput = document.getElementById("selectedMatch");
const selectedPick = document.getElementById("selectedPick");
const betStakeInput = document.getElementById("betStake");
const placeBetBtn = document.getElementById("placeBetBtn");
const betStatus = document.getElementById("betStatus");

const aviatorStake = document.getElementById("aviatorStake");
const startAviatorBtn = document.getElementById("startAviatorBtn");
const cashOutBtn = document.getElementById("cashOutBtn");
const multiplierDisplay = document.getElementById("multiplierDisplay");
const aviatorStatus = document.getElementById("aviatorStatus");

let wallet = 1000;
let selectedMatch = null;
let aviatorInterval = null;
let currentMultiplier = 1;
let crashPoint = 0;
let aviatorRunning = false;
let activeStake = 0;

const teams = [
  "Lions", "Tigers", "Falcons", "United", "Rovers", "City", "Dragons", "Warriors", "Giants", "Kings",
  "Sharks", "Eagles", "Rangers", "Phoenix", "Wolves", "Storm", "Blazers", "Panthers", "Comets", "Spartans"
];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pickTeam(exclude = "") {
  let team = teams[Math.floor(Math.random() * teams.length)];

  while (team === exclude) {
    team = teams[Math.floor(Math.random() * teams.length)];
  }

  return team;
}

const matches = Array.from({ length: 50 }, (_, i) => {
  const home = pickTeam();
  const away = pickTeam(home);

  return {
    id: i + 1,
    league: i % 2 === 0 ? "Premier Demo" : "Champion Demo",
    home,
    away,
    odds: {
      home: Number(rand(1.35, 3.5).toFixed(2)),
      draw: Number(rand(2.2, 4.8).toFixed(2)),
      away: Number(rand(1.35, 3.5).toFixed(2))
    }
  };
});

function renderWallet() {
  walletAmount.textContent = wallet.toFixed(2);
}

function setStatus(el, text, type = "") {
  el.textContent = text;
  el.classList.remove("ok", "bad");

  if (type) {
    el.classList.add(type);
  }
}

function renderMatches(filter = "") {
  matchesGrid.innerHTML = "";
  const q = filter.trim().toLowerCase();
  const filtered = q
    ? matches.filter((m) => `${m.home} ${m.away}`.toLowerCase().includes(q))
    : matches;

  filtered.forEach((match) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector(".teams").textContent = `${match.home} vs ${match.away}`;
    node.querySelector(".meta").textContent = `${match.league} • Match #${match.id}`;

    node.querySelectorAll(".odds-row button").forEach((btn) => {
      const pick = btn.dataset.pick;
      btn.textContent = `${pick.toUpperCase()} ${match.odds[pick]}`;
    });

    node.querySelector(".select-btn").addEventListener("click", () => {
      selectedMatch = match;
      selectedMatchInput.value = `${match.home} vs ${match.away}`;
      setStatus(betStatus, "Match selected. Choose pick and place bet.");
    });

    matchesGrid.appendChild(node);
  });
}

function canAfford(amount) {
  return amount > 0 && wallet >= amount;
}

function placeBet() {
  if (!selectedMatch) {
    setStatus(betStatus, "Pick a match first.", "bad");
    return;
  }

  const stake = Number(betStakeInput.value);

  if (!canAfford(stake)) {
    setStatus(betStatus, "Insufficient balance for this stake.", "bad");
    return;
  }

  wallet -= stake;
  const pick = selectedPick.value;
  const outcomeRoll = Math.random();
  let winner = "draw";

  if (outcomeRoll < 0.44) {
    winner = "home";
  } else if (outcomeRoll > 0.72) {
    winner = "away";
  }

  if (winner === pick) {
    const won = stake * selectedMatch.odds[pick];
    wallet += won;
    setStatus(betStatus, `You won ${won.toFixed(2)} on ${pick.toUpperCase()}!`, "ok");
  } else {
    setStatus(betStatus, `Lost. Result was ${winner.toUpperCase()}.`, "bad");
  }

  renderWallet();
}

function endAviator(roundWon, message) {
  clearInterval(aviatorInterval);
  aviatorInterval = null;
  aviatorRunning = false;
  cashOutBtn.disabled = true;
  startAviatorBtn.disabled = false;
  setStatus(aviatorStatus, message, roundWon ? "ok" : "bad");
}

function startAviator() {
  const stake = Number(aviatorStake.value);

  if (aviatorRunning) {
    return;
  }

  if (!canAfford(stake)) {
    setStatus(aviatorStatus, "Not enough balance for aviator stake.", "bad");
    return;
  }

  wallet -= stake;
  renderWallet();

  activeStake = stake;
  aviatorRunning = true;
  currentMultiplier = 1;
  crashPoint = rand(1.2, 9.5);

  multiplierDisplay.textContent = `${currentMultiplier.toFixed(2)}x`;
  setStatus(aviatorStatus, "Flight started. Cash out before crash!");
  startAviatorBtn.disabled = true;
  cashOutBtn.disabled = false;

  aviatorInterval = setInterval(() => {
    currentMultiplier += rand(0.05, 0.17);
    multiplierDisplay.textContent = `${currentMultiplier.toFixed(2)}x`;

    if (currentMultiplier >= crashPoint) {
      endAviator(false, `Crashed at ${crashPoint.toFixed(2)}x. You lost ${activeStake.toFixed(2)}.`);
    }
  }, 160);
}

function cashOut() {
  if (!aviatorRunning) {
    return;
  }

  const payout = activeStake * currentMultiplier;
  wallet += payout;
  renderWallet();
  endAviator(true, `Cashed out at ${currentMultiplier.toFixed(2)}x and won ${payout.toFixed(2)}.`);
}

addFundsBtn.addEventListener("click", () => {
  wallet += 100;
  renderWallet();
  setStatus(betStatus, "Added 100 demo credits.", "ok");
});

placeBetBtn.addEventListener("click", placeBet);
searchInput.addEventListener("input", (e) => renderMatches(e.target.value));
startAviatorBtn.addEventListener("click", startAviator);
cashOutBtn.addEventListener("click", cashOut);

renderWallet();
renderMatches();
