import type { DomainEvent } from "./domain-event";
import { Entity } from "./entity";

export abstract class AggregateRoot<T extends string = string> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }
}
