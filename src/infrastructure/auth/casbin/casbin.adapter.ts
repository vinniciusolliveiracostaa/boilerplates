import type { Enforcer } from "casbin";
import type {
  AuthorizationContext,
  IAuthorizationService,
} from "../../../core/contracts/auth/authorization";
import { ForbiddenError } from "../../../core/errors";

/**
 * Adapter que conecta o contrato do core ao Casbin Enforcer.
 * O Enforcer é injetado via DI — essa classe só traduz a interface.
 */
export class CasbinAuthorizationAdapter implements IAuthorizationService {
  constructor(private readonly enforcer: Enforcer) {}

  async authorize(
    subject: string,
    action: string,
    resource: string,
    _context?: AuthorizationContext,
  ): Promise<void> {
    const allowed = await this.can(subject, action, resource, _context);
    if (!allowed) {
      throw new ForbiddenError(`${subject} não tem permissão para ${action} em ${resource}`);
    }
  }

  async can(
    subject: string,
    action: string,
    resource: string,
    _context?: AuthorizationContext,
  ): Promise<boolean> {
    return this.enforcer.enforce(subject, action, resource);
  }

  async addPolicy(subject: string, action: string, resource: string): Promise<void> {
    await this.enforcer.addPolicy(subject, action, resource);
  }
  async removePolicy(subject: string, action: string, resource: string): Promise<void> {
    await this.enforcer.removePolicy(subject, action, resource);
  }
}
