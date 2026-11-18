# 0017 - Brancher l'écran sur une passerelle de jeu

- Statut : Accepté
- Date : 2026-11-17

## Contexte

Le J2 fait jouer le chapitre 1 dans le navigateur, sans serveur. Le J3 déplacera la partie sur un serveur qui fait autorité. Le critère de sortie du J2 demande que l'écran de jeu « ne dépende que de l'état reçu » ([feuille de route](../roadmap.md)) : le passage au J3 ne doit pas obliger à le réécrire (issue #34).

Deux contraintes pèsent sur la façon dont l'écran obtient l'état :

- **NF-SEC-01** : un joueur ne reçoit jamais la valeur d'une carte qu'il n'a pas le droit de connaître. Au J3, c'est le serveur qui filtre. Si l'écran du J2 lit l'état complet, il prendra l'habitude de s'en servir, et le jour où le serveur n'enverra plus ces valeurs, l'écran cassera, ou pire, on sera tenté de les envoyer.
- **L'asynchronisme** : un serveur répond plus tard, ou refuse. Un écran qui appelle le reducer et lit le résultat sur la ligne suivante ne survit pas au passage au réseau.

## Options envisagées

### L'écran appelle directement le moteur au J2

Le plus rapide : un `useReducer` sur `applyGameAction`, l'état complet dans React. Tout est à refaire au J3. Les composants auront lu `trial.seats` et les valeurs des cartes des autres, et chacun de ces accès devra être retrouvé et corrigé à la main.

### Un état global (store) partagé, rempli différemment selon le jalon

Un store (Zustand, Redux) que l'adaptateur remplit. Les composants ne lisent plus le moteur, mais le contrat entre le store et la partie reste implicite : rien n'empêche d'y ranger l'état complet au J2. Et c'est une dépendance de plus pour un besoin que React couvre déjà (`useSyncExternalStore`).

### Ports et adaptateurs

L'écran ne connaît qu'une interface, `GameGateway` : envoyer une commande, s'abonner aux événements, lire la dernière vue reçue. Ce qui circule est défini dans `packages/protocol` : les commandes, et la vue d'un joueur (`PlayerView`), produite par une fonction pure, `projectPlayerView(game, viewer)`.

- Au J2, l'adaptateur local fait tourner `applyGameAction` dans le navigateur et projette la vue de chaque joueur.
- Au J3, l'adaptateur WebSocket reçoit les vues du serveur, qui appelle la même projection.

Il faut écrire un paquet de plus et une couche d'indirection, mais l'écran ne voit jamais une valeur cachée, même au J2.

## Décision

Ports et adaptateurs. `packages/protocol` porte les commandes, la vue d'un joueur et sa projection. `apps/web` définit le port `GameGateway` et un adaptateur local, seul autorisé à importer `@quarter-bells/game`. Les composants passent par trois hooks : `usePlayerView`, `useSendCommand`, `useCommandRejected`.

## Conséquences

- **La projection est la seule barrière de NF-SEC-01.** Elle construit chaque objet champ par champ et ne recopie jamais une carte de l'état. Un test de propriétés vérifie, sur des parties générées, que changer toutes les valeurs cachées dans l'état complet ne change pas la vue. Il détecte aussi une fuite déguisée (un booléen « valeur > 6 », par exemple), ce que ne ferait pas une recherche des valeurs dans la vue.
- **Une passerelle représente un joueur**, comme une connexion. Le mode local, où tous les joueurs partagent l'écran, crée une passerelle par joueur ; choisir laquelle afficher est un sujet d'écran.
- **Une commande ne dit pas qui l'envoie.** Le joueur vient de la passerelle (au J3, de la connexion). `toGameAction` reconstruit l'action champ par champ : un `player` ajouté à la main dans une commande n'atteint jamais le moteur.
- **L'adaptateur local répond dans une microtâche**, jamais pendant `send`. Un écran qui supposerait une réponse immédiate échoue dès le J2.
- **Les commandes gardent les noms des actions du moteur** (`placeCard`, `retry`...). Les noms du [brouillon de protocole](../protocol.md) (`PlayCard`, `RetryClock`...), l'enveloppe, l'identifiant de commande et la version arrivent au J3, avec les schémas TypeBox qui valideront ce qui vient du réseau.
- **L'écran peut appeler les fonctions pures de `rules`** (`listPlacementOptions`, `availableCandles`) sur sa vue : `PlacedCard` est compatible avec `PublicPlacement` ([ADR 0016](0016-evaluer-une-pose-depuis-la-vue-d-un-joueur.md)). ESLint lui interdit en revanche les types et fonctions de l'état complet (`Trial`, `Seat`, `applyTrialAction`...) et tout import de `@quarter-bells/game` hors de `src/gateway/local/`.
- **La vue est recalculée en entier à chaque action**, pour chaque joueur. Sur 4 joueurs et 12 cartes, c'est négligeable. Au J3, le serveur pourra envoyer des événements plus fins sans changer le port : l'adaptateur WebSocket reconstruira la vue.
