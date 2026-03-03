import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

async function loggerPlugin(app: FastifyInstance) {
  app.addHook("onRequest", async (request) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      },
      "Incomming request",
    );
  });

  app.addHook("onResponse", async (request, reply) => {
    const responseTime = reply.elapsedTime.toFixed(2);

    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: `${responseTime}ms`,
      },
      "Request completed",
    );
  });
}

export default fp(loggerPlugin, {
  name: "logger-plugin",
});
