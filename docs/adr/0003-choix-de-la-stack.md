# 0003 - Choix de la stack

- Statut : Accepté
- Date : 2026-10-15

## Contexte

Le projet doit produire :

- un client web, prioritaire ;
- un serveur de jeu temps réel faisant autorité ;
- plus tard, un client mobile.

L'[ADR 0002](0002-organiser-le-code-en-monorepo.md) prévoit de partager `packages/rules` et `packages/protocol` entre le serveur et les clients. Ce partage n'est possible simplement que si ces applications utilisent le même langage.

Contraintes :

- un seul développeur, qui connaît déjà Flutter, Dart et Kotlin ;
- hébergement gratuit (exigence NF-OPS-02) ;
- animations soignées sur l'écran de jeu ;
- premier affichage web rapide (exigence NF-PERF-02) ;
- le projet sert aussi de vitrine pour une recherche d'emploi en développement mobile.

## Options envisagées

### Option A : Dart partout

Flutter pour le web et le mobile, Dart pour le serveur.

- Avantages : un seul langage, `rules` et `protocol` partagés sans effort ; le mobile est quasiment gratuit une fois le web fait ; cohérent avec un profil Flutter.
- Inconvénients : premier chargement de Flutter web plus lourd qu'un site classique ; écosystème serveur Dart plus petit.

### Option B : TypeScript pour le web et le serveur, Flutter pour le mobile

Un framework web TypeScript et Node.js pour le serveur. Flutter pour le mobile, plus tard.

- Avantages : client web léger et standard ; écosystème serveur très riche ; TypeScript est très demandé ; apprentissage d'un écosystème nouveau, en complément de Flutter.
- Inconvénients : le moteur de règles ne peut pas être partagé tel quel avec le mobile ; deux langages à maintenir.

### Option C : TypeScript partout, mobile en TypeScript

Comme l'option B, mais le mobile en React Native ou en application web empaquetée.

- Avantages : un seul langage, partage complet.
- Inconvénients : s'éloigne de Flutter et Kotlin, donc du profil visé.

## Décision

Option B : TypeScript pour `apps/web`, `apps/server`, `packages/rules` et `packages/protocol`. Flutter pour `apps/mobile`.

La décision repose sur une préférence : découvrir l'écosystème TypeScript pour le web et le serveur, et garder Flutter pour le mobile. Aucune mesure n'a été faite sur Flutter web.

Le framework web, la bibliothèque WebSocket et l'outil de workspaces feront l'objet d'ADR séparés.

## Conséquences

- Le web et le serveur partagent `rules` et `protocol` dans un workspace TypeScript.
- L'application mobile ne pourra pas importer ces paquets. Au moment de la développer (jalon J5), un nouvel ADR devra choisir entre :
  - réécrire le moteur de règles en Dart, avec un jeu de tests commun pour garantir que les deux versions donnent les mêmes résultats ;
  - laisser le serveur calculer, pour chaque carte de la main du joueur, les sections où elle peut être posée, et l'envoyer au client. Le client mobile n'aurait alors besoin d'aucune règle ;
  - générer les types de `protocol` en Dart à partir d'un schéma (JSON Schema ou AsyncAPI).
- Les tests du moteur de règles doivent être écrits comme des données (entrée, résultat attendu) plutôt que comme du code, pour pouvoir être rejoués sur une autre implémentation.
- Le `.gitignore` et la CI sont complétés pour Node.js.
