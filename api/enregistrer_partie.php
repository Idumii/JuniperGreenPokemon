<?php
// -----------------------------------------------------------------------------
// enregistrer_partie.php
// -----------------------------------------------------------------------------

// 1) Pas d’erreurs à l’écran
ini_set('display_errors',   '0');
ini_set('display_startup_errors', '0');
ini_set('log_errors',       '1');
error_reporting(E_ALL);

// 2) Buffer + headers JSON / CORS
ob_start();  // vide tout buffer éventuel (BOM, include, etc.)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// 3) Chargement des constantes de connexion
$envFile = __DIR__ . '/.env.php';
if (! is_readable($envFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Fichier .env.php introuvable']);
    exit;
}
require_once $envFile;

// 4) Connexion PDO
try {
    $pdo = new PDO(
        "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8",
        DB_USER,
        DB_PASS,
        [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion : '.$e->getMessage()]);
    exit;
}

// 5) Lecture + décodage JSON
$payload = file_get_contents('php://input');
$data    = json_decode($payload, true);

if (! is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Données JSON manquantes ou invalides']);
    exit;
}

// 6) Fonction getOrCreateJoueur (incrémente le cumul, ne réécrit pas)
function getOrCreateJoueur(PDO $pdo, array $joueur): int
{
    // vérifie si existe
    $stmt = $pdo->prepare("SELECT id FROM joueurs WHERE nom = ?");
    $stmt->execute([ $joueur['nom'] ]);
    $id = $stmt->fetchColumn();

    if ($id) {
        // on incrémente le score_total, victoires & défaites
        $upd = $pdo->prepare("
            UPDATE joueurs
            SET
              score_total = score_total + ?,
              victoires   = victoires   + ?,
              defaites    = defaites    + ?
            WHERE id = ?
        ");
        $upd->execute([
            $joueur['score_total'],
            $joueur['victoires'],
            $joueur['defaites'],
            $id
        ]);
    } else {
        // nouvel utilisateur
        $ins = $pdo->prepare("
            INSERT INTO joueurs (nom, score_total, victoires, defaites)
            VALUES (?, ?, ?, ?)
        ");
        $ins->execute([
            $joueur['nom'],
            $joueur['score_total'],
            $joueur['victoires'],
            $joueur['defaites']
        ]);
        $id = (int)$pdo->lastInsertId();
    }

    return (int)$id;
}

// 7) Traitement principal
try {
    $j1       = $data['joueur1'];
    $j2       = $data['joueur2'];
    $partie   = $data['partie'];
    $erreurs1 = $partie['erreurs_coups_j1'] ?? '';
    $erreurs2 = $partie['erreurs_coups_j2'] ?? '';

    $id1 = getOrCreateJoueur($pdo, $j1);
    $id2 = getOrCreateJoueur($pdo, $j2);

    // détermination du gagnant
    $gagnantId = ($j1['score_total'] > $j2['score_total']) ? $id1 : $id2;

    // insertion de la partie
    $stmt = $pdo->prepare("
        INSERT INTO parties (
          joueur1_id,   joueur2_id,   joueur_gagnant_id,
          score_j1,     score_j2,
          victoires_j1, victoires_j2,
          defaites_j1,  defaites_j2,
          coups_j1,     erreurs_coups_j1,
          coups_j2,     erreurs_coups_j2,
          coup_gagnant, date_partie
        ) VALUES (
          ?,?,?,?,?,?,?,?,?,?,?,?,?, NOW()
        )
    ");

    $stmt->execute([
        $id1,
        $id2,
        $gagnantId,
        $partie['score_j1'],
        $partie['score_j2'],
        $partie['victoires_j1'],
        $partie['victoires_j2'],
        $partie['defaites_j1'],
        $partie['defaites_j2'],
        $partie['coups_j1'],
        $erreurs1,
        $partie['coups_j2'],
        $erreurs2,
        $partie['coup_gagnant']
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Partie enregistrée avec succès.'
    ]);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur : '.$e->getMessage()]);
    exit;
}
