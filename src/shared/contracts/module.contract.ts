import type { FastifyInstance } from "fastify";

export interface IModule {
	/**
	 * Registra dependências no container DI e rotas no Fastify.
	 */
	register(app: FastifyInstance): Promise<void>;

	/**
	 * Bootstrap: inicializa serviços (cron jobs, event handlers, etc).
	 * Chamado DEPOIS de todos os módulos serem registrados.
	 */
	bootstrap?(app: FastifyInstance): Promise<void>;
}
