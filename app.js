const ADMIN_CODE = "padel26/27";
const PENALTY_GAMES = 2;
const COMPETITION_START_DATE = "2026-10-01";
const LEAGUE_STATE_ID = "padel-donderdag";
const CONFIG = window.PADEL_APP_CONFIG || {};

const defaultState = {
  players: [
    { id: "philip", name: "Philip" },
    { id: "tom", name: "Tom" },
    { id: "ben", name: "Ben" },
    { id: "geert", name: "Geert" },
    { id: "wesley", name: "Wesley" },
    { id: "carl", name: "Carl" },
    { id: "stefan", name: "Stefan" },
    { id: "michel", name: "Michel" }
  ],
  rounds: [],
  roundType: "auto"
};

const DEFAULT_PLAYER_ORDER = defaultState.players.map((player) => player.id);

let state = structuredClone(defaultState);
let activeSubContext = null;
let isAdmin = false;
let isLoaded = false;

const els = {
  adminToggle: document.querySelector("#admin-toggle"),
  adminState: document.querySelector("#admin-state"),
  leaderName: document.querySelector("#leader-name"),
  nextRoundButton: document.querySelector("#next-round-button"),
  nextDate: document.querySelector("#next-date"),
  roundCount: document.querySelector("#round-count"),
  leaderboard: document.querySelector("#leaderboard"),
  leaderboardCards: document.querySelector("#leaderboard-cards"),
  playersList: document.querySelector("#players-list"),
  savePlayers: document.querySelector("#save-players"),
  rounds: document.querySelector("#rounds"),
  generateRound: document.querySelector("#generate-round"),
  loadDemo: document.querySelector("#load-demo"),
  clearRounds: document.querySelector("#clear-rounds"),
  resetDemo: document.querySelector("#reset-demo"),
  exportData: document.querySelector("#export-data"),
  exportLog: document.querySelector("#export-log"),
  importData: document.querySelector("#import-data"),
  subDialog: document.querySelector("#sub-dialog"),
  subPlayer: document.querySelector("#sub-player"),
  subName: document.querySelector("#sub-name"),
  nextRoundDialog: document.querySelector("#next-round-dialog"),
  nextRoundKind: document.querySelector("#next-round-kind"),
  nextRoundTitle: document.querySelector("#next-round-title"),
  nextRoundDetails: document.querySelector("#next-round-details")
};

async function loadState() {
  try {
    const loadedState = hasSupabaseConfig() ? await loadSupabaseState() : await loadStaticState();
    state = normalizeLoadedState(loadedState);
  } catch (error) {
    console.warn("Centrale data laden mislukt", error);
    state = structuredClone(defaultState);
  } finally {
    isLoaded = true;
  }
}

function normalizeLoadedState(loadedState) {
  if (!loadedState || !Array.isArray(loadedState.players) || loadedState.players.length !== 8) {
    return structuredClone(defaultState);
  }

  return {
    players: orderedPlayersOrCurrent(loadedState.players),
    rounds: Array.isArray(loadedState.rounds) ? loadedState.rounds : [],
    roundType: loadedState.roundType || "auto"
  };
}

function orderedPlayersOrCurrent(players) {
  const playersById = new Map(players.map((player) => [player.id, player]));
  const hasSamePlayers = DEFAULT_PLAYER_ORDER.every((id) => playersById.has(id));
  if (!hasSamePlayers) return players;
  return DEFAULT_PLAYER_ORDER.map((id) => playersById.get(id));
}

function hasAnyCompleteScoreInRounds(rounds) {
  return rounds.some((round) => round.matches.some(hasCompleteScore));
}

function hasSupabaseConfig() {
  return CONFIG.storageMode === "supabase" && Boolean(CONFIG.supabaseUrl) && Boolean(CONFIG.supabaseAnonKey);
}

async function loadStaticState() {
  const response = await fetch("data/league-state.json", { cache: "no-store" });
  if (!response.ok) return structuredClone(defaultState);
  return response.json();
}

