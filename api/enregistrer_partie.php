<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require_once(__DIR__ . "/.env.php");

// Connexion BDD
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur de connexion : " . $e->getMessage()]);
    exit;
}

// Récupération et décodage JSON
$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Données JSON manquantes ou invalides"]);
    exit;
}

// --- Fonctions utiles ---
function getOrCreateJoueur(PDO $pdo, $joueur)
{
    // Vérifie si le joueur existe
    $stmt = $pdo->prepare("SELECT id FROM joueurs WHERE nom = ?");
    $stmt->execute([$joueur['nom']]);
    $id = $stmt->fetchColumn();

    if ($id) {
        // Mise à jour score, victoires, défaites
        $update = $pdo->prepare("UPDATE joueurs SET score_total = ?, victoires = ?, defaites = ? WHERE id = ?");
        $update->execute([$joueur['score_total'], $joueur['victoires'], $joueur['defaites'], $id]);
    } else {
        // Insertion joueur
        $insert = $pdo->prepare("INSERT INTO joueurs (nom, score_total, victoires, defaites) VALUES (?, ?, ?, ?)");
        $insert->execute([$joueur['nom'], $joueur['score_total'], $joueur['victoires'], $joueur['defaites']]);
        $id = $pdo->lastInsertId();
    }

    return $id;
}

// --- Traitement ---
try {
    $joueur1 = $data['joueur1'];
    $joueur2 = $data['joueur2'];
    $partie = $data['partie'];
    $erreurs1 = $partie['erreurs_coups_j1'] ?? '';
    $erreurs2 = $partie['erreurs_coups_j2'] ?? '';

    $id1 = getOrCreateJoueur($pdo, $joueur1);
    $id2 = getOrCreateJoueur($pdo, $joueur2);

    // Déduction du gagnant
    $gagnant_id = ($joueur1['score_total'] > $joueur2['score_total']) ? $id1 : $id2;

    // Insertion de la partie
    $stmt = $pdo->prepare("
    INSERT INTO parties (
      joueur1_id,
      joueur2_id,
      joueur_gagnant_id,
      score_j1,
      score_j2,
      victoires_j1,
      victoires_j2,
      defaites_j1,
      defaites_j2,
      coups_j1,
      erreurs_coups_j1,
      coups_j2,
      erreurs_coups_j2,
      coup_gagnant,
      date_partie
    ) VALUES (
      ?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW()
    )
    ");

    $stmt->execute([
        $id1,
        $id2,
        $gagnant_id,
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

    echo json_encode(["success" => true, "message" => "Partie enregistrée avec succès."]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur : " . $e->getMessage()]);
}
