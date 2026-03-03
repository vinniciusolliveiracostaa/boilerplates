export abstract class DomainError extends Error {
	abstract readonly statusCode: number;
	abstract readonly code: string;

	constructor(
		message: string,
		public readonly details?: Record<string, unknown>,
	) {
		super(message);
		this.name = this.constructor.name;
	}

	toJSON() {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			statusCode: this.statusCode,
			details: this.details,
		};
	}
}

export class ValidationError extends DomainError {
	readonly statusCode = 400;
	readonly code = "VALIDATION_ERROR";
}

export class NotFoundError extends DomainError {
	readonly statusCode = 404;
	readonly code = "NOT_FOUND";

	constructor(resource: string, details?: Record<string, unknown>) {
		super(`${resource} não encontrado`, details);
	}
}

export class UnauthorizedError extends DomainError {
	readonly statusCode = 401;
	readonly code = "UNAUTHORIZED";

	constructor(message = "Não autorizado") {
		super(message);
	}
}

export class ForbiddenError extends DomainError {
	readonly statusCode = 403;
	readonly code = "FORBIDDEN";

	constructor(message = "Ação não permitida") {
		super(message);
	}
}

export class ConflictError extends DomainError {
	readonly statusCode = 409;
	readonly code = "CONFLICT";

	constructor(message = "Conflito de dados") {
		super(message);
	}
}

export class BusinessError extends DomainError {
	readonly statusCode = 400;

	constructor(
		message: string,
		readonly code: string = "BUSINESS_ERROR",
		details?: Record<string, unknown>,
	) {
		super(message, details);
	}
}

export class TooManyRequestsError extends DomainError {
	readonly statusCode = 429;
	readonly code = "TOO_MANY_REQUESTS";

	constructor(message = "Muitas requisições") {
		super(message);
	}
}

export class QuotaExceededError extends DomainError {
	readonly statusCode = 429;
	readonly code = "QUOTA_EXCEEDED";

	constructor(
		message = "Limite de recursos atingido",
		details?: Record<string, unknown>,
	) {
		super(message, details);
	}
}

export class InternalError extends DomainError {
	readonly statusCode = 500;
	readonly code = "INTERNAL_ERROR";

	constructor(message = "Erro interno inesperado") {
		super(message);
	}
}
