// Journalisation pour le débogage
console.log("Script JS chargé avec succès.");

// Variables globales
const gridSize = 10;
const grid = document.getElementById("gameGrid");
const historyList = document.getElementById("historyList");

let currentPlayer = 1;
let playedNumbers = [];
let lastNumber = null;
let mustPlayGreaterThan50 = false;
let playerNames = ["Joueur 1", "Joueur 2"];
let playerScores = [0, 0];
let playerVictories = [0, 0];
let playerDefeats = [0, 0];
let boResults = [];
let boMaxRounds =
  localStorage.getItem("boMax") !== null
    ? parseInt(localStorage.getItem("boMax"))
    : null;

// Nouveaux tableaux pour stocker les coups et erreurs
let coupsJ1 = [];
let coupsJ2 = [];
let erreursJ1 = [];
let erreursJ2 = [];
const historyList1 = document.getElementById("historyList1");
const historyList2 = document.getElementById("historyList2");

// en haut de ton fichier, récupère les éléments
const endBoModalEl = document.getElementById("endBoModal");
const modalScore1 = document.getElementById("modalScore1");
const modalScore2 = document.getElementById("modalScore2");
const modalVic1 = document.getElementById("modalVic1");
const modalVic2 = document.getElementById("modalVic2");
const boCountSpan = document.getElementById("boCount");
const btnRestartSameBo = document.getElementById("btnRestartSameBo");
const btnBackToMenu = document.getElementById("btnBackToMenu");

// instance du modal (Bootstrap 5)
const endBoModal = new bootstrap.Modal(endBoModalEl);

// Met à jour le texte BO
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

// Icônes Material Symbols pour les pastilles BO
function updateBoIcons(rounds = boMaxRounds || 0, resultArray = boResults) {
  if (!boIcons || !boMaxRounds) return;
  boIcons.innerHTML = "";

  for (let i = 0; i < rounds; i++) {
    const icon = document.createElement("span");
    icon.classList.add("material-symbols-outlined");
    if (resultArray[i] === 1) {
      icon.textContent = "radio_button_checked";
      icon.classList.add("green");
    } else if (resultArray[i] === 2) {
      icon.textContent = "radio_button_checked";
      icon.classList.add("red");
    } else {
      icon.textContent = "circle";
      icon.classList.add("gray");
    }
    boIcons.appendChild(icon);
  }
}

// Synchronise les champs noms avec les variables JS
const name1Input = document.getElementById("name1");
const name2Input = document.getElementById("name2");
if (name1Input && name2Input) {
  name1Input.addEventListener(
    "input",
    (e) => (playerNames[0] = e.target.value)
  );
  name2Input.addEventListener(
    "input",
    (e) => (playerNames[1] = e.target.value)
  );
}

// Tableau des images Pokémon
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
let primeIndex = 1;
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
        pokemonImages[pIdx % pokemonImages.length]
      }')`;
      pIdx++;
    }
    cell.style.backgroundSize = "contain";
    cell.style.backgroundRepeat = "no-repeat";
    cell.style.backgroundPosition = "center";

    cell.addEventListener("click", () => handleCellClick(cell));
    grid.appendChild(cell);
  }
}

// Màj UI scores & stats
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

function renderHistory() {
  // vide les deux listes
  historyList1.innerHTML = "";
  historyList2.innerHTML = "";

  // si le joueur 1 a joué au moins un coup
  if (coupsJ1.length > 0) {
    const li = document.createElement("li");
    li.textContent = coupsJ1.join(" – ");
    historyList1.appendChild(li);
  }

  // même chose pour le joueur 2
  if (coupsJ2.length > 0) {
    const li = document.createElement("li");
    li.textContent = coupsJ2.join(" – ");
    historyList2.appendChild(li);
  }
}

// Vérifie si un coup est possible
function canPlayerPlay() {
  for (const cell of document.querySelectorAll(".grid-cell.notPlayed")) {
    const num = +cell.dataset.number;
    if (
      (lastNumber === null ||
        num % lastNumber === 0 ||
        lastNumber % num === 0 ||
        num === 1) &&
      (!mustPlayGreaterThan50 || num >= 50)
    )
      return true;
  }
  return false;
}

