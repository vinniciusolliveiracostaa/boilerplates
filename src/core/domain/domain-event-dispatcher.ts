import type { DomainEvent } from "./domain-event";

type EventHandler<T extends DomainEvent = DomainEvent> = (
	event: T,
) => Promise<void>;

export class DomainEventDispatcher {
	private handlers = new Map<string, EventHandler[]>();

	register<T extends DomainEvent>(
		eventName: string,
		handler: EventHandler<T>,
	): void {
		const existing = this.handlers.get(eventName) ?? [];
		existing.push(handler as EventHandler);
		this.handlers.set(eventName, existing);
	}

	async dispatch(events: DomainEvent[]): Promise<void> {
		for (const event of events) {
			const handlers = this.handlers.get(event.eventName) ?? [];
			await Promise.allSettled(handlers.map((handler) => handler(event)));
		}
	}
}