async function loadSupabaseState() {
  const url = `${CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/league_state?id=eq.${encodeURIComponent(LEAGUE_STATE_ID)}&select=data`;
  const response = await fetch(url, {
    headers: supabaseHeaders()
  });
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`);
  const rows = await response.json();
  return rows[0]?.data || structuredClone(defaultState);
}

async function saveState() {
  if (!hasSupabaseConfig()) {
    alert("Centrale database is nog niet ingesteld. Stel Supabase in om wijzigingen voor iedereen te bewaren.");
    return false;
  }

  const url = `${CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/league_state?on_conflict=id`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...supabaseHeaders(),
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({
      id: LEAGUE_STATE_ID,
      data: state
    })
  });

  if (!response.ok) {
    alert("Bewaren in de centrale database is mislukt. Controleer Supabase policies/config.");
    return false;
  }

  return true;
}

function supabaseHeaders() {
  return {
    apikey: CONFIG.supabaseAnonKey,
    Authorization: `Bearer ${CONFIG.supabaseAnonKey}`,
    "Content-Type": "application/json"
  };
}

function playerName(id) {
  return state.players.find((player) => player.id === id)?.name || "Onbekend";
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("nl-BE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateString}T12:00:00`));
}

function addWeeks(dateString, weeks) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

function nextRoundDate() {
  if (!state.rounds.length) return COMPETITION_START_DATE;
  const latest = state.rounds.reduce((max, round) => (round.date > max ? round.date : max), state.rounds[0].date);
  return addWeeks(latest, 1);
}

function hasCompleteScore(match) {
  return match.scoreA !== "" && match.scoreB !== "";
}

function getNextRoundInfo() {
  const openRound = [...state.rounds]
    .sort((a, b) => a.date.localeCompare(b.date))
    .find((round) => round.matches.some((match) => !hasCompleteScore(match)));

  if (openRound) {
    return {
      round: openRound,
      status: "Gepland"
    };
  }

  return {
    round: createRound(nextRoundDate(), roundKindForNext()),
    status: "Preview"
  };
}

function computeStats() {
  const orderIndex = new Map(state.players.map((player, index) => [player.id, index]));
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
    if (orderIndex.get(a.id) !== orderIndex.get(b.id)) {
      return orderIndex.get(a.id) - orderIndex.get(b.id);
    }
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

async function generateRound() {
  if (!isAdmin) return;
  const kind = roundKindForNext();
  state.rounds.unshift(createRound(nextRoundDate(), kind));
  await saveState();
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
  if (!isLoaded) return;
  const stats = computeStats();
  document.body.classList.toggle("is-admin", isAdmin);
  const hasScores = stats.some((row) => row.matches > 0);
  const nextRoundInfo = getNextRoundInfo();
  els.adminToggle.textContent = isAdmin ? "Sluiten" : "Admin";
  els.adminState.textContent = isAdmin ? "Ontgrendeld" : "Vergrendeld";
  els.nextDate.textContent = formatDate(nextRoundInfo.round.date);
  els.nextRoundButton.title = "Bekijk details van de volgende ronde";
  els.roundCount.textContent = state.rounds.length;
  els.leaderName.textContent = hasScores && stats[0] ? stats[0].name : "Nog geen scores";
  renderRoundType();
  renderPlayers();
  renderLeaderboard(stats);
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
    input.disabled = !isAdmin;
    els.playersList.append(row);
  });
}

function renderLeaderboard(stats = computeStats()) {
  els.leaderboard.replaceChildren();
  els.leaderboardCards.replaceChildren();

  stats.forEach((row, index) => {
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

    const card = document.createElement("article");
    card.className = "leaderboard-card";
    card.innerHTML = `
      <div class="rank-badge">${index + 1}</div>
      <div class="leaderboard-card-main">
        <strong>${escapeHtml(row.name)}</strong>
        <span>${row.games} games</span>
      </div>
      <dl>
        <div><dt>Wedstr.</dt><dd>${row.matches}</dd></div>
        <div><dt>19:00</dt><dd>${row.early}</dd></div>
        <div><dt>20:30</dt><dd>${row.late}</dd></div>
        <div><dt>Straf</dt><dd>${row.penalties}</dd></div>
      </dl>
    `;
    els.leaderboardCards.append(card);
  });
}

