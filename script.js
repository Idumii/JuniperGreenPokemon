// Journalisation pour le débogage
console.log("Script JS chargé avec succès.");

// Variables globales
const gridSize = 10;
const grid = document.getElementById('gameGrid');
const historyList = document.getElementById('historyList');
const playerInfo = document.getElementById('playerInfo');

let currentPlayer = 1;
let playedNumbers = [];
let lastNumber = null; // Dernier nombre joué
let mustPlayGreaterThan50 = false; // Règle spéciale pour la case Magicarpe
let playerNames = ["Joueur 1", "Joueur 2"];
let playerScores = [0, 0];

// Tableau des images Pokémon
const pokemonImages = [
    'images/tortipousse.png',
    'images/ouisticram.png',
    'images/tiplouf.png',
    'images/etourmi.png',
    'images/luxio.png',
    'images/cranidos.png',
    'images/dinoclier.png',
    'images/blizzi.png',
    'images/griknot.png',
    'images/luxray.png',
    'images/etouraptor.png',
    'images/charkos.png',
    'images/torterra.png',
    'images/simiabraze.png',
    'images/pingoleon.png',
    'images/motisma.png',
    'images/bastiodon.png',
    'images/blizzaroi.png',
    'images/carchakrok.png',
    'images/elekable.png',
    'images/manaphy.png',
    'images/cresselia.png',
    'images/shaymin.png',
    'images/darkrai.png',
    'images/regigigas.png'
];

let primeIndex = 1; // Index pour associer les images aux nombres premiers après la case 1

// Vérifie si un nombre est premier
function isPrime(num) {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}

// Génère la grille de jeu
function generateGrid() {
    console.log("Génération de la grille...");
    let primeIndex = 0;

    for (let i = 1; i <= gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell', 'notPlayed');
        cell.dataset.number = i;

        // Ajout du numéro
        const numberLabel = document.createElement('span');
        numberLabel.textContent = i;
        numberLabel.style.position = "absolute";
        numberLabel.style.fontSize = "16px";
        numberLabel.style.bold;
        numberLabel.style.color = "black";
        cell.appendChild(numberLabel);

        if (i === 1) {
            // Case Magicarpe shiny
            cell.style.backgroundImage = `url('images/magicarpe_shiny.png')`;
            cell.style.backgroundSize = 'contain';
            cell.style.backgroundRepeat = 'no-repeat';
            cell.style.backgroundPosition = 'center';
        } else if (isPrime(i)) {
            // Nombres premiers
            cell.style.backgroundImage = `url('${pokemonImages[primeIndex % pokemonImages.length]}')`;
            cell.style.backgroundSize = 'contain';
            cell.style.backgroundRepeat = 'no-repeat';
            cell.style.backgroundPosition = 'center';
            primeIndex++;
        }

        cell.addEventListener('click', () => handleCellClick(cell));
        grid.appendChild(cell);
    }

    console.log("Grille générée avec succès.");
}

// Met à jour les informations sur les joueurs
function updatePlayerInfo() {
    playerInfo.innerHTML = `
    <div class="row">
        <div class="col-md-6">
            <label for="player1Name"></label>
            <input class="font-weight-bold text-center" id="player1Name" type="text" value="${playerNames[0]}" onchange="updatePlayerName(1, this.value)">
            <p class="font-weight-bold text-center">${playerScores[0]} victoires</p>
        </div>
        <div class="col-md-6">
            <label for="player2Name"></label>
            <input class="font-weight-bold text-center" id="player2Name" type="text" value="${playerNames[1]}" onchange="updatePlayerName(2, this.value)">
            <p class="font-weight-bold text-center"> ${playerScores[1]} victoires</p>
        </div>
    </div>


    `;
}

function updatePlayerName(playerIndex, newName) {
    playerNames[playerIndex - 1] = newName;
    updatePlayerInfo();
}

// Vérifie si un joueur peut jouer
function canPlayerPlay() {
    const cells = document.querySelectorAll('.grid-cell.notPlayed');
    for (const cell of cells) {
        const number = parseInt(cell.dataset.number);

        // Vérifie si le nombre est jouable selon les règles actuelles
        if (lastNumber === null || number % lastNumber === 0 || lastNumber % number === 0 || number === 1) {
            if (!mustPlayGreaterThan50 || number >= 50) {
                return true; // Le joueur peut jouer
            }
        }
    }
    return false; // Aucun coup possible
}

