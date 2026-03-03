import { fastifyAwilixPlugin } from "@fastify/awilix";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

async function awilixPlugin(app: FastifyInstance) {
  await app.register(fastifyAwilixPlugin, {
    disposeOnClose: true,
    disposeOnResponse: true,
    strictBooleanEnforced: true,
    asyncInit: true,
    asyncDispose: true,
    eagerInject: true,
  });
}

export default fp(awilixPlugin, {
  name: "awilix-plugin",
});
