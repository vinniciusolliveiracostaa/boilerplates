import { resolve } from "node:path";
import { type Enforcer, newEnforcer } from "casbin";
import type { DrizzleAdapterOptions } from "drizzle-adapter";
import DrizzleAdapter, { casbinRulePostgres } from "drizzle-adapter";
import type {
  AuthorizationContext,
  IAuthorizationService,
} from "../../../core/contracts/auth/authorization";
import { ForbiddenError } from "../../../core/errors";

export class CasbinProvider implements IAuthorizationService {
  private constructor(private readonly enforcer: Enforcer) {}

  static async create(db: DrizzleAdapterOptions["db"]): Promise<CasbinProvider> {
    const adapter = await DrizzleAdapter.newAdapter({
      db,
      table: casbinRulePostgres,
    });

    const modelPath = resolve(import.meta.dir, "model.conf");
    const enforcer = await newEnforcer(modelPath, adapter);
    await enforcer.loadPolicy();

    return new CasbinProvider(enforcer);
  }

  async authorize(
    subject: string,
    action: string,
    resource: string,
    context?: AuthorizationContext | undefined,
  ): Promise<void> {
    const allowed = await this.can(subject, action, resource, context);
    if (!allowed) {
      throw new ForbiddenError(`${subject} não tem permissão para ${action} em ${resource}`);
    }
  }

  async can(
    subject: string,
    action: string,
    resource: string,
    _context?: AuthorizationContext | undefined,
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
