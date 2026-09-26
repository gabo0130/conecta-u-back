export type Defined<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

/**
 * Copia solo las propiedades con valor: `undefined` significa "no se envió" y se omite,
 * mientras que `null` se conserva porque significa "borrar el valor".
 * Base de las actualizaciones parciales (PATCH).
 */
export function pickDefined<T extends object>(values: T): Defined<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as Defined<T>;
}
