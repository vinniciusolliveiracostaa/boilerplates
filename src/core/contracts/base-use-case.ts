import type { FastifyBaseLogger } from "fastify";
import { ForbiddenError, InternalError } from "../errors";
import type { IUnitOfWork } from "./unit-of-work";

export interface IAuthorizationService {
	authorize(
		action: string,
		subject: string,
		conditions?: Record<string, unknown>,
	): void;
	can(
		action: string,
		subject: string,
		conditions?: Record<string, unknown>,
	): boolean;
}

export abstract class BaseUseCase<TInput, TOutput> {
	constructor(
		protected readonly unitOfWork: IUnitOfWork,
		protected readonly logger: FastifyBaseLogger,
	) {}

	abstract execute(input: TInput): Promise<TOutput>;

	protected async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
		return this.unitOfWork.execute(fn);
	}
}

/**
 * Use case que REQUER autorização.
 * Se authorizationService não for injetado, LANÇA ERRO (não loga warn).
 *
 * Corrige o problema do onde authorize() era silencioso.
 */
export abstract class AuthorizedUseCase<TInput, TOutput> extends BaseUseCase<
	TInput,
	TOutput
> {
	constructor(
		unitOfWork: IUnitOfWork,
		logger: FastifyBaseLogger,
		private readonly authorizationService: IAuthorizationService,
	) {
		super(unitOfWork, logger);
	}

	/**
	 * Lança ForbiddenError se não tem permissão.
	 * Lança InternalError se service não foi injetado (bug de config).
	 */
	protected authorize(
		action: string,
		subject: string,
		conditions?: Record<string, unknown>,
	): void {
		if (!this.authorizationService) {
			// ERRO, não warning. Isso é bug de configuração.
			throw new ForbiddenError(
				`AuthorizationService não injetado em ${this.constructor.name}. ` +
					"Use BaseUseCase se a rota é pública.",
			);
		}
		this.authorizationService.authorize(action, subject, conditions);
	}

	protected can(
		action: string,
		subject: string,
		conditions?: Record<string, unknown>,
	): boolean {
		if (!this.authorizationService) {
			throw new InternalError(
				`AuthorizationService não injetado em ${this.constructor.name}.`,
			);
		}
		return this.authorizationService.can(action, subject, conditions);
	}
}
