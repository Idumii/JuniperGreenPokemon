<?php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require_once __DIR__ . '/.env.php';

// Connexion à la BDD
try {
    $pdo = new PDO(
      "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8",
      DB_USER, DB_PASS,
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
      "error" => "Erreur de connexion : ".$e->getMessage()
    ]);
    exit;
}

// Lecture + décodage du JSON
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) {
    http_response_code(400);
    echo json_encode([
      "error" => "Données JSON manquantes ou invalides"
    ]);
    exit;
}

// Fonctions utiles
function getOrCreateJoueur(PDO $pdo, array $joueur): int {
    // cherche l’ID
    $stmt = $pdo->prepare("SELECT id FROM joueurs WHERE nom = ?");
    $stmt->execute([$joueur['nom']]);
    $id = $stmt->fetchColumn();

    if ($id) {
        // incrémente les totaux
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
        // nouveau joueur
        $ins = $pdo->prepare("
          INSERT INTO joueurs 
            (nom, score_total, victoires, defaites)
          VALUES (?,?,?,?)
        ");
        $ins->execute([
          $joueur['nom'],
          $joueur['score_total'],
          $joueur['victoires'],
          $joueur['defaites']
        ]);
        $id = $pdo->lastInsertId();
    }

    return (int)$id;
}

// --- Traitement principal ---
try {
    // 1) Récupération des données
    $j1     = $data['joueur1'];
    $j2     = $data['joueur2'];
    $partie = $data['partie'];

    // erreurs côté JS (si absentes, on met chaîne vide)
    $erreurs1 = $partie['erreurs_coups_j1'] ?? '';
    $erreurs2 = $partie['erreurs_coups_j2'] ?? '';

    // 2) Création ou mise à jour des joueurs
    $id1 = getOrCreateJoueur($pdo, $j1);
    $id2 = getOrCreateJoueur($pdo, $j2);

    // 3) Qui a gagné ?
    $gagnant_id = $j1['score_total'] > $j2['score_total'] ? $id1 : $id2;

    // 4) On insère la partie
    $sql = "
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
    ";
    $stmt = $pdo->prepare($sql);
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

    // 5) On répond OK
    echo json_encode([
      "success" => true,
      "message" => "Partie enregistrée avec succès."
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
      "error" => "Erreur : " . $e->getMessage()
    ]);
}
