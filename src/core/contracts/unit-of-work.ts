export interface IUnitOfWork {
	/**
	 * Executa callback dentro de transação.
	 * Se já existe transação ativa (nested), reutiliza a mesma.
	 */
	execute<T>(fn: () => Promise<T>): Promise<T>;

	/**
	 * Retorna client da transação ativa ou conexão padrão.
	 */
	getClient(): unknown; // Tipado na implementação concreta
}
