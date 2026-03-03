import type { FastifyBaseLogger } from "fastify";
import type { IUnitOfWork } from "./unit-of-work";

export abstract class BaseTask {
  constructor(
    protected readonly unitOfWork: IUnitOfWork,
    protected readonly logger: FastifyBaseLogger,
  ) {}

  abstract handleCron(): Promise<void>;

  protected async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.unitOfWork.execute(fn);
  }

  /**
   * Wrapper com error handling e logging automático.
   * Use isso no scheduler em vez de chamar handleCron() direto.
   */
  async safeExecute(): Promise<void> {
    const taskName = this.constructor.name;
    const start = Date.now();

    try {
      this.logger.info({ task: taskName }, "Task started");
      await this.handleCron();
      this.logger.info({ task: taskName, durationMs: Date.now() - start }, "Task completed");
    } catch (error) {
      this.logger.error({ task: taskName, error, durationMs: Date.now() - start }, "Task failed");
    }
  }
}
