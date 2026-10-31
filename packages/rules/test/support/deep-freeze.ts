// Gèle un objet et tout ce qu'il contient. Sur un objet gelé, toute
// modification lève une TypeError (les modules ES sont en mode strict) :
// un test qui gèle l'état avant une action prouve que l'action ne le
// modifie pas, sans avoir à comparer champ par champ.

export function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}
