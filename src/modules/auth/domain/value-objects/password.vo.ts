export class PasswordVO {
  private constructor(private readonly hashedValue: string) {}

  static async create(plain: string): Promise<PasswordVO> {
    if (!plain || plain.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
    const hash = await Bun.password.hash(plain);
    return new PasswordVO(hash);
  }

  static fromHash(hash: string): PasswordVO {
    if (!hash) throw new Error("Invalid hash");
    return new PasswordVO(hash);
  }

  getValue(): string {
    return this.hashedValue;
  }

  async compare(plain: string): Promise<boolean> {
    return Bun.password.verify(plain, this.hashedValue);
  }
}
