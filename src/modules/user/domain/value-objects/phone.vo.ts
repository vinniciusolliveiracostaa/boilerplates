import { BusinessError } from "../../../../core/errors"; // Ajuste o caminho conforme seu projeto

export class PhoneVO {
  private constructor(private readonly value: string) {}

  static create(value: string | null | undefined): PhoneVO {
    if (!value || value.trim().length === 0) {
      throw new BusinessError(
        "Telefone não pode ser vazio.",
        "INVALID_PHONE_EMPTY",
      );
    }

    // 1. Normalização: Limpa tudo que não for dígito numérico (ex: espaços, parênteses, traços)
    // Entra: "(11) 98765-4321" -> Sai: "11987654321"
    const numericValue = value.replace(/\D/g, "");

    // 2. Validação Padrão Brasil (DDD + Número)
    // 10 dígitos = Fixo (ex: 11 4002 8922)
    // 11 dígitos = Celular (ex: 11 98765 4321)
    // 12 ou 13 dígitos = Com código do país (+55)
    if (numericValue.length < 10 || numericValue.length > 13) {
      throw new BusinessError(
        "O telefone deve conter entre 10 e 13 dígitos numéricos.",
        "INVALID_PHONE_LENGTH",
      );
    }

    // (Opcional) Validação rigorosa para celular BR de 11 dígitos (sempre começa com 9 após o DDD)
    if (
      numericValue.length === 11 &&
      !numericValue.substring(2).startsWith("9")
    ) {
      throw new BusinessError(
        "Celular inválido. O número deve começar com o dígito 9 após o DDD.",
        "INVALID_MOBILE_PHONE",
      );
    }

    return new PhoneVO(numericValue);
  }

  // Retorna o valor limpo para salvar no banco (ex: "11987654321")
  getValue(): string {
    return this.value;
  }

  // ==========================================
  // HELPER: Formatação para a UI ou E-mails
  // ==========================================
  getFormatted(): string {
    const v = this.value;

    // Fixo BR: (XX) XXXX-XXXX
    if (v.length === 10) {
      return `(${v.substring(0, 2)}) ${v.substring(2, 6)}-${v.substring(6)}`;
    }

    // Celular BR: (XX) 9XXXX-XXXX
    if (v.length === 11) {
      return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
    }

    // DDI + Fixo: +55 (XX) XXXX-XXXX
    if (v.length === 12 && v.startsWith("55")) {
      return `+${v.substring(0, 2)} (${v.substring(2, 4)}) ${v.substring(4, 8)}-${v.substring(8)}`;
    }

    // DDI + Celular: +55 (XX) 9XXXX-XXXX
    if (v.length === 13 && v.startsWith("55")) {
      return `+${v.substring(0, 2)} (${v.substring(2, 4)}) ${v.substring(4, 9)}-${v.substring(9)}`;
    }

    // Fallback: retorna como está se for um formato desconhecido
    return v;
  }

  equals(other: PhoneVO): boolean {
    return this.value === other.value;
  }
}
