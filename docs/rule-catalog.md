# Catalogue des types de règles

Liste des familles de règles que le moteur doit savoir évaluer. Chaque horloge combine des règles tirées de ce catalogue, avec ses propres paramètres. Le but est de décrire les 40 horloges sous forme de données (exigence F-REG-01) : une horloge qui demande un type absent du catalogue impose d'abord d'enrichir le catalogue et le moteur.

## Principes

Chaque règle :

- a un identifiant de type (`kind`) et des paramètres ;
- a une portée : une section (`SectionRule`) ou toute l'horloge (`ClockRule`) ;
- a une nature : contrainte de pose, vérifiée à chaque pose, ou condition de réussite, vérifiée à la résolution ;
- se teste isolément, avec au moins un cas de réussite et un cas d'échec (exigence NF-QUA-01).

Les règles générales (au moins une carte par section, ordre croissant, plafond de 24) sont elles-mêmes exprimées avec ce catalogue. Le moteur ne traite aucun cas à part.

## Types connus

Ces types sont nécessaires pour reproduire les mécaniques décrites dans les règles générales.

Le plafond et la section de départ ne sont pas des règles : ce sont des propriétés de l'horloge (`noMaxSum`, `startSectionMode`, `defaultStartSection`), voir le [format des horloges](clock-format.md).

| Type              | Portée             | Nature   | Paramètres         | Signification                                                                                                                              |
| ----------------- | ------------------ | -------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `minCardCount`    | section            | réussite | `min`              | Au moins `min` cartes devant la section. Règle générale avec `min = 1` sur chaque section.                                                 |
| `ascendingOrder`  | horloge            | réussite | —                  | La valeur de chaque section est supérieure ou égale à la précédente, à partir de la section de départ. Règle générale.                     |
| `maxSum`          | section ou horloge | réussite | `max`              | Valeur de la section inférieure ou égale à `max`. Règle générale avec `max = 24`.                                                          |
| `exactCardCount`  | section            | réussite | `count`, `family?` | Exactement `count` cartes devant la section, d'une famille donnée ou toutes familles confondues.                                           |
| `sumInRange`      | section            | réussite | `min`, `max`       | Valeur de la section comprise entre `min` et `max`, bornes incluses.                                                                       |
| `firstPlacements` | section            | pose     | `placementIndexes` | Les poses de rang indiqué (par exemple la 1re et la 2e) doivent se faire devant cette section. D'autres poses y restent possibles ensuite. |

### Paramètres

Les bornes sont vérifiées par le schéma des horloges (`packages/rules/src/clocks/rule-schemas.ts`). Un paramètre absent de ce tableau est refusé.

| Type              | Paramètre          | Type                    | Contrainte                      |
| ----------------- | ------------------ | ----------------------- | ------------------------------- |
| `minCardCount`    | `min`              | entier                  | ≥ 1                             |
| `ascendingOrder`  | aucun              |                         | `params` est un objet vide `{}` |
| `maxSum`          | `max`              | entier                  | ≥ 1                             |
| `exactCardCount`  | `count`            | entier                  | ≥ 0                             |
|                   | `family`           | `instant` ou `eternity` | facultatif                      |
| `sumInRange`      | `min`, `max`       | entiers                 | ≥ 0, `min` ≤ `max`              |
| `firstPlacements` | `placementIndexes` | liste d'entiers         | ≥ 0, au moins un, sans doublon  |

### Précisions

`exactCardCount` : sans `family`, toutes les cartes de la section comptent. Avec `family`, seules les cartes de cette famille comptent, et celles des autres familles peuvent être présentes sans faire échouer la règle. `count = 0` n'a de sens qu'avec `family` : il interdit les cartes de cette famille. Sans famille, il interdirait toute carte et contredirait la règle générale d'au moins une carte par section. Pour imposer une composition exacte, une horloge combine deux règles sur la même section :

```json
"rules": [
  { "kind": "exactCardCount", "params": { "count": 2, "family": "instant" } },
  { "kind": "exactCardCount", "params": { "count": 0, "family": "eternity" } }
]
```

La violation indique dans `cardCount` le nombre de cartes comptées : le client sait ainsi s'il en manque ou s'il y en a trop.

`sumInRange` : les deux bornes sont incluses. Avec `min = max`, la section doit valoir exactement cette valeur. Une section vide vaut 0, elle échoue donc dès que `min` est positif. Un `min` supérieur à `max` rend la règle impossible à réussir : `parseClock` refuse l'horloge au chargement. La violation indique dans `value` la valeur de la section, et le client la compare aux bornes pour savoir laquelle est franchie. Cette évaluation a lieu à la Résolution ; le refus d'une pose qui dépasserait un `max` connu (voir « Bornes hautes connues » plus bas) est traité à part.

## Types candidats

Idées pour concevoir des horloges originales. Chacune doit être validée par une partie de test avant d'entrer dans le catalogue. Tant qu'un type reste candidat, le schéma des horloges le refuse : une horloge ne peut pas l'utiliser.

| Type                      | Portée             | Nature   | Idée                                                            |
| ------------------------- | ------------------ | -------- | --------------------------------------------------------------- |
| `familyOnly`              | section            | pose     | Seules les cartes d'une famille peuvent y être posées.          |
| `faceUpForbidden`         | section ou horloge | pose     | Interdit de poser face visible.                                 |
| `sumParity`               | section            | réussite | Valeur paire ou impaire.                                        |
| `equalTo`                 | section            | réussite | Valeur égale à celle d'une autre section.                       |
| `maxCardCount`            | section            | pose     | Pas plus de `max` cartes devant la section.                     |
| `noConsecutiveSameFamily` | horloge            | pose     | Deux poses consécutives ne peuvent pas être de la même famille. |

## Décisions

- **Plafond et section de départ.** Ce sont des propriétés de l'horloge. Une règle se vérifie ; une propriété configure la vérification. À partir du chapitre 3, la section de départ est choisie par les joueurs pendant la Discussion, l'horloge ne fournit que sa valeur par défaut.
- **Vérifications pendant la Pose.** Les contraintes de pose ne portent que sur des informations publiques : famille, rang de pose, nombre de cartes. Les conditions sur les valeurs sont évaluées à la Résolution, pour garder l'équilibre du jeu de plateau.
- **Refus et guidage.** Une règle violée produit une violation structurée : type de règle, section, paramètres. Le moteur ne connaît ni texte ni animation. C'est le client qui associe à chaque type de violation un comportement de guidage (remettre la carte en main, agrandir l'icône de la règle, faire briller les cartes valides) et un texte traduit. Le joueur peut désactiver le guidage dans ses paramètres.

- **Bornes hautes connues.** Exception à la règle précédente : quand toutes les cartes d'une section sont face visible, leur somme est publique. Le moteur refuse alors une pose qui ferait dépasser une borne haute de la section (`maxSum`, et le maximum de `sumInRange`). Le joueur connaît la valeur de sa propre carte, donc le refus ne lui apprend rien et n'est montré qu'à lui. Une seule carte face cachée dans la section, même posée par le joueur lui-même, désactive cette vérification. Les bornes basses ne sont jamais vérifiées pendant la Pose.

  Conséquence pour le modèle : chaque règle de valeur expose deux évaluations, une à la Pose sur les informations publiques plus la carte du joueur, une à la Résolution sur toutes les cartes.
