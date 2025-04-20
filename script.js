// Journalisation pour le débogage
console.log("Script JS chargé avec succès.");

// Variables globales
const gridSize = 10;
const grid = document.getElementById("gameGrid");

// Deux listes d’historique côté joueur 1 et joueur 2
const historyList1 = document.getElementById("historyList1");
const historyList2 = document.getElementById("historyList2");

// État de la partie
let currentPlayer = 1;
let playedNumbers = [];
let lastNumber = null;
let mustPlayGreaterThan50 = false;

// Stats et BO
let playerNames = ["Joueur 1", "Joueur 2"];
let playerScores = [0, 0];
let playerVictories = [0, 0];
let playerDefeats = [0, 0];
let boResults = [];
const boMaxRounds =
  localStorage.getItem("boMax") !== null
    ? parseInt(localStorage.getItem("boMax"))
    : null;

// Stockage des coups valides et des erreurs
let coupsJ1 = [];
let coupsJ2 = [];
let erreursJ1 = [];
let erreursJ2 = [];

// Modal de fin de BO (Bootstrap 5)
const endBoModalEl = document.getElementById("endBoModal");
const modalScore1 = document.getElementById("modalScore1");
const modalScore2 = document.getElementById("modalScore2");
const modalVic1 = document.getElementById("modalVic1");
const modalVic2 = document.getElementById("modalVic2");
const boCountSpan = document.getElementById("boCount");
const btnRestartSameBo = document.getElementById("btnRestartSameBo");
const btnBackToMenu = document.getElementById("btnBackToMenu");
const endBoModal = new bootstrap.Modal(endBoModalEl);

function indexRegles() {
  // Si tu utilises du BO, on veut nettoyer ce flag avant de repartir
  localStorage.removeItem("boMax");
  // et revenir sur la page des règles
  window.location.href = "index.html";
}

// Indicateur de tour
function updateTurnIndicator() {
  const el = document.getElementById("turnIndicator");
  el.textContent = `Tour de ${playerNames[currentPlayer - 1]}`;
}

// Met à jour l’affichage BO
const boStatus = document.getElementById("boStatus");
const boIcons = document.getElementById("boIcons");
if (boStatus && boIcons) {
  if (boMaxRounds) {
    boStatus.textContent = `BO${boMaxRounds}`;
    updateBoIcons();
  } else {
    boStatus.textContent = "";
    boIcons.innerHTML = "";
  }
}
function updateBoIcons() {
  boIcons.innerHTML = "";
  for (let i = 0; i < boMaxRounds; i++) {
    const icon = document.createElement("span");
    icon.classList.add("material-symbols-outlined");
    const res = boResults[i];
    if (res === 1) {
      icon.textContent = "radio_button_checked";
      icon.classList.add("green");
    } else if (res === 2) {
      icon.textContent = "radio_button_checked";
      icon.classList.add("red");
    } else {
      icon.textContent = "circle";
      icon.classList.add("gray");
    }
    boIcons.appendChild(icon);
  }
}

// Sync des noms
document
  .getElementById("name1")
  ?.addEventListener("input", (e) => (playerNames[0] = e.target.value));
document
  .getElementById("name2")
  ?.addEventListener("input", (e) => (playerNames[1] = e.target.value));

