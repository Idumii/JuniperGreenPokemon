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
let boMaxRounds = localStorage.getItem("boMax") !== null ? parseInt(localStorage.getItem("boMax")) : null;

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
  boIcons.innerHTML = '';

  for (let i = 0; i < rounds; i++) {
    const icon = document.createElement('span');
    icon.classList.add('material-symbols-outlined');

    if (resultArray[i] === 1) {
      icon.textContent = 'radio_button_checked';
      icon.classList.add('green');
    } else if (resultArray[i] === 2) {
      icon.textContent = 'radio_button_checked';
      icon.classList.add('red');
    } else {
      icon.textContent = 'circle';
      icon.classList.add('gray');
    }

    boIcons.appendChild(icon);
  }
}

// Synchronise les champs noms avec les variables JS
const name1Input = document.getElementById("name1");
const name2Input = document.getElementById("name2");

if (name1Input && name2Input) {
  name1Input.addEventListener("input", (e) => {
    playerNames[0] = e.target.value;
  });

  name2Input.addEventListener("input", (e) => {
    playerNames[1] = e.target.value;
  });
}

// Pokémon
const pokemonImages = [
  "images/tortipousse.png", "images/ouisticram.png", "images/tiplouf.png", "images/etourmi.png",
  "images/luxio.png", "images/cranidos.png", "images/dinoclier.png", "images/blizzi.png",
  "images/griknot.png", "images/luxray.png", "images/etouraptor.png", "images/charkos.png",
  "images/torterra.png", "images/simiabraze.png", "images/pingoleon.png", "images/motisma.png",
  "images/bastiodon.png", "images/blizzaroi.png", "images/carchakrok.png", "images/elekable.png",
  "images/manaphy.png", "images/cresselia.png", "images/shaymin.png", "images/darkrai.png",
  "images/regigigas.png"
];
let primeIndex = 1;