// Gestion des clics sur les cases
function handleCellClick(cell) {
    const number = parseInt(cell.dataset.number);

    // Vérifie si la case est déjà jouée (uniquement pour les nombres premiers)
    if (isPrime(number) && playedNumbers.includes(number)) {
        alert('Ce nombre a déjà été joué.');
        console.warn(`Le nombre ${number} a déjà été joué.`);
        return;
    }

    // Vérifie la règle spéciale pour Magicarpe
    if (mustPlayGreaterThan50 && number < 50) {
        alert('Vous devez jouer un nombre supérieur ou égal à 50 en réponse à la case Magicarpe.');
        console.warn(`Choix invalide : ${number} est inférieur à 50 alors que la règle l'exige.`);
        return;
    }

    // Vérifie si le choix est valide
    if (lastNumber !== null && number !== 1) {
        if (number % lastNumber !== 0 && lastNumber % number !== 0) {
            alert('Vous devez choisir un multiple ou un diviseur du dernier nombre joué.');
            console.warn(`Choix invalide : ${number} n'est ni un multiple ni un diviseur de ${lastNumber}.`);
            return;
        }
    }

    // Ajoute l'action à l'historique
    console.log(`Joueur ${currentPlayer} a joué le nombre ${number}`);
    addHistory(`${playerNames[currentPlayer - 1]} a joué : ${number}`);

    // Marque la case comme jouée
    console.log(`Marquage de la case ${number} comme jouée.`);
    cell.classList.remove('notPlayed');
    cell.classList.add('played');
    cell.style.pointerEvents = 'none'; // Désactive les clics sur cette case
    playedNumbers.push(number);
    lastNumber = number;

    // Active la règle spéciale pour Magicarpe
    if (number === 1) {
        console.log("Règle spéciale activée : l'adversaire doit jouer un nombre supérieur ou égal à 50.");
        mustPlayGreaterThan50 = true;
    } else {
        mustPlayGreaterThan50 = false;
    }

    // Réinitialise les cases normales si un Pokémon est joué (sauf Magicarpe)
    if (isPrime(number) && number !== 1) {
        console.log("Un Pokémon a été joué. Réinitialisation des cases normales...");
        resetNormalCells();
    }

    // Vérifie si le prochain joueur peut jouer
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    if (!canPlayerPlay()) {
        alert(`${playerNames[currentPlayer - 1]} ne peut plus jouer. ${playerNames[currentPlayer === 1 ? 1 : 0]} gagne la partie !`);
        playerScores[currentPlayer === 1 ? 1 : 0]++;
        updatePlayerInfo();
        restartGame();
        return;
    }

    console.log(`Changement de joueur : Joueur ${currentPlayer}`);
}

// Réinitialise les cases normales pour les rendre jouables
function resetNormalCells() {
    console.log("Réinitialisation des cases normales...");
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
        const number = parseInt(cell.dataset.number);
        if (!isPrime(number) && number !== 1) { // Assure que la case 1 ne redevient pas jouable
            console.log(`Réinitialisation de la case ${number} à l'état 'notPlayed'.`);
            cell.classList.remove('played');
            if (!cell.classList.contains('notPlayed')) {
                cell.classList.add('notPlayed');
            }
            cell.style.pointerEvents = 'auto'; // Rend la case jouable
            cell.style.opacity = '1'; // Rétablit une opacité normale
        }
    });
}

// Ajoute une entrée à l'historique
function addHistory(entry) {
    const li = document.createElement('li');
    li.textContent = entry;
    historyList.appendChild(li);
}

// Redémarre la partie
function restartGame() {
    console.clear();
    console.log("Redémarrage de la partie...");
    grid.innerHTML = '';
    historyList.innerHTML = '';
    playedNumbers = [];
    currentPlayer = 1;
    lastNumber = null;
    mustPlayGreaterThan50 = false;
    primeIndex = 1;
    generateGrid();
}

// Initialise le jeu
console.log("Initialisation du jeu...");
updatePlayerInfo();
generateGrid();


function startGame() {
    window.location.href = 'game.html';
}

function indexRegles() {
    window.location.href = 'index.html';
}