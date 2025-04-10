fetch("https://bawi2179.odns.fr/JuniperGreenPokemon/api/enregistrer_partie.php", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    joueur1: {
      nom: "Vincent",
      score: 1025,
      victoires: 3,
      defaites: 1
    },
    joueur2: {
      nom: "Red",
      score: 850,
      victoires: 1,
      defaites: 3
    },
    partie: {
      score_j1: 1025,
      score_j2: 850,
      victoires_j1: 3,
      victoires_j2: 1,
      defaites_j1: 1,
      defaites_j2: 3,
      coups_j1: "2,4,8,16,32",
      coups_j2: "3,9,27,1",
      coup_gagnant: "32 (joueur 1)"
    }
  })
})
.then(res => res.json())
.then(data => console.log("Réponse API :", data))
.catch(err => console.error("Erreur API :", err));
