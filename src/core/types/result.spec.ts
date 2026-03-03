import { describe, expect, it } from "bun:test";
import { Result } from "./result";

describe("Result", () => {
	it("deve criar um Result de sucesso usando ok()", () => {
		const data = { id: 1, name: "Teste" };
		const result = Result.ok(data);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(data);
		}
	});

	it("deve criar um Result de erro usando fail()", () => {
		const error = new Error("Erro de negócio");
		const result = Result.fail(error);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe(error);
			expect(result.error.message).toBe("Erro de negócio");
		}
	});
});
