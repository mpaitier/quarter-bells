# Navigation du client

Parcours de l'utilisateur entre les écrans, du lancement de l'app à l'entrée en partie.

```mermaid
flowchart TB
    %% Lancement et profil
    Launch([Lancement de l'app]) --> HasProfile{"Profil déjà créé ?"}
    HasProfile -- Non --> ProfileSetup["Création du profil : nom + icône"]
    ProfileSetup -- Valider --> Home
    HasProfile -- Oui --> Home["Accueil Quarter Bells"]

    %% Menu principal
    Home --> Host["Créer une partie"]
    Home --> Join["Rejoindre une partie"]
    Home --> Tutorial["Tutoriel"]
    Home --> Settings["Paramètres"]
    Tutorial -- Quitter --> Home
    Settings -- Retour --> Home

    %% Création
    Host --> Lobby["Salle d'attente"]

    %% Rejoindre
    Join --> EnterCode["Saisie du code de salle"]
    EnterCode --> CodeValid{"Code valide ?"}
    CodeValid -- Non --> CodeError["Message : salle introuvable"] --> EnterCode
    CodeValid -- Oui --> GameStarted{"Partie déjà commencée ?"}
    GameStarted -- Oui --> StartedError["Message : partie en cours"] --> Home
    GameStarted -- Non --> RoomFull{"Salle complète ?"}
    RoomFull -- Oui --> FullError["Message : salle complète"] --> Home
    RoomFull -- Non --> Lobby

    %% Salle d'attente
    Lobby --> ToggleReady["Basculer prêt / pas prêt"]
    ToggleReady --> CanStart{"Au moins 2 joueurs et tous prêts ?"}
    CanStart -- Non --> Lobby
    CanStart -- Oui --> LoadProgress["Chargement de la progression du groupe"]
    LoadProgress --> GameScreen["Écran de jeu"]
    Lobby -- Quitter --> Home
```

## À compléter

<<<<<<< Updated upstream
- Retour d'un joueur de la partie après une déconnexion.
- Départ de l'hôte de la salle d'attente.
- Partage du code de salle par l'hôte.
=======
- La reprise est proposée automatiquement au lancement si le joueur a une partie en cours. La saisie du code reste possible pour un joueur qui a changé d'appareil.
- Le transfert d'hôte et la fermeture de salle sont des effets côté serveur. Ils figurent ici pour montrer ce que le joueur qui part ne voit pas : les autres joueurs restent dans la salle avec un nouvel hôte.
>>>>>>> Stashed changes
