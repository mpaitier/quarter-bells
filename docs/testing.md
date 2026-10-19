# Stratégie de tests

Ce document décrit ce qui est testé, comment, et avec quels outils. Il s'applique à tout le monorepo. Les outils sont choisis dans l'[ADR 0005](adr/0005-outillage-typescript.md).

## Principes

- **Un comportement, un test.** Un test vérifie une seule chose, et son nom dit laquelle.
- **Tester le comportement, pas l'implémentation.** Un test ne doit pas casser quand on réorganise le code sans changer ce qu'il fait.
- **Pas de hasard non maîtrisé.** Tout ce qui est aléatoire (mélange des cartes, identifiants) reçoit une graine ou un générateur injecté. Un test qui échoue une fois sur dix est un bug.
- **Pas d'horloge système dans la logique.** Les délais (inactivité, présence) dépendent d'une horloge injectée, que les tests contrôlent.
- **Les tests d'abord pour le moteur de règles.** Le catalogue des règles fournit déjà les cas à écrire.

## Niveaux de tests

La plupart des tests sont des tests unitaires, rapides et nombreux. Plus on monte dans les niveaux, moins il y a de tests, et plus chacun couvre de terrain.

| Niveau          | Cible                                                                    | Outil                                          | Lancé                   |
| --------------- | ------------------------------------------------------------------------ | ---------------------------------------------- | ----------------------- |
| Unitaire        | `packages/rules`, `packages/protocol`, logique pure du serveur et du web | Vitest                                         | à chaque PR             |
| Propriétés      | invariants du moteur de règles                                           | Vitest + fast-check                            | à chaque PR             |
| Intégration     | serveur réel, clients WebSocket de test                                  | Vitest                                         | à chaque PR             |
| Composants      | composants de l'écran de jeu                                             | Vitest + bibliothèque de test du framework web | à chaque PR             |
| De bout en bout | parcours complets dans de vrais navigateurs                              | Playwright                                     | à chaque PR vers `main` |

### Tests unitaires du moteur de règles

C'est le cœur de la stratégie. Chaque type de règle du [catalogue](rule-catalog.md) a au moins un cas de réussite et un cas d'échec (exigence NF-QUA-01). Les règles de valeur ont en plus des cas pour la vérification pendant la Pose : bornes hautes dépassées avec des cartes toutes visibles, puis la même pose acceptée quand une carte est cachée.

Les cas sont écrits sous forme de données plutôt que de code. Un fichier JSON décrit l'entrée et le résultat attendu :

```json
{
  "description": "sumInRange échoue quand la somme dépasse le maximum",
  "rule": { "kind": "sumInRange", "params": { "min": 6, "max": 10 } },
  "section": 1,
  "placements": [
    {
      "sectionIndex": 1,
      "card": { "family": "instant", "value": 7 },
      "faceUp": false
    },
    {
      "sectionIndex": 1,
      "card": { "family": "eternity", "value": 5 },
      "faceUp": false
    }
  ],
  "expected": { "satisfied": false }
}
```

