import { IdGenerator } from "../../../../../shared/generators/id.generator";
import type { PasswordVO } from "../../value-objects/password.vo";
import { BaseAccount } from "./base-account.entity";

export class LocalAccount extends BaseAccount {
  constructor(
    id: string,
    userId: string,
    private password: PasswordVO,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    deletedAt: Date | null = null,
  ) {
    super(id, userId, "local", userId, createdAt, updatedAt, deletedAt);
  }

  static create(userId: string, password: PasswordVO): LocalAccount {
    return new LocalAccount(IdGenerator.uuid(), userId, password);
  }

  getPassword(): PasswordVO {
    return this.password;
  }

  hasPassword(): boolean {
    return true;
  }

  isPasswordBased(): boolean {
    return true;
  }

  isOAuthBased(): boolean {
    return false;
  }

  async verifyPassword(inputPassword: string): Promise<boolean> {
    return this.password.compare(inputPassword);
  }

  changePassword(newPassword: PasswordVO): void {
    this.password = newPassword;
    this.updatedAt = new Date();
  }
}
