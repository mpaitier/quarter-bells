# 0014 - Bibliothèque de traduction du client web

- Statut : Accepté
- Date : 2026-11-08

## Contexte

Aucun texte affiché par le client web ne doit être écrit en dur (NF-I18N-01). Le français est disponible dès le départ, l'anglais est prévu. L'[ADR 0012](0012-framework-web-et-rendu-de-l-horloge.md) a retenu React et renvoyé le choix de la bibliothèque de traduction à l'issue #31, entre les deux bibliothèques maintenues pour React : react-i18next et react-intl.

Contraintes :

- **Des pluriels corrects** : « 1 carte », « 3 cartes », et « 0 carte » au singulier en français.
- **Des identifiants de message vérifiés par TypeScript**, pour qu'une faute de frappe dans une clé se voie à la compilation et non à l'écran.
- **Le budget JavaScript initial de 150 Ko compressés**, dont React occupe déjà 69 Ko.
- **Une application mobile en Flutter** à venir, avec ses propres textes à traduire.

## Options envisagées

Les deux options ont été mesurées sur le client web actuel, avec un titre et un message au pluriel, par un build de production. Point de départ : 68,9 Ko compressés.

### react-i18next

Des clés dans un fichier JSON, lues par une fonction `t()`. Chaque forme du pluriel est une clé à part (`cards_one`, `cards_other`).

- Poids : +17 Ko compressés.
- Prise en main immédiate : `t("clé")`.
- Clés typées par déclaration de types.
- Syntaxe des messages propre à i18next.
- Version 18.0.0, une version majeure publiée le 7 novembre 2026, la veille de cette décision.

### react-intl

Des messages au format ICU MessageFormat, un standard Unicode, lus par `useIntl()` ou le composant `<FormattedMessage>`. Le pluriel est écrit dans le message : `{count, plural, one {# carte} other {# cartes}}`.

- Poids : +14 Ko compressés.
- Syntaxe ICU à apprendre pour les pluriels et les choix.
- Identifiants typés par déclaration de types (`FormatjsIntl.Message`).
- Même syntaxe que les fichiers ARB du système de traduction officiel de Flutter (`gen-l10n`).
- Version 12.1.6, publiée le 27 octobre 2026.

## Décision

**react-intl.**

L'argument décisif est l'application mobile : avec la syntaxe ICU, un message s'écrit de la même façon sur le web et dans Flutter, et une seule syntaxe est à apprendre. react-intl est aussi le plus léger des deux, et sa version actuelle a plus de recul.

Organisation :

- Un catalogue JSON par langue dans `apps/web/src/i18n/messages/`. Le catalogue français fait référence : ses clés sont les seuls identifiants valides, et tout autre catalogue doit avoir les mêmes.
- Les identifiants sont nommés par écran puis par élément, séparés par des points : `app.title`.
- Un fournisseur `TranslationProvider` entoure l'application, et le français est la langue par défaut.
- Une règle ESLint refuse le texte écrit en dur dans les composants de `apps/web/src`.

## Conséquences

- Les messages avec pluriel ou variable s'écrivent en syntaxe ICU. Un test analyse chaque message de chaque catalogue et échoue si la syntaxe est invalide, sans attendre l'affichage.
- Les composants testés qui affichent un texte traduit se rendent avec le fournisseur de traductions (`renderWithTranslations` dans les tests).
- react-intl embarque l'analyseur de messages ICU, qui lit les messages au chargement. Si le poids devient un problème, les catalogues pourront être précompilés au build (`@formatjs/cli compile --ast`) pour retirer cet analyseur du bundle.
- L'ajout de l'anglais demandera un catalogue `en.json`, le choix de la langue (détection du navigateur, préférence enregistrée) et la mise à jour de l'attribut `lang` de la page, aujourd'hui fixé à `fr` dans `index.html`.
