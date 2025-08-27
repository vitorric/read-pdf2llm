type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export class Entity<T> {
  get writeableThis() {
    return this as unknown as Writeable<T>;
  }
}

export type TEntity<T> = T | undefined;
