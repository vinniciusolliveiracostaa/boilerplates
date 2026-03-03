export type Result<T, E = Error> =
	| { success: true; data: T }
	| { success: false; error: E };

export const Result = {
	ok: <T>(data: T): Result<T, never> => ({ success: true, data }),
	fail: <E>(error: E): Result<never, E> => ({ success: false, error }),
} as const;

// Uso:
// const result = Result.ok(user);
// const result = Result.fail(new NotFoundError("User"));
// if (result.success) { result.data } else { result.error }
