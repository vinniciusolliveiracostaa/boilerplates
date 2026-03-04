import { BusinessError } from "../../../../../core/errors";

export abstract class BaseAccount {
  constructor(
    protected readonly id: string,
    protected readonly accountId: string,
    protected readonly providerId: string,
    protected readonly userId: string,
    protected readonly createdAt: Date = new Date(),
    protected updatedAt: Date = new Date(),
    protected deletedAt: Date | null = null,
  ) {}

  // ==================== GETTERS ====================

  getId(): string {
    return this.id;
  }

  getAccountId(): string {
    return this.accountId;
  }

  getProviderId(): string {
    return this.providerId;
  }

  getUserId(): string {
    return this.userId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  // ==================== COMMANDS ====================

  softDelete(): void {
    if (this.deletedAt) {
      throw new BusinessError("Conta já está excluída.", "ACCOUNT_ALREADY_DELETED");
    }
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    if (!this.deletedAt) {
      throw new BusinessError("Conta não foi excluída.", "ACCOUNT_NOT_IS_DELETED");
    }
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  toDto(): object {
    return {
      id: this.id,
      accountId: this.accountId,
      providerId: this.providerId,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
