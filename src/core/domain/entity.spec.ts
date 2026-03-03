import { describe, expect, it } from "bun:test";
import { Entity } from "./entity";

// Stub para testar a classe abstrata (Entity não pode ser instanciada direto)
class UserEntity extends Entity<string> {
  constructor(
    id: string,
    public name: string,
  ) {
    super(id);
  }
}

describe("Entity", () => {
  it("deve retornar o ID corretamente", () => {
    const user = new UserEntity("usr_123", "Vinni");

    expect(user.getId()).toBe("usr_123");
  });

  it("deve retornar true quando comparado com outra entidade de mesmo ID", () => {
    const user1 = new UserEntity("usr_123", "Vinni");
    const user2 = new UserEntity("usr_123", "Outro Nome (mesmo ID)");

    expect(user1.equals(user2)).toBe(true);
  });

  it("deve retornar false quando comparado com entidade de ID diferente", () => {
    const user1 = new UserEntity("usr_123", "Vinni");
    const user2 = new UserEntity("usr_456", "Vinni");

    expect(user1.equals(user2)).toBe(false);
  });
});