// Pokémon
const pokemonImages = [
  "images/tortipousse.png",
  "images/ouisticram.png",
  "images/tiplouf.png",
  "images/etourmi.png",
  "images/luxio.png",
  "images/cranidos.png",
  "images/dinoclier.png",
  "images/blizzi.png",
  "images/griknot.png",
  "images/luxray.png",
  "images/etouraptor.png",
  "images/charkos.png",
  "images/torterra.png",
  "images/simiabraze.png",
  "images/pingoleon.png",
  "images/motisma.png",
  "images/bastiodon.png",
  "images/blizzaroi.png",
  "images/carchakrok.png",
  "images/elekable.png",
  "images/manaphy.png",
  "images/cresselia.png",
  "images/shaymin.png",
  "images/darkrai.png",
  "images/regigigas.png",
];
function isPrime(n) {
  if (n <= 1) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

// Génère la grille
function generateGrid() {
  grid.innerHTML = "";
  let pIdx = 0;
  for (let i = 1; i <= gridSize * gridSize; i++) {
    const cell = document.createElement("div");
    cell.classList.add("grid-cell", "notPlayed");
    cell.dataset.number = i;
    const lbl = document.createElement("span");
    lbl.textContent = i;
    lbl.style.cssText = "position:absolute;font-size:16px;color:black";
    cell.appendChild(lbl);

    if (i === 1) {
      cell.style.backgroundImage = "url('images/magicarpe_shiny.png')";
    } else if (isPrime(i)) {
      cell.style.backgroundImage = `url('${
        pokemonImages[pIdx++ % pokemonImages.length]
      }')`;
    }
    cell.style.backgroundSize = "contain";
    cell.style.backgroundRepeat = "no-repeat";
    cell.style.backgroundPosition = "center";

    cell.addEventListener("click", () => handleCellClick(cell));
    grid.appendChild(cell);
  }
}

// MàJ scores & stats
function updatePlayerInfo() {
  document.getElementById("score1").textContent = playerScores[0];
  document.getElementById("score2").textContent = playerScores[1];
}
function updateVictoryDefeatDisplay() {
  document.getElementById("victory1").textContent = playerVictories[0];
  document.getElementById("defeat1").textContent = playerDefeats[0];
  document.getElementById("victory2").textContent = playerVictories[1];
  document.getElementById("defeat2").textContent = playerDefeats[1];
}

// Affiche l’historique des coups côte à côte
function renderHistory() {
  historyList1.innerHTML = "";
  historyList2.innerHTML = "";

  if (coupsJ1.length) {
    const li = document.createElement("li");
    li.textContent = coupsJ1.join(" – ");
    historyList1.appendChild(li);
  }
  if (coupsJ2.length) {
    const li = document.createElement("li");
    li.textContent = coupsJ2.join(" – ");
    historyList2.appendChild(li);
  }
}

// Vérifie s’il reste un coup valide
function canPlayerPlay() {
  return Array.from(document.querySelectorAll(".grid-cell.notPlayed")).some(
    (cell) => {
      const num = +cell.dataset.number;
      return (
        (lastNumber === null ||
          num % lastNumber === 0 ||
          lastNumber % num === 0 ||
          num === 1) &&
        (!mustPlayGreaterThan50 || num >= 50)
      );
    }
  );
}

// Traitement d’un clic sur case
function handleCellClick(cell) {
  const number = +cell.dataset.number;
  const erreurs = currentPlayer === 1 ? erreursJ1 : erreursJ2;
  const coups = currentPlayer === 1 ? coupsJ1 : coupsJ2;

  // --- validations & stock erreurs ---
  if (playedNumbers.length === 0 && currentPlayer === 1 && number % 2 !== 0) {
    erreurs.push(number);
    showGameAlert(
      "Le premier joueur doit commencer par un nombre pair !",
      "danger"
    );
    return;
  }
  if (isPrime(number) && playedNumbers.includes(number)) {
    erreurs.push(number);
    showGameAlert("Ce nombre a déjà été joué.", "danger");
    return;
  }
  if (mustPlayGreaterThan50 && number < 50) {
    erreurs.push(number);
    showGameAlert("Vous devez jouer un nombre ≥ 50 après Magicarpe.", "danger");
    return;
  }
  if (lastNumber !== null && number !== 1) {
    if (number % lastNumber !== 0 && lastNumber % number !== 0) {
      erreurs.push(number);
      showGameAlert(
        "Choisissez un multiple ou un diviseur du dernier nombre.",
        "danger"
      );
      return;
    }
  }

  // --- cas Magicarpe (1) ---
  if (number === 1) {
    const opp = currentPlayer === 1 ? 1 : 0;
    playerScores[opp] += 100;
    updatePlayerInfo();
    mustPlayGreaterThan50 = true;
  } else {
    mustPlayGreaterThan50 = false;
  }

  // --- appli score normal / triple prime ---
  playerScores[currentPlayer - 1] += isPrime(number) ? number * 3 : number;
  updatePlayerInfo();

  // --- marque la case ---
  cell.classList.replace("notPlayed", "played");
  cell.style.pointerEvents = "none";

  // --- update historique local ---
  coups.push(number);

  // --- enregistre le coup ---
  playedNumbers.push(number);
  lastNumber = number;

  // --- si nombre premier (≠1), reset des cases normales ---
  if (isPrime(number) && number !== 1) {
    resetNormalCells();
  }

  // --- mets à jour l’historique affiché ---
  renderHistory();

  // --- switch joueur ---
  currentPlayer = currentPlayer === 1 ? 2 : 1;

  // Met à jour l’indicateur de tour
  updateTurnIndicator();

  // --- fin de manche ? ---
  if (!canPlayerPlay()) {
    const winnerIdx = currentPlayer === 1 ? 1 : 0;
    const loserIdx = currentPlayer === 1 ? 0 : 1;

    showGameAlert(
      `${playerNames[currentPlayer - 1]} ne peut plus jouer. ` +
        `${playerNames[winnerIdx]} gagne la manche !`,
      "danger"
    );

    // stats locales
    playerVictories[winnerIdx]++;
    playerDefeats[loserIdx]++;
    boResults.push(winnerIdx + 1);

    // bonus de fin de manche
    if (isPrime(lastNumber)) playerScores[winnerIdx] += 1000;
    else playerScores[winnerIdx] += 500;
    updatePlayerInfo();
    updateVictoryDefeatDisplay();
    updateBoIcons();

    // envoi API
    sendResultToAPI(winnerIdx, lastNumber);

    // fin de BO ?
    const needed = Math.floor(boMaxRounds / 2) + 1;
    const wins = boResults.filter((r) => r === winnerIdx + 1).length;
    if (boMaxRounds && wins >= needed) {
      // on préremplit le modal
      boCountSpan.textContent = boMaxRounds;
      modalScore1.textContent = playerScores[0];
      modalScore2.textContent = playerScores[1];
      modalVic1.textContent = playerVictories[0];
      modalVic2.textContent = playerVictories[1];
      endBoModal.show();

      // bouton « jouer même BO »
      btnRestartSameBo.onclick = () => {
        endBoModal.hide();
        // reset historique & BO
        coupsJ1 = [];
        coupsJ2 = [];
        erreursJ1 = [];
        erreursJ2 = [];
        boResults = [];
        updateBoIcons();
        restartGame();
      };
      // bouton « retour menu »
      btnBackToMenu.onclick = () => {
        endBoModal.hide();
        localStorage.removeItem("boMax");
        window.location.href = "index.html";
      };
      return;
    }

    // sinon nouvelle manche
    restartGame();
  }
}

// Ne remet jouables que les cases jouées non‑premières
function resetNormalCells() {
  document.querySelectorAll(".grid-cell.played").forEach((cell) => {
    const num = +cell.dataset.number;
    if (!isPrime(num) && num !== 1) {
      cell.classList.remove("played");
      cell.classList.add("notPlayed");
      cell.style.pointerEvents = "auto";
      cell.style.opacity = "1";
    }
  });
}

// relance « à blanc » la grille
function restartGame() {
  // Si on n'est PAS en mode BO (infinite mode), on recharge la page
  if (!boMaxRounds) {
    window.location.reload();
    return;
  }

  // === mode BO : reset de la manche seulement ===
  // 1) vide les coups & erreurs de la manche courante
  coupsJ1 = [];
  coupsJ2 = [];
  erreursJ1 = [];
  erreursJ2 = [];

  // 2) reset des sélections de la grille
  playedNumbers = [];
  lastNumber = null;
  mustPlayGreaterThan50 = false;

  // 3) vide l'affichage historique
  historyList1.innerHTML = "";
  historyList2.innerHTML = "";

  // 4) régénère la grille
  grid.innerHTML = "";
  generateGrid();

  // 5) met à jour l'affichage du BO et du score
  renderHistory();
  updateBoIcons();
  updateTurnIndicator();
  updatePlayerInfo();
}

window.addEventListener("DOMContentLoaded", () => {
  updatePlayerInfo();
  updateVictoryDefeatDisplay();
  generateGrid();
  updateBoIcons();
  updateTurnIndicator();
});

// popup d’alerte de jeu
function showGameAlert(message, type = "danger") {
  const alertBox = document.getElementById("gameAlert");
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
  if (type !== "light") {
    setTimeout(() => alertBox.classList.add("d-none"), 4000);
  }
}

// Envoi des résultats vers ton API
function sendResultToAPI(winnerIndex, lastMove) {
  const payload = {
    joueur1: {
      nom: playerNames[0],
      score_total: playerScores[0],
      victoires: playerVictories[0],
      defaites: playerDefeats[0],
      coups: coupsJ1.join(","),
      erreurs: erreursJ1.join(","),
    },
    joueur2: {
      nom: playerNames[1],
      score_total: playerScores[1],
      victoires: playerVictories[1],
      defaites: playerDefeats[1],
      coups: coupsJ2.join(","),
      erreurs: erreursJ2.join(","),
    },
    partie: {
      score_j1: playerScores[0],
      score_j2: playerScores[1],
      victoires_j1: playerVictories[0],
      victoires_j2: playerVictories[1],
      defaites_j1: playerDefeats[0],
      defaites_j2: playerDefeats[1],
      coup_gagnant: lastMove,
    },
    joueur_gagnant: playerNames[winnerIndex],
  };

  fetch("api/enregistrer_partie.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(async (res) => {
      const text = await res.text(); // on récupère d’abord tout en tant que texte
      try {
        const json = JSON.parse(text); // on tente de parser
        console.log("Réponse API :", json);
      } catch (e) {
        console.warn("Réponse API non‑JSON reçue :", text);
      }
    })
    .catch((err) => console.error("Erreur d'envoi API :", err));
}
