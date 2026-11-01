# Chapitre 1

Chapitre d'introduction. Les joueurs découvrent les règles générales, puis les règles de section, deux notions au plus par horloge. Le plafond de 24 est levé sur les quatre horloges (`noMaxSum`) : l'ordre croissant suffit comme difficulté de départ. Le chapitre se termine sur un plafond local de 26, qui prépare l'arrivée du plafond général au chapitre 2.

L'aiguille reste fixe sur la section 0 pendant tout le chapitre : le choix de la section de départ n'arrive qu'au chapitre 3.

## Progression

| Horloge     | Règles de section                                                                                          | Notions                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `ch01-clk0` | section 1 : au moins 1 Éternité ; section 4 : exactement 2 cartes                                          | famille, nombre exact de cartes                 |
| `ch01-clk1` | section 1 : 3e pose ; section 2 : valeur de 9 à 15 ; section 4 : 5e pose                                   | ordre de pose, intervalle de valeur             |
| `ch01-clk2` | section 0 : 3 cartes, au moins 1 de chaque famille ; section 1 : au plus 9 ; section 4 : valeur de 17 à 21 | composition par combinaison, plafond local      |
| `ch01-clk3` | section 0 : 5e pose ; section 1 : 8e pose ; section 3 : valeur de 11 à 13 ; section 5 : au plus 26         | synthèse : marges plus étroites, poses tardives |

Le nombre de contraintes passe de 2 à 3, puis 5 et 4. `ch01-clk3` n'introduit pas de type de règle : elle reprend ceux du chapitre avec moins de marge.

## ch01-clk0

Deux contraintes simples, aucune sur les valeurs. La section 4 n'accepte que deux cartes : elle vaut au plus 24, et sert de plafond aux sections 0 à 3, qui doivent rester en dessous pour respecter l'ordre croissant. C'est la seule anticipation demandée.

## ch01-clk1

Première contrainte de pose : la 3e et la 5e carte de l'épreuve ont une section imposée, quelle que soit leur valeur. L'intervalle de la section 2 est large (7 valeurs possibles), pour que la nouveauté reste la pose imposée.

## ch01-clk2

Trois règles sur la section 0 se combinent en une seule consigne : 3 cartes, avec au moins une de chaque famille. C'est la section de départ, donc la plus faible : ces 3 cartes doivent rester petites. Le plafond de 9 sur la section 1 resserre encore le début du cadran, et l'intervalle de la section 4 oblige à garder des cartes moyennes pour le milieu.

## ch01-clk3

Les poses imposées arrivent plus tard (5e et 8e), quand les mains sont déjà entamées. L'intervalle de la section 3 est étroit (3 valeurs). Le plafond de 26 porte sur la dernière section du parcours, la plus forte : il plafonne en pratique tout le cadran, juste au-dessus du futur plafond de 24.

## Originalité (F-REG-03)

Vérifiée contre les horloges du chapitre 1 du jeu d'origine. Les règles qui en étaient trop proches ont été déplacées ou modifiées. Le plafond levé sur la 4e horloge est un choix volontaire pour s'écarter du rythme d'origine. Conséquence : le plafond de 24 doit être introduit par `ch02-clk0`.
