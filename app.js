const STORAGE_KEY = "padel-thursday-state-v1";
const PENALTY_GAMES = 2;

const defaultState = {
  players: [
    { id: "geert", name: "Geert" },
    { id: "philip", name: "Philip" },
    { id: "ben", name: "Ben" },
    { id: "tom", name: "Tom" },
    { id: "wesley", name: "Wesley" },
    { id: "carl", name: "Carl" },
    { id: "stefan", name: "Stefan" },
    { id: "michel", name: "Michel" }
  ],
  rounds: [],
  roundType: "auto"
};

let state = loadState();
let activeSubContext = null;

const els = {
  nextDate: document.querySelector("#next-date"),
  leaderboard: document.querySelector("#leaderboard"),
  playersList: document.querySelector("#players-list"),
  savePlayers: document.querySelector("#save-players"),
  rounds: document.querySelector("#rounds"),
  generateRound: document.querySelector("#generate-round"),
  loadDemo: document.querySelector("#load-demo"),
  clearRounds: document.querySelector("#clear-rounds"),
  resetDemo: document.querySelector("#reset-demo"),
  exportData: document.querySelector("#export-data"),
  importData: document.querySelector("#import-data"),
  subDialog: document.querySelector("#sub-dialog"),
  subPlayer: document.querySelector("#sub-player"),
  subName: document.querySelector("#sub-name")
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.players) || parsed.players.length !== 8) {
      return structuredClone(defaultState);
    }
    return {
      players: parsed.players,
      rounds: Array.isArray(parsed.rounds) ? parsed.rounds : [],
      roundType: parsed.roundType || "auto"
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
}

function playerName(id) {
  return state.players.find((player) => player.id === id)?.name || "Unknown";
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateString}T12:00:00`));
}

function nextThursday() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const day = date.getDay();
  const offset = (4 - day + 7) % 7 || 7;
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function computeStats() {
  const stats = new Map(
    state.players.map((player) => [
      player.id,
      {
        id: player.id,
        name: player.name,
        games: 0,
        matches: 0,
        early: 0,
        late: 0,
        penalties: 0
      }
    ])
  );

  for (const round of state.rounds) {
    for (const match of round.matches) {
      const scoreA = Number(match.scoreA);
      const scoreB = Number(match.scoreB);
      const hasScore =
        match.scoreA !== "" &&
        match.scoreB !== "" &&
        Number.isFinite(scoreA) &&
        Number.isFinite(scoreB);

      for (const playerId of [...match.teamA, ...match.teamB]) {
        const row = stats.get(playerId);
        if (!row) continue;
        row.matches += hasScore ? 1 : 0;
        if (match.time === "19:00") row.early += 1;
        if (match.time === "20:30") row.late += 1;
      }

      if (!hasScore) continue;

      addTeamScore(stats, match.teamA, scoreA, match.substitutes || {});
      addTeamScore(stats, match.teamB, scoreB, match.substitutes || {});
    }
  }

  return [...stats.values()].sort((a, b) => {
    if (b.games !== a.games) return b.games - a.games;
    if (a.matches !== b.matches) return a.matches - b.matches;
    return a.name.localeCompare(b.name);
  });
}

function addTeamScore(stats, team, score, substitutes) {
  for (const playerId of team) {
    const row = stats.get(playerId);
    if (!row) continue;
    const penalty = substitutes[playerId] ? PENALTY_GAMES : 0;
    row.games += score - penalty;
    row.penalties += penalty;
  }
}

function roundKindForNext() {
  if (state.roundType !== "auto") return state.roundType;
  return state.rounds.length % 3 === 0 ? "full" : "split";
}

function generatePairings() {
  const ranked = computeStats();
  const order = ranked.map((row) => row.id);
  return [
    {
      teamA: [order[0], order[7]],
      teamB: [order[1], order[6]]
    },
    {
      teamA: [order[2], order[5]],
      teamB: [order[3], order[4]]
    }
  ];
}

function earlyLoad(match, statsById) {
  return [...match.teamA, ...match.teamB].reduce((sum, playerId) => {
    return sum + (statsById.get(playerId)?.early || 0);
  }, 0);
}

function generateRound() {
  const kind = roundKindForNext();
  state.rounds.unshift(createRound(nextThursday(), kind));
  saveState();
  render();
}

function createRound(date, kind) {
  const statsById = new Map(computeStats().map((row) => [row.id, row]));
  const pairings = generatePairings();
  let matches = pairings.map((pairing, index) => ({
    id: crypto.randomUUID(),
    time: "19:00",
    court: index + 1,
    teamA: pairing.teamA,
    teamB: pairing.teamB,
    scoreA: "",
    scoreB: "",
    substitutes: {}
  }));

  if (kind === "split") {
    const firstLoad = earlyLoad(matches[0], statsById);
    const secondLoad = earlyLoad(matches[1], statsById);
    const earlyIndex = firstLoad <= secondLoad ? 0 : 1;
    matches = matches.map((match, index) => ({
      ...match,
      time: index === earlyIndex ? "19:00" : "20:30"
    }));
  }

  return {
    id: crypto.randomUUID(),
    date,
    kind,
    matches
  };
}

function render() {
  els.nextDate.textContent = formatDate(nextThursday());
  renderRoundType();
  renderPlayers();
  renderLeaderboard();
  renderRounds();
}

function renderRoundType() {
  document.querySelectorAll("[data-round-type]").forEach((button) => {
    button.classList.toggle("active", button.dataset.roundType === state.roundType);
  });
}

function renderPlayers() {
  const template = document.querySelector("#player-row-template");
  els.playersList.replaceChildren();

  state.players.forEach((player, index) => {
    const row = template.content.firstElementChild.cloneNode(true);
    row.querySelector("span").textContent = index + 1;
    const input = row.querySelector("input");
    input.value = player.name;
    input.dataset.playerId = player.id;
    els.playersList.append(row);
  });
}

function renderLeaderboard() {
  els.leaderboard.replaceChildren();

  computeStats().forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="number">${index + 1}</td>
      <td>${escapeHtml(row.name)}</td>
      <td class="number">${row.games}</td>
      <td class="number">${row.matches}</td>
      <td class="number">${row.early}</td>
      <td class="number">${row.late}</td>
      <td class="number">${row.penalties}</td>
    `;
    els.leaderboard.append(tr);
  });
}

