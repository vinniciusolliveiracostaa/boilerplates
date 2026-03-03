export interface JwtPayload {
  /** User ID */
  sub: string;
  /** Session ID */
  sid: string;
  /** Issued at (epoch seconds) */
  iat?: number;
  /** Expiration (epoch seconds) */
  exp?: number;
}

export interface IJwtProvider {
  /** Assina payload e retorna token string */
  sign(payload: Pick<JwtPayload, "sub" | "sid">, expiresIn?: string): Promise<string>;

  /** Verifica assinatura + expiração. Throws UnauthorizedError se inválido */
  verify(token: string): Promise<JwtPayload>;

  /** Decodifica SEM verificar (útil pra ler claims de token expirado) */
  decode(token: string): JwtPayload | null;
}