function isPrime(num) {
  if (num <= 1) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function generateGrid() {
  let primeIndex = 0;
  for (let i = 1; i <= gridSize * gridSize; i++) {
    const cell = document.createElement("div");
    cell.classList.add("grid-cell", "notPlayed");
    cell.dataset.number = i;

    const numberLabel = document.createElement("span");
    numberLabel.textContent = i;
    numberLabel.style.position = "absolute";
    numberLabel.style.fontSize = "16px";
    numberLabel.style.color = "black";
    cell.appendChild(numberLabel);

    if (i === 1) {
      cell.style.backgroundImage = `url('images/magicarpe_shiny.png')`;
    } else if (isPrime(i)) {
      cell.style.backgroundImage = `url('${pokemonImages[primeIndex % pokemonImages.length]}')`;
      primeIndex++;
    }

    cell.style.backgroundSize = 'contain';
    cell.style.backgroundRepeat = 'no-repeat';
    cell.style.backgroundPosition = 'center';

    cell.addEventListener("click", () => handleCellClick(cell));
    grid.appendChild(cell);
  }
}

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

function canPlayerPlay() {
  const cells = document.querySelectorAll(".grid-cell.notPlayed");
  for (const cell of cells) {
    const number = parseInt(cell.dataset.number);
    if (lastNumber === null || number % lastNumber === 0 || lastNumber % number === 0 || number === 1) {
      if (!mustPlayGreaterThan50 || number >= 50) {
        return true;
      }
    }
  }
  return false;
}

function handleCellClick(cell) {
  const number = parseInt(cell.dataset.number);

  if (playedNumbers.length === 0 && currentPlayer === 1 && number % 2 !== 0) {
    showGameAlert("Le premier joueur doit commencer par un nombre pair !", "danger");    return;
  }

  if (isPrime(number) && playedNumbers.includes(number)) {
    showGameAlert("Ce nombre a déjà été joué.", "danger");    return;
  }

  if (mustPlayGreaterThan50 && number < 50) {
    showGameAlert("Vous devez jouer un nombre supérieur ou égal à 50 en réponse à la case Magicarpe.", "danger");    return;
  }

  if (lastNumber !== null && number !== 1) {
    if (number % lastNumber !== 0 && lastNumber % number !== 0) {
      showGameAlert("Vous devez choisir un multiple ou un diviseur du dernier nombre joué.", "danger");      return;
    }
  }

  if (number === 1) {
    // Donne 100 points à l'adversaire
    const opponent = currentPlayer === 1 ? 1 : 0;
    playerScores[opponent] += 100;
    updatePlayerInfo();
  
    console.log("Règle spéciale activée : l'adversaire doit jouer un nombre supérieur ou égal à 50.");
    mustPlayGreaterThan50 = true;
  } else {
    mustPlayGreaterThan50 = false;
  }
  

  addHistory(`${playerNames[currentPlayer - 1]} a joué : ${number}`);

  // Attribution du score standard ou triple si nombre premier
  if (isPrime(number)) {
    playerScores[currentPlayer - 1] += number * 3;
  } else {
    playerScores[currentPlayer - 1] += number;
  }

  cell.classList.remove("notPlayed");
  cell.classList.add("played");
  cell.style.pointerEvents = "none";
  playedNumbers.push(number);
  lastNumber = number;

  mustPlayGreaterThan50 = (number === 1);

  if (isPrime(number) && number !== 1) {
    resetNormalCells();
  }

  currentPlayer = currentPlayer === 1 ? 2 : 1;

  if (!canPlayerPlay()) {
    const winner = currentPlayer === 1 ? 1 : 0;
    const loser = currentPlayer === 1 ? 0 : 1;
    showGameAlert(`${playerNames[currentPlayer - 1]} ne peut plus jouer. ${playerNames[winner]} gagne la partie !`, "danger");
    playerVictories[winner]++;
    playerDefeats[loser]++;
    boResults.push(winner + 1);

    // Bonus score sur la dernière case jouée
    if (isPrime(lastNumber)) {
      playerScores[winner] += 1000;
    } else {
      playerScores[winner] += 500;
    }

    updatePlayerInfo();
    updateVictoryDefeatDisplay();
    updateBoIcons();

    updatePlayerInfo();
    updateVictoryDefeatDisplay();
    updateBoIcons();

    if (boMaxRounds && boResults.filter(r => r === winner + 1).length > Math.floor(boMaxRounds / 2)) {
      showGameAlert(`${playerNames[winner]} remporte le BO${boMaxRounds} ! Retour au menu.`, "danger");      localStorage.removeItem("boMax");
      window.location.href = "index.html";
      return;
    }

    restartGame();
  }
}

function resetNormalCells() {
  const cells = document.querySelectorAll(".grid-cell");
  cells.forEach(cell => {
    const number = parseInt(cell.dataset.number);
    if (!isPrime(number) && number !== 1) {
      cell.classList.remove("played");
      if (!cell.classList.contains("notPlayed")) {
        cell.classList.add("notPlayed");
      }
      cell.style.pointerEvents = "auto";
      cell.style.opacity = "1";
    }
  });
}

function addHistory(entry) {
  const li = document.createElement("li");
  li.textContent = entry;
  historyList.appendChild(li);
}

function restartGame() {
  grid.innerHTML = "";
  historyList.innerHTML = "";
  playedNumbers = [];
  currentPlayer = 1;
  lastNumber = null;
  mustPlayGreaterThan50 = false;
  primeIndex = 1;
  generateGrid();
  updateBoIcons();
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


function showGameAlert(message, type = 'danger') {
  const alertBox = document.getElementById('gameAlert');
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove('d-none');

  // Masque automatiquement après 4 secondes (sauf fin de partie)
  if (type !== 'light') {
    setTimeout(() => {
      alertBox.classList.add('d-none');
    }, 4000);
  }
}