function renderRounds() {
  els.rounds.replaceChildren();

  if (!state.rounds.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No rounds yet. Generate the first Thursday to start.";
    els.rounds.append(empty);
    return;
  }

  for (const round of state.rounds) {
    const section = document.createElement("section");
    section.className = "round";

    const header = document.createElement("div");
    header.className = "round-header";
    header.innerHTML = `
      <div>
        <p class="eyebrow">${round.kind === "full" ? "All players at 19:00" : "Split week"}</p>
        <h3>${formatDate(round.date)}</h3>
      </div>
      <button class="small ghost danger" data-delete-round="${round.id}" type="button">Delete</button>
    `;
    section.append(header);

    const matches = document.createElement("div");
    matches.className = "matches";
    for (const match of round.matches) {
      matches.append(renderMatch(round, match));
    }
    section.append(matches);
    els.rounds.append(section);
  }
}

function renderMatch(round, match) {
  const template = document.querySelector("#match-template");
  const card = template.content.firstElementChild.cloneNode(true);
  card.dataset.roundId = round.id;
  card.dataset.matchId = match.id;
  card.querySelector(".match-time").textContent = `${match.time} - Court ${match.court}`;
  card.querySelector("h3").textContent = `Match ${match.court}`;

  const teamA = card.querySelector('[data-team="a"]');
  const teamB = card.querySelector('[data-team="b"]');
  teamA.querySelector("p").innerHTML = renderTeam(match.teamA, match.substitutes);
  teamB.querySelector("p").innerHTML = renderTeam(match.teamB, match.substitutes);

  const scoreA = teamA.querySelector("input");
  const scoreB = teamB.querySelector("input");
  scoreA.value = match.scoreA;
  scoreB.value = match.scoreB;
  scoreA.dataset.score = "scoreA";
  scoreB.dataset.score = "scoreB";

  const subs = Object.entries(match.substitutes || {});
  const subsContainer = card.querySelector(".subs");
  if (subs.length) {
    subsContainer.replaceChildren(
      ...subs.map(([playerId, subName]) => {
        const p = document.createElement("p");
        p.textContent = `${playerName(playerId)} replaced by ${subName || "substitute"}: -${PENALTY_GAMES} games`;
        return p;
      })
    );
  }

  return card;
}

function renderTeam(team, substitutes = {}) {
  return team
    .map((playerId) => {
      const name = escapeHtml(playerName(playerId));
      const sub = substitutes[playerId] ? ` <span title="Substitute">(${escapeHtml(substitutes[playerId])})</span>` : "";
      return `${name}${sub}`;
    })
    .join("<br>");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}

function findMatch(roundId, matchId) {
  const round = state.rounds.find((item) => item.id === roundId);
  const match = round?.matches.find((item) => item.id === matchId);
  return { round, match };
}

els.generateRound.addEventListener("click", generateRound);

