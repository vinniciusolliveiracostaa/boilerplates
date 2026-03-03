/**
 * Contrato de autorização — vive no CORE.
 * Não sabe nada sobre Casbin, JWT, ou HTTP.
 */
export interface AuthorizationContext {
  /** Atributos arbitrários pra ABAC (role, plan, tenant, etc) */
  [key: string]: unknown;
}

export interface IAuthorizationService {
  /**
   * Verifica se subject pode executar action sobre resource.
   * @throws ForbiddenError se negado
   */
  authorize(
    subject: string,
    action: string,
    resource: string,
    context?: AuthorizationContext,
  ): Promise<void>;
  /**
   * Check sem throw — retorna boolean.
   * Útil pra lógica condicional no use case.
   */
  can(
    subject: string,
    action: string,
    resource: string,
    context?: AuthorizationContext,
  ): Promise<boolean>;
  /** Adiciona policy em runtime (ex: ao criar recurso) */
  addPolicy(subject: string, action: string, resource: string): Promise<void>;
  /** Remove policy */
  removePolicy(subject: string, action: string, resource: string): Promise<void>;
}
