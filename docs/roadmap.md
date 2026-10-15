# Feuille de route

Le projet avance par jalons. Chaque jalon produit quelque chose qui fonctionne et se démontre. Un jalon n'est terminé que si ses critères de sortie sont tous remplis.

Les jalons se découpent ensuite en issues GitHub, regroupées par jalon (« Milestones » dans GitHub).

## J0 - Conception (terminé)

Terminé le 2026-10-15.

Poser les bases avant le code.

- Documents : glossaire, règles, catalogue des règles, modèle du domaine, machines à états, exigences.
- ADR : usage des ADR, monorepo, choix de la stack, hébergement, outillage TypeScript.
- Stratégie de tests.

**Critères de sortie**

- L'ADR sur la stack est accepté.
- Les questions ouvertes des documents de conception qui bloquent J1 sont tranchées.

## J1 - Moteur de règles

Le cœur du jeu, sans interface ni réseau.

- Modèle du domaine dans `packages/rules`.
- Règles générales et types de règles connus du catalogue.
- Distribution des cartes avec une graine.
- Évaluation complète d'une épreuve : pose, refus d'une pose interdite, résolution.
- Format de données des horloges et 4 horloges du chapitre 1.
- CI : lint, formatage et tests à chaque pull request.

**Exigences couvertes** : F-JEU-06, F-JEU-13, F-REG-01, NF-QUA-01, NF-QUA-02, NF-QUA-04.

**Critères de sortie**

- Chaque type de règle a un test de réussite et un test d'échec.
- Une épreuve complète se joue dans un test, de la distribution à la résolution.

## J2 - Écran de jeu en local

Une épreuve jouable de bout en bout dans le navigateur, sans serveur. Tous les joueurs se partagent le même écran et jouent à tour de rôle. Ce mode sert au développement et aux tests : il n'est pas proposé aux joueurs, puisque le jeu ne se joue pas seul.

- Écran de jeu : horloge, mains, pose, yeux, résolution animée.
- Phases Discussion, Distribution, Pose et Résolution.
- Guidage du joueur quand une pose est refusée.
- Enchaînement des 4 horloges du chapitre 1, avec réussite, échec, yeux bonus et fin de run.

**Exigences couvertes** : F-JEU-02 à F-JEU-16, F-JEU-20, NF-ACC-01, NF-CMP-01.

**Critères de sortie**

- Les 4 horloges du chapitre 1 se jouent sans erreur.
- L'écran de jeu ne dépend que de l'état reçu, pas du moteur directement : il pourra être branché sur le serveur au J3 sans être réécrit.

## J3 - Multijoueur en ligne

Plusieurs joueurs sur des appareils différents.

- Serveur faisant autorité, avec le moteur de règles du J1.
- Protocole versionné dans `packages/protocol`.
- Profils, salles, codes de salle, statut « prêt ».
- Vue de la partie propre à chaque joueur.
- Reconnexion d'un joueur, pause quand le joueur actif est absent, vérification de présence.

**Exigences couvertes** : F-PRF-01, F-PRF-02, F-LOB-01 à F-LOB-09, F-JEU-05, F-JEU-17, F-JEU-18, NF-SEC-01, NF-SEC-02, NF-REL-01, NF-REL-02, NF-CMP-02, NF-OPS-03.

**Critères de sortie**

- Une partie à 4 joueurs se termine sur 4 navigateurs différents.
- Un test automatisé vérifie qu'aucun message reçu par un joueur ne contient la valeur d'une carte qu'il ne doit pas connaître.

## J4 - Progression et contenu

- Sauvegarde de la progression des groupes, choix du chapitre de départ.
- Annonce de fin de chapitre.
- Horloges en suspens.
- Tutoriel.
- Chapitres 2 à 10, avec des horloges originales.

**Exigences couvertes** : F-PRG-01, F-PRG-02, F-JEU-15, F-JEU-19, F-TUT-01, F-REG-02, F-REG-03, F-LOB-10, NF-REL-03.

## J5 - Vocal et vidéo

- Chat vocal et vidéo dans le navigateur, coupés pendant la Pose.
- Réglage du volume de chaque joueur.

**Exigences couvertes** : F-COM-02, F-COM-03, NF-RGPD-04.

## J6 - Application mobile

- Client mobile en Flutter. Le partage des règles et du protocole fera l'objet d'un ADR (voir l'ADR 0003).
- Gestion de la mise en arrière-plan et des reconnexions.

## Plus tard

Paramètres audio, icône personnalisée, chat écrit, anglais, animations réduites, suppression des salles inactives. Ces éléments sont intégrés aux jalons quand la base est stable.
