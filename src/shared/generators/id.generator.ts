/** biome-ignore-all lint/complexity/noStaticOnlyClass: <> */

// Alphabets pré-configurados
const ALPHABETS = {
	/** URL-safe padrão (a-zA-Z0-9_-) */
	default: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",
	/** Só números (pra verification codes: 482901) */
	numeric: "0123456789",
	/** Sem caracteres ambíguos — remove 0/O, l/1/I (bom pra códigos que o user digita) */
	readable: "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz",
	/** Lowercase + números (pra slugs, invite codes) */
	lowercase: "0123456789abcdefghijklmnopqrstuvwxyz",
} as const;

type Alphabet = keyof typeof ALPHABETS;

export class IdGenerator {
	/** UUIDv7 nativo do Bun (time-sortable, pra PKs) */
	static uuid(): string {
		return Bun.randomUUIDv7();
	}
	/** NanoID com alphabet custom (sem dep externa) */
	static nano(size = 21, alphabet: Alphabet = "default"): string {
		const chars = ALPHABETS[alphabet];
		const mask = (2 << Math.floor(Math.log2(chars.length - 1))) - 1;
		const step = Math.ceil((1.6 * mask * size) / chars.length);

		let id = "";

		while (id.length < size) {
			const bytes = crypto.getRandomValues(new Uint8Array(step));

			for (let i = 0; i < bytes.length && id.length < size; i++) {
				const byte = bytes[i];
				if (byte === undefined) continue;

				const idx = byte & mask;
				if (idx < chars.length) {
					id += chars[idx];
				}
			}
		}

		return id;
	}
}
