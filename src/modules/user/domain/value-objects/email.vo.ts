export class EmailVO {
  private constructor(private readonly value: string) {}

  static create(value: string): EmailVO {
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error("Email inválido");
    }
    return new EmailVO(value.toLowerCase());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: EmailVO): boolean {
    return this.value === other.value;
  }
}
