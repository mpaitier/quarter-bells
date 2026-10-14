# 0004 - Hébergement

- Statut : Proposé
- Date : 2026-10-15

## Contexte

L'hébergement doit être gratuit (exigence NF-OPS-02). Deux éléments sont à héberger :

- le client web, un site statique une fois compilé ;
- le serveur de jeu, un processus Node.js qui garde des connexions WebSocket ouvertes pendant toute une partie.

Le serveur tourne dans un conteneur Docker et lit sa configuration dans des variables d'environnement (exigence NF-OPS-01), pour pouvoir changer d'hébergeur sans modifier le code.

Situation des offres gratuites relevée en octobre 2026 :

- Koyeb ne propose plus de calcul gratuit aux nouveaux comptes depuis février 2026.
- Fly.io ne propose plus qu'un essai aux nouveaux comptes.
- Railway ne laisse qu'un crédit de 1 $ par mois après l'essai.
- Deno Deploy a annoncé sa fermeture.

## Options envisagées

### Client web : Cloudflare Pages

Hébergement de sites statiques, gratuit pour les fichiers statiques, avec CDN et HTTPS. GitHub Pages est une alternative équivalente pour ce besoin.

### Serveur, option A : Render, offre gratuite

Service web à partir d'une image Docker.

- Avantages : déploiement automatique depuis GitHub, HTTPS fourni, aucune administration système.
- Inconvénients : le service s'endort après 15 minutes sans requête HTTP ni message WebSocket entrant, et met environ une minute à se réveiller. L'état en mémoire est perdu à chaque arrêt. L'offre n'est pas prévue pour la production.

### Serveur, option B : Oracle Cloud Always Free

Une machine virtuelle ARM (2 OCPU et 12 Go de mémoire au maximum depuis août 2026), toujours allumée.

- Avantages : aucune mise en veille, ressources largement suffisantes, liberté totale.
- Inconvénients : système, Docker, reverse proxy et certificats HTTPS à gérer soi-même ; instances parfois indisponibles dans les régions demandées ; Oracle peut récupérer une instance gratuite dont l'utilisation reste très faible.

## Compatibilité avec Flutter et Dart

- Un client Flutter web compilé est un site statique : Cloudflare Pages l'héberge comme n'importe quel site.
- Un serveur Dart compilé en exécutable tourne dans une image Docker : Render et Oracle l'acceptent tous les deux.

Le choix d'hébergement ne bloque donc pas un éventuel passage à Dart.

## Décision

Proposition :

- client web sur Cloudflare Pages ;
- serveur sur Render (option A) pour démarrer ;
- bascule vers Oracle (option B) si la mise en veille devient gênante pendant les parties de test.

À confirmer au moment du premier déploiement (jalon J2 pour le client, J3 pour le serveur), en vérifiant les conditions des offres à cette date.

## Conséquences

- Le client affiche un écran d'attente pendant le réveil du serveur.
- L'état des parties en cours est sauvegardé régulièrement pour survivre à un arrêt du serveur (exigence NF-REL-03).
- Le serveur envoie des messages de maintien de connexion pendant les parties.
