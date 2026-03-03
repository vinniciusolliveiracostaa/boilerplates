import { BusinessError } from "../../../../core/errors";
import type { EmailVO } from "../value-objects/email.vo";
import type { PhoneVO } from "../value-objects/phone.vo";

export class User {
  constructor(
    private readonly id: string,

    private role: string,

    private name: string,

    private phone: PhoneVO,
    private phoneVerified: boolean = false,

    private email: EmailVO,
    private emailVerified: boolean = false,

    private banned: boolean = false,
    private banReason: string | null = null,
    private banExpires: Date | null = null,

    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private deletedAt: Date | null = null,
  ) {}

  // ==================== GETTERS ====================

  getId(): string {
    return this.id;
  }

  getRole(): string {
    return this.role;
  }

  getName(): string {
    return this.name;
  }

  getPhone(): PhoneVO {
    return this.phone;
  }

  getPhoneVerified(): boolean {
    return this.phoneVerified;
  }

  getEmail(): EmailVO {
    return this.email;
  }

  getEmailVerified(): boolean {
    return this.emailVerified;
  }

  getBanReason(): string | null {
    return this.banReason;
  }

  getBanExpires(): Date | null {
    return this.banExpires;
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

  isBanned(): boolean {
    return this.banned;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  isEmailVerified(): boolean {
    return this.emailVerified;
  }

  isPhoneVerified(): boolean {
    return this.phoneVerified;
  }

  // ==================== COMMANDS ====================

  changeEmail(newEmail: EmailVO): void {
    if (this.email.equals(newEmail)) {
      throw new BusinessError(
        "O novo e-mail não pode ser igual ao e-mail atual.",
        "SAME_EMAIL_ERROR",
      );
    }
    this.email = newEmail;
    this.emailVerified = false;
    this.updatedAt = new Date();
  }

  verifyEmail(): void {
    if (this.emailVerified) {
      throw new BusinessError("Este email já está verificado", "EMAIL_ALREADY_VERIFIED");
    }
    this.emailVerified = true;
    this.updatedAt = new Date();
  }

  changePhone(newPhone: PhoneVO): void {
    if (this.phone.equals(newPhone)) {
      throw new BusinessError(
        "O novo telefone não pode ser igual ao telefone atual.",
        "SAME_PHONE_ERROR",
      );
    }
    this.phone = newPhone;
    this.phoneVerified = false;
    this.updatedAt = new Date();
  }

  verifyPhone(): void {
    if (this.phoneVerified) {
      throw new BusinessError("Este telefone já está verificado", "PHONE_ALREADY_VERIFIED");
    }
    this.phoneVerified = true;
    this.updatedAt = new Date();
  }

  ban(reason: string, expires?: Date): void {
    if (this.role === "admin") {
      throw new BusinessError(
        "Administradores não podem ser banidos automaticamente.",
        "CANNOT_BAN_ADMIN",
      );
    }
    this.banned = true;
    this.banReason = reason;
    this.banExpires = expires ?? null;
    this.updatedAt = new Date();
  }

  unban(): void {
    this.banned = false;
    this.banReason = null;
    this.banExpires = null;
    this.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.deletedAt) {
      throw new BusinessError("O usuário já está excluído.", "USER_ALREADY_DELETED");
    }
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    if (!this.deletedAt) {
      throw new BusinessError("O usuário não foi excluído.", "USER_NOT_IS_DELETED");
    }
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  toDTO() {
    return {
      id: this.id,
      role: this.role,
      name: this.name,
      phone: this.phone.getValue(),
      phoneVerified: this.phoneVerified,
      email: this.email.getValue(),
      emailVerified: this.emailVerified,
      banned: this.banned,
      banReason: this.banReason,
      banExpires: this.banExpires,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt ?? null,
    };
  }
}
