import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { DomainError } from "../../core/errors";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  // Domain errors — controlados
  if (error instanceof DomainError) {
    reply.status(error.statusCode).send({
      error: error.code,
      message: error.message,
      details: error.details,
    });
    return;
  }

  // Zod validation — transforma em ValidationError
  if (error instanceof ZodError) {
    const formatted = error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));

    reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: { issues: formatted },
    });
    return;
  }

  // Rate limit do Fastify
  if (error.statusCode === 429) {
    reply.status(429).send({
      error: "TOO_MANY_REQUESTS",
      message: error.message,
    });
    return;
  }

  // Qualquer outro erro — 500 genérico (não vaza detalhes)
  request.log.error({ err: error }, "Unhandled error");

  reply.status(500).send({
    error: "INTERNAL_ERROR",
    message: "Erro interno inesperado",
  });
}
