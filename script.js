// Journalisation pour le débogage
console.log("Script JS chargé avec succès.");

// Variables globales
const gridSize = 10;
const gameGrid = document.getElementById("gameGrid");
const historyList = document.getElementById("historyList");

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

// Fonction pour vérifier si un nombre est premier
function isPrime(num) {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}

// Générer la grille de jeu
function generateGrid() {
    console.log("Génération de la grille...");
    let primeIndex = 0;

    for (let i = 1; i <= gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
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
        gameGrid.appendChild(cell);
    }

    console.log("Grille générée avec succès.");
}


// Gérer le clic sur une cellule
function handleCellClick(cell) {
    const number = cell.dataset.number;

    if (cell.classList.contains('used')) {
        console.warn(`Cellule ${number} déjà utilisée.`);
        return;
    }

    console.log(`Cellule cliquée : ${number}`);
    cell.classList.add('used');
    addHistory(`Cellule ${number} jouée.`);
}

// Ajouter une entrée dans l'historique
function addHistory(entry) {
    console.log(`Ajout à l'historique : ${entry}`);
    const li = document.createElement('li');
    li.textContent = entry;
    historyList.appendChild(li);
}

// Recommencer la partie
function restartGame() {
    console.log("Redémarrage du jeu...");
    gameGrid.innerHTML = '';
    historyList.innerHTML = '';
    generateGrid();
}

// Initialiser le jeu
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initialisation du jeu...");
    generateGrid();
});


function startGame() {
    window.location.href = 'game.html';
}

function indexRegles() {
    window.location.href = 'index.html';
}