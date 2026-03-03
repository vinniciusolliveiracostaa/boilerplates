import type { FastifyBaseLogger } from "fastify";
import { ForbiddenError } from "../errors";
import type { AuthorizationContext, IAuthorizationService } from "./auth/authorization";
import type { IUnitOfWork } from "./unit-of-work";

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
 * Se authorizationService não for injetado, LANÇA ERRO.
 */
export abstract class AuthorizedUseCase<TInput, TOutput> extends BaseUseCase<TInput, TOutput> {
  constructor(
    unitOfWork: IUnitOfWork,
    logger: FastifyBaseLogger,
    private readonly authorizationService: IAuthorizationService,
  ) {
    super(unitOfWork, logger);
  }

  /**
   * Lança ForbiddenError se não tem permissão.
   * Lança ForbiddenError se service não foi injetado (bug de config).
   */
  protected async authorize(
    subject: string,
    action: string,
    resource: string,
    context?: AuthorizationContext,
  ): Promise<void> {
    if (!this.authorizationService) {
      throw new ForbiddenError(
        `AuthorizationService não injetado em ${this.constructor.name}. ` +
          "Use BaseUseCase se a rota é pública.",
      );
    }
    await this.authorizationService.authorize(subject, action, resource, context);
  }

  protected async can(
    subject: string,
    action: string,
    resource: string,
    context?: AuthorizationContext,
  ): Promise<boolean> {
    if (!this.authorizationService) {
      throw new ForbiddenError(`AuthorizationService não injetado em ${this.constructor.name}.`);
    }
    return this.authorizationService.can(subject, action, resource, context);
  }
}
