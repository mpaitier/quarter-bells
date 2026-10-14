# protocol

Définition des messages échangés entre le serveur et les clients : commandes envoyées par un joueur (poser une carte, se déclarer prêt) et événements diffusés par le serveur (carte posée, phase terminée).

Le protocole est versionné. Tout changement incompatible incrémente la version majeure et fait l'objet d'un ADR.

## Dépendances autorisées

- `packages/rules`, uniquement pour réutiliser les types du domaine (carte, quartier).
