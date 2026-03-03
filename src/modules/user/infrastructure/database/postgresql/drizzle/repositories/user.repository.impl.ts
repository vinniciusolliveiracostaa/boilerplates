import { eq } from "drizzle-orm";
import { BaseRepository } from "../../../../../../../core/contracts/base-repository";
import type { DrizzleClient } from "../../../../../../../infrastructure/database/postgresql/drizzle/drizzle.provider";
import { users } from "../../../../../../../infrastructure/database/postgresql/drizzle/schemas";
import { User } from "../../../../../domain/entities/user.entity";
import type { IUserRepository } from "../../../../../domain/repositories/user.repository";
import { EmailVO } from "../../../../../domain/value-objects/email.vo";
import { PhoneVO } from "../../../../../domain/value-objects/phone.vo";

export class UserRepositoryImpl extends BaseRepository<DrizzleClient> implements IUserRepository {
  // ==================== QUERIES ====================

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query.users.findFirst({
      where: {
        id,
        deletedAt: { isNull: true },
      },
    });

    return result ? this.toDomain(result) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query.users.findFirst({
      where: {
        email,
        deletedAt: { isNull: true },
      },
    });

    return result ? this.toDomain(result) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const result = await this.db.query.users.findFirst({
      where: {
        phone,
        deletedAt: { isNull: true },
      },
    });

    return result ? this.toDomain(result) : null;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const result = await this.db.query.users.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
        deletedAt: { isNull: true },
      },
    });

    return result ? this.toDomain(result) : null;
  }

  // ==================== COMMANDS ====================

  async save(user: User): Promise<void> {
    const data = this.toPersistence(user);

    await this.db.insert(users).values(data);
  }

  async softDelete(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async restore(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async hardDelete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  // ==================== MAPPERS ====================

  private toDomain(raw: typeof users.$inferSelect): User {
    return new User(
      raw.id,
      raw.role,
      raw.name,
      PhoneVO.create(raw.phone),
      raw.phoneVerified,
      EmailVO.create(raw.email),
      raw.emailVerified,
      raw.banned ?? false,
      raw.banReason ?? null,
      raw.banExpires ?? null,
      raw.createdAt,
      raw.updatedAt,
      raw.deletedAt ?? undefined,
    );
  }

  private toPersistence(user: User): typeof users.$inferInsert {
    return {
      id: user.getId(),
      role: user.getRole(),
      name: user.getName(),
      email: user.getEmail().getValue(),
      emailVerified: user.isEmailVerified(),
      phone: user.getPhone().getValue(),
      phoneVerified: user.isPhoneVerified(),
      banned: user.isBanned() ?? false,
      banReason: user.getBanReason() ?? null,
      banExpires: user.getBanExpires() ?? null,
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
      deletedAt: user.getDeletedAt() ?? undefined,
    };
  }
}
