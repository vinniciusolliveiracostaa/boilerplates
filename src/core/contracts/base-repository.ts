import type { FastifyBaseLogger } from "fastify";
import type { IUnitOfWork } from "./unit-of-work";

export abstract class BaseRepository {
  constructor(
    protected readonly unitOfWork: IUnitOfWork,
    protected readonly logger: FastifyBaseLogger,
  ) {}

  /**
   * Retorna o client correto: transação ativa ou conexão padrão.
   * O UoW gerencia qual client usar.
   */
  protected get db() {
    return this.unitOfWork.getClient();
  }
}
