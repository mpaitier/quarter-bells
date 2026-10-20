# 0008 - Validation des horloges

- Statut : Accepté
- Date : 2026-10-19

## Contexte

Les horloges sont décrites en JSON (exigence F-REG-01), selon le [format des horloges](../clock-format.md). Le moteur doit refuser une horloge invalide au chargement, puis la manipuler sous forme d'objets typés.

Le choix de la bibliothèque de validation est soumis à plusieurs contraintes :

- **Une seule source de vérité.** Un JSON Schema et des types TypeScript écrits séparément finissent par diverger, et rien ne le signale.
- **Un vrai JSON Schema.** Le schéma doit exister sous forme de fichier standard, pour que l'éditeur valide et complète les horloges pendant qu'on les écrit.
- **Aucune entrée/sortie dans `packages/rules`** (exigence NF-QUA-04), et un code qui tourne aussi dans le navigateur. L'application web appliquera une Content Security Policy, qui interdira probablement l'évaluation de code (`unsafe-eval`).
- **Des erreurs qui désignent le champ fautif**, pour que le message cite le fichier et le chemin du champ.
- **Des paramètres qui dépendent du type de règle.** Côté TypeScript, c'est une union discriminée sur `kind` ; côté JSON Schema, plusieurs branches (`anyOf`, `oneOf` ou `if`/`then`).

## Options envisagées

### Ajv seul

Référence de la validation JSON Schema, rapide, erreurs avec le chemin du champ (`instancePath`).

Le schéma et les types s'écrivent séparément. Le type utilitaire `JSONSchemaType` relie les deux, mais gère mal les unions. Ajv compile chaque schéma en code avec `new Function`, ce qui demande `unsafe-eval` dans la CSP, sauf en mode « standalone » qui pré-génère le code au build : une étape de plus à maintenir. Le paquet tire quatre dépendances.

### Zod 4

Très répandu, API lisible, types dérivés (`z.infer`). L'union discriminée est native (`z.discriminatedUnion`) et l'erreur ne porte que sur la branche qui correspond au `kind`. Aucune évaluation de code.

Le schéma est un objet Zod. Le JSON Schema en est un export (`z.toJSONSchema`) : une conversion, pas la source. Les vérifications écrites en code (`refine`, `transform`) ne passent pas dans le JSON Schema, si bien que ce qu'accepte l'éditeur et ce qu'accepte le moteur peuvent différer sans que ce soit visible.

### TypeBox 1.x

Paquet `typebox` (anciennement `@sinclair/typebox`, en 0.34). Ce que TypeBox construit est directement un JSON Schema standard, qu'il suffit de sérialiser. Le type se dérive avec `Static`. Le paquet n'a aucune dépendance et sa licence est MIT.

La validation passe par `Value.Check` et `Value.Errors`, qui donnent le chemin du champ fautif au format pointeur JSON. Le compilateur accélère la validation par évaluation de code quand l'environnement l'autorise, et revient à une validation interprétée sinon : une CSP stricte ne casse rien.

Inconvénients :

- Moins répandu que Zod, donc moins d'exemples et de réponses en ligne.
- L'API a beaucoup changé entre la 0.34 et la 1.x. Une bonne partie des exemples trouvés en ligne vise l'ancienne version (`@sinclair/typebox`, `TypeCompiler`).
- Pas de construction dédiée aux unions discriminées. Sur une union simple, `Value.Errors` rapporte l'échec de chaque branche. Un prototype l'a vérifié : un `min` de mauvais type dans une règle `sumInRange` produit aussi des erreurs pour la branche `minCardCount`.

## Décision

**TypeBox 1.x** (paquet `typebox`), dont la version exacte est figée par le fichier de verrouillage.

Les schémas des horloges sont écrits avec TypeBox dans `packages/rules`. Les types TypeScript en sont dérivés avec `Static`, et le JSON Schema est généré à partir des mêmes schémas. Aucun des deux n'est écrit à la main.

## Conséquences

- `typebox` est la seule dépendance d'exécution de `packages/rules`. Elle n'a ni dépendance ni entrée/sortie, NF-QUA-04 reste respectée.
- Le JSON Schema généré est versionné dans `packages/rules/schema/clock.schema.json`. Un script le regénère, et la CI échoue s'il ne correspond plus aux schémas TypeBox. Chaque horloge le référence par un champ `$schema`, que le schéma doit donc accepter.
- Le schéma ne couvre que la structure. Ce qu'il ne sait pas exprimer (`min` inférieur ou égal à `max`, portée d'une règle, unicité des `uid` entre horloges) est vérifié en code, après le schéma. L'éditeur ne signale donc pas ces erreurs : seuls le chargement et les tests les détectent.
- Le bruit des unions est traité avant de produire l'erreur : seules les erreurs de la branche qui correspond au `kind` sont gardées, et un `kind` inconnu donne une seule erreur, sur `/kind`.
- Les erreurs de TypeBox ne sortent pas du paquet. Elles sont traduites en erreur du domaine (`InvalidClockError`). Changer de bibliothèque ne toucherait que le module de validation.
- Seule la documentation de la 1.x fait foi. Un exemple qui importe `@sinclair/typebox` ou `TypeCompiler` vise l'ancienne version.
- Le schéma n'accepte que les types de règles connus du [catalogue](../rule-catalog.md). Un type candidat n'y entre qu'une fois promu, avec ses tests (exigence NF-QUA-01).
