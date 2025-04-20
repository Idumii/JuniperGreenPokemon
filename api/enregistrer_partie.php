<?php
// activation des erreurs pour le dev
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// JSON + CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/.env.php';

try {
    $pdo = new PDO(
      "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8",
      DB_USER,
      DB_PASS
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'BDD Connexion : '.$e->getMessage()]);
    exit;
}

// lecture / décodage du JSON
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (
  !$data
  || !isset($data['joueur1'], $data['joueur2'], $data['partie'], $data['joueur_gagnant'])
) {
    http_response_code(400);
    echo json_encode(['error' => 'Payload JSON invalide ou manquant']);
    exit;
}

// récupère / crée un joueur
function getOrCreateJoueur(PDO $pdo, array $j) {
    $sql = "SELECT id FROM joueurs WHERE nom = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$j['nom']]);
    $id = $stmt->fetchColumn();

    if ($id) {
        // incrémente
        $upd = $pdo->prepare("
          UPDATE joueurs
          SET
            score_total = score_total + ?,
            victoires   = victoires   + ?,
            defaites    = defaites    + ?
          WHERE id = ?
        ");
        $upd->execute([
          $j['score_total'],
          $j['victoires'],
          $j['defaites'],
          $id
        ]);
    } else {
        // insert neuf
        $ins = $pdo->prepare("
          INSERT INTO joueurs (nom, score_total, victoires, defaites)
          VALUES (?, ?, ?, ?)
        ");
        $ins->execute([
          $j['nom'],
          $j['score_total'],
          $j['victoires'],
          $j['defaites']
        ]);
        $id = $pdo->lastInsertId();
    }

    return $id;
}

// --- préparation des données ---
$j1 = $data['joueur1'];
$j2 = $data['joueur2'];
$p  = $data['partie'];

// on récupère d'abord les listés de coups et d'erreurs
$c1 = $j1['coups']   ?? '';
$e1 = $j1['erreurs'] ?? '';
$c2 = $j2['coups']   ?? '';
$e2 = $j2['erreurs'] ?? '';

// création / mise à jour des deux joueurs
$id1 = getOrCreateJoueur($pdo, $j1);
$id2 = getOrCreateJoueur($pdo, $j2);

// détermine qui a gagné cette partie
$gagnant = ($j1['score_total'] > $j2['score_total']) ? $id1 : $id2;

// --- insertion dans parties ---
try {
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
      $gagnant,

      // stats de la manche
      $p['score_j1'],
      $p['score_j2'],
      $p['victoires_j1'],
      $p['victoires_j2'],
      $p['defaites_j1'],
      $p['defaites_j2'],

      // coups / erreurs
      $c1,
      $e1,
      $c2,
      $e2,

      // dernier coup gagnant
      $p['coup_gagnant']
    ]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Requête : '.$e->getMessage()]);
}