function renderRounds() {
  els.rounds.replaceChildren();

  if (!state.rounds.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Nog geen rondes. Maak de eerste donderdag aan om te starten.";
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
        <p class="eyebrow">${round.kind === "full" ? "Iedereen om 19:00" : "Splitweek"}</p>
        <h3>${formatDate(round.date)}</h3>
      </div>
      <button class="small ghost danger admin-only" data-delete-round="${round.id}" type="button">Verwijderen</button>
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
  card.querySelector(".match-time").textContent = `${match.time} - Terrein ${match.court}`;
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
  scoreA.disabled = !isAdmin;
  scoreB.disabled = !isAdmin;

  const subs = Object.entries(match.substitutes || {});
  const subsContainer = card.querySelector(".subs");
  if (subs.length) {
    subsContainer.replaceChildren(
      ...subs.map(([playerId, subName]) => {
        const p = document.createElement("p");
        p.textContent = `${playerName(playerId)} vervangen door ${subName || "invaller"}: -${PENALTY_GAMES} games`;
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
      const sub = substitutes[playerId] ? ` <span title="Vervanger">(${escapeHtml(substitutes[playerId])})</span>` : "";
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

function showNextRoundDetails() {
  const { round, status } = getNextRoundInfo();
  els.nextRoundKind.textContent = `${status} - ${round.kind === "full" ? "Iedereen om 19:00" : "Splitweek"}`;
  els.nextRoundTitle.textContent = formatDate(round.date);
  els.nextRoundDetails.replaceChildren(
    ...round.matches.map((match) => {
      const article = document.createElement("article");
      article.className = "next-match-card";
      article.innerHTML = `
        <div>
          <p class="label">${match.time} - Terrein ${match.court}</p>
          <h3>Match ${match.court}</h3>
        </div>
        <div class="next-match-teams">
          <strong>${renderTeamPlain(match.teamA, match.substitutes)}</strong>
          <span>vs</span>
          <strong>${renderTeamPlain(match.teamB, match.substitutes)}</strong>
        </div>
      `;
      return article;
    })
  );
  els.nextRoundDialog.showModal();
}

function renderTeamPlain(team, substitutes = {}) {
  return team
    .map((playerId) => {
      const substitute = substitutes[playerId] ? ` (${substitutes[playerId]})` : "";
      return `${escapeHtml(playerName(playerId))}${escapeHtml(substitute)}`;
    })
    .join(" + ");
}

function downloadTextFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildScoreLog() {
  const playedRounds = [...state.rounds]
    .filter((round) => round.matches.every(hasCompleteScore))
    .sort((a, b) => a.date.localeCompare(b.date));

  const lines = [
    "# Scorelog Padel Donderdag",
    "",
    `Bijgewerkt: ${formatDate(new Date().toISOString().slice(0, 10))}`,
    "",
    `Gespeelde rondes: ${playedRounds.length}`,
    ""
  ];

  if (!playedRounds.length) {
    lines.push("Nog geen volledig gespeelde rondes.");
    return lines.join("\n");
  }

  playedRounds.forEach((round, roundIndex) => {
    lines.push(`## Ronde ${roundIndex + 1} - ${formatDate(round.date)}`);
    lines.push("");
    lines.push(`Type: ${round.kind === "full" ? "Iedereen om 19:00" : "Splitweek"}`);
    lines.push("");

    round.matches.forEach((match) => {
      lines.push(`- ${match.time}, terrein ${match.court}: ${renderTeamPlain(match.teamA, match.substitutes)} ${match.scoreA}-${match.scoreB} ${renderTeamPlain(match.teamB, match.substitutes)}`);
    });

    const substitutions = round.matches.flatMap((match) => {
      return Object.entries(match.substitutes || {}).map(([playerId, subName]) => {
        return `${playerName(playerId)} vervangen door ${subName}: -${PENALTY_GAMES} games`;
      });
    });

    if (substitutions.length) {
      lines.push("");
      substitutions.forEach((substitution) => lines.push(`  - ${substitution}`));
    }

    lines.push("");
  });

  lines.push("## Huidig Klassement");
  lines.push("");
  computeStats().forEach((row, index) => {
    lines.push(`${index + 1}. ${row.name}: ${row.games} games, ${row.matches} wedstrijden, ${row.penalties} strafgames`);
  });

  return lines.join("\n");
}

els.adminToggle.addEventListener("click", () => {
  if (isAdmin) {
    isAdmin = false;
    render();
    return;
  }

  const code = prompt("Admincode");
  if (code !== ADMIN_CODE) return;
  if (!hasSupabaseConfig()) {
    alert("Centrale database is nog niet ingesteld. Zet Supabase aan in config.js om als admin te wijzigen.");
    return;
  }
  isAdmin = true;
  render();
});

els.nextRoundButton.addEventListener("click", showNextRoundDetails);

els.generateRound.addEventListener("click", generateRound);

els.loadDemo.addEventListener("click", async () => {
  if (!isAdmin) return;
  if (!confirm("Zes fictieve rondes laden? Dit vervangt de huidige rondes.")) return;
  loadDemoRounds();
  await saveState();
  render();
});

document.querySelectorAll("[data-round-type]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!isAdmin) return;
    state.roundType = button.dataset.roundType;
    await saveState();
    render();
  });
});

els.savePlayers.addEventListener("click", async () => {
  if (!isAdmin) return;
  document.querySelectorAll("#players-list input").forEach((input) => {
    const player = state.players.find((item) => item.id === input.dataset.playerId);
    if (player) player.name = input.value.trim() || player.name;
  });
  await saveState();
  render();
});

els.rounds.addEventListener("change", async (event) => {
  if (!isAdmin) return;
  const input = event.target.closest("input[data-score]");
  if (!input) return;
  const card = event.target.closest(".match-card");
  const { match } = findMatch(card.dataset.roundId, card.dataset.matchId);
  if (!match) return;
  match[input.dataset.score] = input.value === "" ? "" : Number(input.value);
  await saveState();
  render();
});

els.rounds.addEventListener("click", async (event) => {
  if (!isAdmin) return;
  const deleteButton = event.target.closest("[data-delete-round]");
  if (deleteButton) {
    state.rounds = state.rounds.filter((round) => round.id !== deleteButton.dataset.deleteRound);
    await saveState();
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

els.subDialog.addEventListener("close", async () => {
  if (!isAdmin) return;
  if (!activeSubContext || els.subDialog.returnValue === "cancel") return;
  const { match } = findMatch(activeSubContext.roundId, activeSubContext.matchId);
  if (!match) return;

  if (!match.substitutes) match.substitutes = {};
  if (els.subDialog.returnValue === "remove") {
    delete match.substitutes[els.subPlayer.value];
  }
  if (els.subDialog.returnValue === "save") {
    match.substitutes[els.subPlayer.value] = els.subName.value.trim() || "Invaller";
  }

  activeSubContext = null;
  await saveState();
  render();
});

els.clearRounds.addEventListener("click", async () => {
  if (!isAdmin) return;
  if (!confirm("Alle rondes en scores wissen?")) return;
  state.rounds = [];
  await saveState();
  render();
});

els.resetDemo.addEventListener("click", async () => {
  if (!isAdmin) return;
  if (!confirm("Spelers en rondes resetten?")) return;
  state = structuredClone(defaultState);
  await saveState();
  render();
});

els.exportData.addEventListener("click", () => {
  if (!isAdmin) return;
  downloadTextFile(`padel-donderdag-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state, null, 2), "application/json");
});

els.exportLog.addEventListener("click", () => {
  if (!isAdmin) return;
  const latestPlayedRound = [...state.rounds]
    .filter((round) => round.matches.every(hasCompleteScore))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const date = latestPlayedRound?.date || new Date().toISOString().slice(0, 10);
  downloadTextFile(`scorelog-${date}.md`, buildScoreLog(), "text/markdown");
});

els.importData.addEventListener("change", async (event) => {
  if (!isAdmin) return;
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.players) || imported.players.length !== 8) {
      throw new Error("Er worden exact 8 spelers verwacht.");
    }
    state = {
      players: imported.players,
      rounds: Array.isArray(imported.rounds) ? imported.rounds : [],
      roundType: imported.roundType || "auto"
    };
    await saveState();
    render();
  } catch (error) {
    alert(`Importeren mislukt: ${error.message}`);
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
  [0, 1, 2, 3, 4, 5].forEach((weeksFromStart, index) => {
    const kind = index % 3 === 0 ? "full" : "split";
    const round = createRound(addWeeks(COMPETITION_START_DATE, weeksFromStart), kind);
    round.matches.forEach((match, matchIndex) => {
      match.scoreA = scorePairs[index][matchIndex][0];
      match.scoreB = scorePairs[index][matchIndex][1];
    });
    if (index === 2) {
      round.matches[0].substitutes[round.matches[0].teamA[1]] = "Demo-invaller";
    }
    state.rounds.unshift(round);
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

async function init() {
  await loadState();
  render();
}

init();