Un seul test Vitest parcourt tous les fichiers du dossier et vérifie chaque cas. Ce format a deux avantages : ajouter un cas ne demande pas de code, et le même jeu de cas pourra valider une future version Dart du moteur (voir l'ADR 0003).

Les épreuves complètes, de la distribution à la résolution, sont testées de la même façon : une horloge, une graine, une suite de poses, un résultat attendu.

### Tests de propriétés

Certains comportements se vérifient mieux par des invariants que par des exemples. La bibliothèque fast-check génère des centaines d'entrées au hasard et vérifie que la propriété tient toujours. En cas d'échec, elle réduit l'entrée au plus petit contre-exemple.

Propriétés à vérifier :

- une distribution donne exactement 12 cartes, sans doublon, réparties selon le nombre de joueurs ;
- une même graine donne toujours la même distribution ;
- la somme d'une section est la somme de ses cartes, quel que soit l'ordre de pose ;
- une pose refusée ne modifie pas l'état ;
- la vue d'un joueur ne contient jamais la valeur d'une carte face cachée posée par un autre.

### Tests du format des horloges

- Chaque fichier d'horloge du jeu est validé par le JSON Schema.
- Des horloges invalides écrites exprès (deux sections de départ, 5 sections, règle inconnue, paramètres manquants) sont rejetées.
- Chaque chapitre contient exactement 4 horloges, avec des `uid` uniques dans tout le jeu.

### Tests d'intégration du serveur

Le serveur est démarré dans le processus de test, sur un port libre. Des clients WebSocket de test jouent des scénarios complets : créer une salle, la rejoindre, jouer une épreuve, se déconnecter puis revenir.

Le test le plus important vérifie l'exigence NF-SEC-01 : il enregistre tous les messages reçus par chaque joueur pendant une partie, puis cherche dans ceux du joueur A la valeur de chaque carte que A ne devait pas connaître. Ce test est un critère de sortie du jalon J3.

Autres scénarios obligatoires :

- une commande envoyée deux fois n'a qu'un effet (NF-REL-02) ;
- un joueur reconnecté retrouve exactement l'état de la partie (NF-REL-01) ;
- une commande réservée à l'hôte est refusée pour les autres ;
- une commande invalide dans la phase en cours est refusée sans changer l'état.

### Tests de bout en bout

Playwright ouvre plusieurs contextes de navigateur, un par joueur, et joue une épreuve entière à travers l'interface. Ces tests sont lents et fragiles par nature : ils couvrent uniquement les parcours principaux, jamais les cas limites, qui sont testés plus bas.

Parcours couverts :

- créer une salle, la rejoindre à 2, jouer et réussir une épreuve ;
- échouer une épreuve et voir l'œil bonus apparaître ;
- un joueur se déconnecte pendant son tour, la partie se met en pause, il revient.

## Organisation des fichiers

```
packages/rules/
  src/
    deal.ts
    deal.test.ts            tests unitaires à côté du code
  test/
    cases/                  cas de règles en JSON
      sumInRange/
        fails-above-max.json
    properties/             tests de propriétés
apps/server/
  test/
    integration/
apps/web/
  e2e/                      tests Playwright
```

Les tests unitaires se placent dans un folder **test** dédié, répliquant le folder **src** qu'ils testent, avec le suffixe `.test.ts`. Les autres tests vont dans un dossier `test/` ou `e2e/` propre à chaque paquet.

## Nommage

Le nom d'un test se lit comme une phrase qui décrit le comportement :

```ts
describe("sumInRange", () => {
  it("échoue quand la somme dépasse le maximum", () => {
    /* ... */
  });
  it("refuse pendant la Pose une carte qui dépasse le maximum si toutes les cartes sont visibles", () => {
    /* ... */
  });
});
```

## Couverture

| Paquet              | Seuil minimum de couverture des lignes |
| ------------------- | -------------------------------------- |
| `packages/rules`    | 95 %                                   |
| `packages/protocol` | 90 %                                   |
| `apps/server`       | 80 %                                   |
| `apps/web`          | pas de seuil                           |

La couverture est un indicateur, pas un objectif. Un code couvert à 100 % par des tests sans assertion utile ne prouve rien. Ces seuils servent à repérer le code oublié, et la CI échoue s'ils ne sont pas atteints.

## Intégration continue

À chaque pull request, la CI lance dans l'ordre :

1. installation des dépendances avec le fichier de verrouillage ;
2. vérification du formatage ;
3. lint ;
4. vérification des types ;
5. tests unitaires, de propriétés et d'intégration, avec la couverture ;
6. tests de bout en bout, à partir du jalon J2.

Une étape en échec bloque la fusion (exigence NF-QUA-02). Seuls les paquets touchés par la PR, et ceux qui en dépendent, sont testés.

## Ce qui n'est pas testé

- Le rendu visuel exact (couleurs, positions au pixel près), vérifié à l'œil pendant le développement.
- Le temps d'animation.
- Les bibliothèques externes elles-mêmes.
