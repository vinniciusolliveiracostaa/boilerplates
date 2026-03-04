export class Session {
  constructor(
    private readonly id: string,
    private readonly userId: string,
    private expiresAt: Date,
    private token: string,
    private ipAddress: string | null,
    private userAgent: string | null,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {}

  // ==================== GETTERS ====================

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getToken(): string {
    return this.token;
  }

  getIpAddress(): string | null {
    return this.ipAddress;
  }

  getUserAgent(): string | null {
    return this.userAgent;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // ==================== COMMANDS ====================

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  invalidate(): void {
    this.expiresAt = new Date();
    this.updatedAt = new Date();
  }

  toDTO(currentToken?: string) {
    return {
      id: this.id,
      userId: this.userId,
      token: currentToken ?? "",
      expiresAt: this.expiresAt,
      ipAddress: this.ipAddress ?? null,
      userAgent: this.userAgent ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