els.loadDemo.addEventListener("click", () => {
  if (!confirm("Load six fake scored weeks? This replaces current rounds.")) return;
  loadDemoRounds();
  saveState();
  render();
});

document.querySelectorAll("[data-round-type]").forEach((button) => {
  button.addEventListener("click", () => {
    state.roundType = button.dataset.roundType;
    saveState();
    render();
  });
});

els.savePlayers.addEventListener("click", () => {
  document.querySelectorAll("#players-list input").forEach((input) => {
    const player = state.players.find((item) => item.id === input.dataset.playerId);
    if (player) player.name = input.value.trim() || player.name;
  });
  saveState();
  render();
});

els.rounds.addEventListener("input", (event) => {
  const input = event.target.closest("input[data-score]");
  if (!input) return;
  const card = event.target.closest(".match-card");
  const { match } = findMatch(card.dataset.roundId, card.dataset.matchId);
  if (!match) return;
  match[input.dataset.score] = input.value === "" ? "" : Number(input.value);
  saveState();
  renderLeaderboard();
});

els.rounds.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-round]");
  if (deleteButton) {
    state.rounds = state.rounds.filter((round) => round.id !== deleteButton.dataset.deleteRound);
    saveState();
    render();
    return;
  }

  const subButton = event.target.closest(".mark-sub");
  if (!subButton) return;

  const card = event.target.closest(".match-card");
  const { match } = findMatch(card.dataset.roundId, card.dataset.matchId);
  if (!match) return;

  activeSubContext = {
    roundId: card.dataset.roundId,
    matchId: card.dataset.matchId
  };

  els.subPlayer.replaceChildren(
    ...[...match.teamA, ...match.teamB].map((playerId) => {
      const option = document.createElement("option");
      option.value = playerId;
      option.textContent = playerName(playerId);
      return option;
    })
  );
  els.subName.value = "";
  els.subDialog.showModal();
});

els.subDialog.addEventListener("close", () => {
  if (!activeSubContext || els.subDialog.returnValue === "cancel") return;
  const { match } = findMatch(activeSubContext.roundId, activeSubContext.matchId);
  if (!match) return;

  if (!match.substitutes) match.substitutes = {};
  if (els.subDialog.returnValue === "remove") {
    delete match.substitutes[els.subPlayer.value];
  }
  if (els.subDialog.returnValue === "save") {
    match.substitutes[els.subPlayer.value] = els.subName.value.trim() || "Substitute";
  }

  activeSubContext = null;
  saveState();
  render();
});

els.clearRounds.addEventListener("click", () => {
  if (!confirm("Clear all rounds and scores?")) return;
  state.rounds = [];
  saveState();
  render();
});

els.resetDemo.addEventListener("click", () => {
  if (!confirm("Reset players and rounds?")) return;
  state = structuredClone(defaultState);
  saveState();
  render();
});

els.exportData.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `padel-thursday-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

els.importData.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.players) || imported.players.length !== 8) {
      throw new Error("Expected exactly 8 players.");
    }
    state = {
      players: imported.players,
      rounds: Array.isArray(imported.rounds) ? imported.rounds : [],
      roundType: imported.roundType || "auto"
    };
    saveState();
    render();
  } catch (error) {
    alert(`Could not import data: ${error.message}`);
  } finally {
    event.target.value = "";
  }
});

function loadDemoRounds() {
  const scorePairs = [
    [
      [18, 10],
      [15, 13]
    ],
    [
      [16, 12],
      [11, 17]
    ],
    [
      [14, 14],
      [18, 9]
    ],
    [
      [19, 8],
      [13, 15]
    ],
    [
      [12, 16],
      [17, 11]
    ],
    [
      [18, 10],
      [10, 18]
    ]
  ];

  state.rounds = [];
  [6, 5, 4, 3, 2, 1].forEach((weeksAgo, index) => {
    const kind = index % 3 === 0 ? "full" : "split";
    const round = createRound(thursdayWeeksAgo(weeksAgo), kind);
    round.matches.forEach((match, matchIndex) => {
      match.scoreA = scorePairs[index][matchIndex][0];
      match.scoreB = scorePairs[index][matchIndex][1];
    });
    if (index === 2) {
      round.matches[0].substitutes[round.matches[0].teamA[1]] = "Demo sub";
    }
    state.rounds.unshift(round);
  });
}

function thursdayWeeksAgo(weeksAgo) {
  const date = new Date(`${nextThursday()}T12:00:00`);
  date.setDate(date.getDate() - weeksAgo * 7);
  return date.toISOString().slice(0, 10);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

render();