// Gère les clics sur case
function handleCellClick(cell) {
  const number = +cell.dataset.number;

  // Validation & collecte d'erreurs
  if (playedNumbers.length === 0 && currentPlayer === 1 && number % 2 !== 0) {
    erreursJ1.push(number);
    showGameAlert(
      "Le premier joueur doit commencer par un nombre pair !",
      "danger"
    );
    return;
  }
  if (isPrime(number) && playedNumbers.includes(number)) {
    (currentPlayer === 1 ? erreursJ1 : erreursJ2).push(number);
    showGameAlert("Ce nombre a déjà été joué.", "danger");
    return;
  }
  if (mustPlayGreaterThan50 && number < 50) {
    (currentPlayer === 1 ? erreursJ1 : erreursJ2).push(number);
    showGameAlert("Vous devez jouer un nombre ≥ 50 après Magicarpe.", "danger");
    return;
  }
  if (lastNumber !== null && number !== 1) {
    if (number % lastNumber !== 0 && lastNumber % number !== 0) {
      (currentPlayer === 1 ? erreursJ1 : erreursJ2).push(number);
      showGameAlert(
        "Choisissez un multiple ou un diviseur du dernier nombre.",
        "danger"
      );
      return;
    }
  }

  // Si case 1 → règle spéciale & bonus 100 pts à l'adversaire
  if (number === 1) {
    const opp = currentPlayer === 1 ? 1 : 0;
    playerScores[opp] += 100;
    updatePlayerInfo();
    mustPlayGreaterThan50 = true;
  } else {
    mustPlayGreaterThan50 = false;
  }

  renderHistory();
  // Score standard ou triple si premier
  playerScores[currentPlayer - 1] += isPrime(number) ? number * 3 : number;

  // Marquage de la case
  cell.classList.replace("notPlayed", "played");
  cell.style.pointerEvents = "none";

  playedNumbers.push(number);
  lastNumber = number;

  // Reset si un nombre premier (≠ 1)
  if (isPrime(number) && number !== 1) resetNormalCells();

  // Stockage du coup valide
  if (currentPlayer === 1) coupsJ1.push(number);
  else coupsJ2.push(number);

  // Passe au joueur suivant
  currentPlayer = currentPlayer === 1 ? 2 : 1;

  // Fin de manche ?
  if (!canPlayerPlay()) {
    const winnerIdx = currentPlayer === 1 ? 1 : 0;
    const loserIdx = currentPlayer === 1 ? 0 : 1;

    showGameAlert(
      `${playerNames[currentPlayer - 1]} ne peut plus jouer. ` +
        `${playerNames[winnerIdx]} gagne la manche !`,
      "danger"
    );

    // Maj stats
    playerVictories[winnerIdx]++;
    playerDefeats[loserIdx]++;
    boResults.push(winnerIdx + 1);

    // Bonus de fin de manche
    if (isPrime(lastNumber)) playerScores[winnerIdx] += 1000;
    else playerScores[winnerIdx] += 500;

    updatePlayerInfo();
    updateVictoryDefeatDisplay();
    updateBoIcons();

    // Envoi à l'API
    sendResultToAPI(winnerIdx, lastNumber);

    // Fin de BO : affichage du modal récapitulatif
    const needed = Math.floor(boMaxRounds / 2) + 1;
    const wins = boResults.filter((r) => r === winnerIdx + 1).length;

    if (boMaxRounds && wins >= needed) {
      // on remplit le modal avec les scores & victoires
      boCountSpan.textContent = boMaxRounds;
      modalScore1.textContent = playerScores[0];
      modalScore2.textContent = playerScores[1];
      modalVic1.textContent = playerVictories[0];
      modalVic2.textContent = playerVictories[1];

      // on affiche le modal
      endBoModal.show();

      // bouton : rejouer même BO
      btnRestartSameBo.onclick = () => {
        endBoModal.hide();
      
        // vide l'historique des coups
        coupsJ1 = [];
        coupsJ2 = [];
        historyList1.innerHTML = "";
        historyList2.innerHTML = "";
      
        // vide le tableau des résultats BO
        boResults = [];
        updateBoIcons();
      
        // relance la grille
        restartGame();
      };

      // bouton : retour au menu
      btnBackToMenu.onclick = () => {
        endBoModal.hide();
        localStorage.removeItem("boMax");
        window.location.href = "index.html";
      };

      return;
    }

    // Sinon relance
    restartGame();
  }
}

function resetNormalCells() {
  document.querySelectorAll(".grid-cell").forEach((cell) => {
    const num = +cell.dataset.number;
    if (!isPrime(num) && num !== 1) {
      cell.classList.replace("played", "notPlayed");
      cell.style.pointerEvents = "auto";
      cell.style.opacity = "1";
    }
  });
}

function restartGame() {
  // recharge entièrement la page (en conservant boMax dans localStorage)
  window.location.reload();
}

window.addEventListener("DOMContentLoaded", () => {
  updatePlayerInfo();
  updateVictoryDefeatDisplay();
  generateGrid();
  updateBoIcons();
});

function indexRegles() {
  window.location.href = "index.html";
}

function showGameAlert(message, type = "danger") {
  const alertBox = document.getElementById("gameAlert");
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
  if (type !== "light") {
    setTimeout(() => alertBox.classList.add("d-none"), 4000);
  }
}

function sendResultToAPI(winnerIndex, lastMove) {
  const data = {
    joueur1: {
      nom: playerNames[0],
      score_total: playerScores[0],
      victoires: playerVictories[0],
      defaites: playerDefeats[0],
    },
    joueur2: {
      nom: playerNames[1],
      score_total: playerScores[1],
      victoires: playerVictories[1],
      defaites: playerDefeats[1],
    },
    partie: {
      score_j1: playerScores[0],
      score_j2: playerScores[1],
      victoires_j1: playerVictories[0],
      victoires_j2: playerVictories[1],
      defaites_j1: playerDefeats[0],
      defaites_j2: playerDefeats[1],
      coups_j1: coupsJ1.join(","),
      erreurs_coups_j1: erreursJ1.join(","),
      coups_j2: coupsJ2.join(","),
      erreurs_coups_j2: erreursJ2.join(","),
      coup_gagnant: lastMove,
    },
    joueur_gagnant: playerNames[winnerIndex],
  };

  fetch(
    "https://bawi2179.odns.fr/JuniperGreenPokemon/api/enregistrer_partie.php",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  )
    .then((res) => res.json())
    .then((json) => console.log("Réponse API :", json))
    .catch((err) => console.error("Erreur d'envoi API :", err));
}
