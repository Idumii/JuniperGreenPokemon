<?php
header("Content-Type: application/json");
require_once(__DIR__ . "/.env.php");

try {
    $pdo = new PDO(
      "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8",
      DB_USER, DB_PASS,
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Récupère les joueurs triés par score_total décroissant
    $stmt = $pdo->query("
      SELECT nom, score_total, victoires, defaites
      FROM joueurs
      ORDER BY score_total DESC
      LIMIT 10
    ");
    $leader = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Récupère les dernières parties
    $stmt2 = $pdo->query("
      SELECT p.id, j1.nom AS j1, j2.nom AS j2, p.score_j1, p.score_j2, p.coup_gagnant, p.date_partie
      FROM parties p
      JOIN joueurs j1 ON p.joueur1_id = j1.id
      JOIN joueurs j2 ON p.joueur2_id = j2.id
      ORDER BY p.date_partie DESC
      LIMIT 5
    ");
    $history = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    $stmt3 = $pdo->query("
    SELECT coup_gagnant, COUNT(*) AS nb_victoires
    FROM parties
    GROUP BY coup_gagnant
    ORDER BY nb_victoires DESC
    LIMIT 5
  ");
  $topCoups = $stmt3->fetchAll(PDO::FETCH_ASSOC);

    

    echo json_encode([
      "leaderboard" => $leader,
      "history"     => $history,
      "coup_gagnants" => $topCoups
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
