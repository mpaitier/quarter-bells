# Navigation du client

Parcours de l'utilisateur entre les écrans, du lancement de l'app à l'entrée en partie.

```mermaid
flowchart TB
    %% Lancement et profil
    Launch([Lancement de l'app]) --> HasProfile{"Profil déjà créé ?"}
    HasProfile -- Non --> ProfileSetup["Création du profil : nom + icône"]
    ProfileSetup -- Valider --> Home
    HasProfile -- Oui --> HasOngoingGame{"Partie en cours pour ce joueur ?"}
    HasOngoingGame -- Non --> Home["Accueil Quarter Bells"]
    HasOngoingGame -- Oui --> ResumePrompt["Proposition : reprendre la partie"]
    ResumePrompt -- Reprendre --> Rejoin
    ResumePrompt -- Abandonner --> Home

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
    GameStarted -- Oui --> WasMember{"Joueur de cette partie ?"}
    WasMember -- Oui --> Rejoin["Reprise de la partie en cours"]
    WasMember -- Non --> StartedError["Message : partie en cours"] --> Home
    GameStarted -- Non --> RoomFull{"Salle complète ?"}
    RoomFull -- Oui --> FullError["Message : salle complète"] --> Home
    RoomFull -- Non --> Lobby

    %% Salle d'attente
    Lobby --> ShareCode["Copier ou partager le code de salle"] --> Lobby
    Lobby --> ToggleReady["Basculer prêt / pas prêt"]
    ToggleReady --> CanStart{"Au moins 2 joueurs et tous prêts ?"}
    CanStart -- Non --> Lobby
    CanStart -- Oui --> LoadProgress["Chargement de la progression du groupe"]
    LoadProgress --> GameScreen["Écran de jeu"]
    Rejoin --> GameScreen

    %% Départ de la salle
    Lobby -- Quitter --> IsLastPlayer{"Dernier joueur de la salle ?"}
    IsLastPlayer -- Oui --> CloseRoom["Fermeture de la salle"] --> Home
    IsLastPlayer -- Non --> IsHost{"Joueur hôte ?"}
    IsHost -- Non --> Home
    IsHost -- Oui --> TransferHost["Hôte transféré au joueur arrivé le plus tôt"] --> Home
```

## Notes

- La reprise est proposée automatiquement au lancement si le joueur a une partie en cours. La saisie du code reste possible pour un joueur qui a changé d'appareil.
- Le transfert d'hôte et la fermeture de salle sont des effets côté serveur. Ils figurent ici pour montrer ce que le joueur qui part ne voit pas : les autres joueurs restent dans la salle avec un nouvel hôte.
