import { decodeJwt, errors, jwtVerify, SignJWT } from "jose";
import { UnauthorizedError } from "../../../core/errors";
import { env } from "../../config/config";
import type { IJwtProvider, JwtPayload } from "./jwt.contract";

export class JoseProvider implements IJwtProvider {
	private readonly secret: Uint8Array;

	constructor(secret: string) {
		// jose exige Uint8Array, não string
		this.secret = new TextEncoder().encode(secret);
	}

	async sign(
		payload: Pick<JwtPayload, "sub" | "sid">,
		expiresIn = env.JWT_EXPIRES_IN,
	): Promise<string> {
		return new SignJWT({ sub: payload.sub, sid: payload.sid })
			.setProtectedHeader({ alg: "HS256" })
			.setIssuedAt()
			.setExpirationTime(expiresIn)
			.sign(this.secret);
	}

	async verify(token: string): Promise<JwtPayload> {
		try {
			const { payload } = await jwtVerify(token, this.secret);
			return payload as unknown as JwtPayload;
		} catch (err) {
			// Diferencia expirado de inválido
			if (err instanceof errors.JWTExpired) {
				throw new UnauthorizedError("Token expirado");
			}
			throw new UnauthorizedError("Token inválido");
		}
	}

	decode(token: string): JwtPayload | null {
		try {
			return decodeJwt(token) as unknown as JwtPayload;
		} catch {
			return null;
		}
	}
}
