export abstract class Entity<T extends string = string> {
  protected constructor(protected readonly _id: T) {}

  getId(): T {
    return this._id;
  }

  equals(other: Entity<T>): boolean {
    return this._id === other._id;
  }
}
