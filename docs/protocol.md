# Protocole client-serveur

Brouillon des messages échangés entre les clients et le serveur. Ce document décrit le contenu des messages, indépendamment de la techno. Il sera formalisé plus tard (AsyncAPI ou schémas JSON) dans `packages/protocol`.

## Principes

- Le client envoie des **commandes** : il demande une action. Le serveur peut la refuser.
- Le serveur diffuse des **événements** : il annonce un fait accompli. Un client ne remet jamais en cause un événement.
- Un joueur ne reçoit que ce qu'il a le droit de savoir (exigence NF-SEC-01). Certains événements existent donc en deux versions : une pour l'auteur de l'action, une pour les autres.
- Les identifiants de cartes sont tirés au hasard à chaque distribution et ne disent rien de la valeur.
- Chaque commande porte un identifiant unique généré par le client. Le serveur ignore une commande dont il a déjà traité l'identifiant (exigence NF-REL-02).
- Chaque événement porte un numéro de séquence croissant par salle. À la reconnexion, le client indique le dernier numéro reçu.

## Enveloppe

Tous les messages partagent la même enveloppe.

```json
{
  "protocolVersion": 1,
  "type": "PlayCard",
  "id": "c0a8f2e4-...",
  "seq": 42,
  "payload": { }
}
```

| Champ | Commande | Événement | Rôle |
|-------|----------|-----------|------|
| `protocolVersion` | oui | oui | Refus explicite d'un client incompatible (NF-CMP-02). |
| `type` | oui | oui | Nom du message. |
| `id` | oui | non | Identifiant unique de la commande. |
| `seq` | non | oui | Numéro de séquence de l'événement. |
| `inReplyTo` | non | si réponse | Identifiant de la commande à l'origine de l'événement. |
| `payload` | oui | oui | Contenu propre au message. |

## Commandes

| Commande | Payload | Valide en | Réservée à |
|----------|---------|-----------|------------|
| `CreateLobby` | `profile` | hors salle | — |
| `JoinLobby` | `lobbyCode`, `profile` | hors salle | — |
| `Rejoin` | `sessionToken`, `lastSeq` | hors salle | — |
| `LeaveLobby` | — | salle | — |
| `ConfirmPresence` | — | vérification de présence | — |
| `SetReady` | `ready` | salle ouverte, Discussion, fin de chapitre | — |
| `SelectChapter` | `chapter` | choix du chapitre | hôte |
| `SetTurnOrder` | `positions` (joueur ou hasard pour chaque rang) | choix de l'ordre | hôte |
| `SetStartSection` | `sectionIndex` | Discussion, à partir du chapitre 3 | hôte |
| `PlayCard` | `cardId`, `sectionIndex`, `faceUp` | Pose, à son tour | — |
| `RetryClock` | — | après un échec | hôte |
| `SuspendClock` | — | annonce, après un échec | hôte |
| `ContinueSession` | — | après une réussite | hôte |
| `StopSession` | — | après une épreuve, pause | hôte |

## Événements

| Événement | Destinataires | Payload |
|-----------|---------------|---------|
| `CommandRejected` | auteur | `reason`, `violation` (règle concernée et ses paramètres, si une règle est en cause), `inReplyTo` |
| `LobbyUpdated` | tous | joueurs, hôte, statuts « prêt », état de la salle |
| `PlayerConnectionChanged` | tous | joueur, connecté ou non |
| `PresenceCheckStarted` | tous | échéance de confirmation |
| `PresenceCheckEnded` | tous | joueurs ayant confirmé |
| `SessionStarted` | tous | ordre de passage, progression, chapitre maximum autorisé |
| `TrialAnnounced` | tous | chapitre, horloge, règles, yeux disponibles, section de départ |
| `StartSectionChanged` | tous | section de départ |
| `PhaseChanged` | tous | nouvelle phase |
| `CardsDealt` | **privé** par joueur | sa main (identifiants, familles et valeurs), familles des cartes des autres, sa réserve en partie à 2 (identifiants et familles) |
| `TurnChanged` | tous | joueur actif |
| `CardPlayed` | **auteur** | joueur, carte (avec sa valeur), section, rang, face visible |
| `CardPlayed` | **les autres** | joueur, famille, section, rang, face visible ; valeur **seulement si face visible** |
| `ReserveTaken` | **privé** par joueur | valeurs des cartes de sa réserve |
| `GamePaused` | tous | joueur absent |
| `GameResumed` | tous | — |
| `TrialResolved` | tous | pour chaque section : cartes et valeurs, somme, respect de l'ordre ; puis réussite ou échec, conditions non remplies, yeux bonus |
| `ChapterCompleted` | tous | chapitre terminé, chapitre suivant |
| `RunLost` | tous | — |
| `StateSnapshot` | **privé** par joueur | vue complète de la partie pour ce joueur, envoyée à la reconnexion |

## Décisions

- **La révélation** est envoyée en un seul message, `TrialResolved`. Le client anime les sections une par une à son rythme. C'est l'option la moins coûteuse : le serveur n'a ni minuteur ni état intermédiaire à gérer, et un joueur qui se reconnecte en pleine animation reçoit simplement le résultat.
- **La carte posée face cachée** est envoyée en deux versions. Son auteur reçoit la valeur, ce qui lui permet de la revoir (exigence F-JEU-11), y compris après une reconnexion. Les autres ne reçoivent que la famille.
- **Les refus de pose** décrivent la règle violée de façon structurée. Le client décide seul de la façon de guider le joueur, selon ses paramètres.
