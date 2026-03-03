import closeWithGrace from "close-with-grace";
import { buildApp } from "./app";
import { healthRoute } from "./infrastructure/health/health.route";
import { env } from "./shared/config/config.ts";

async function main() {
  const app = await buildApp();

  await app.register(healthRoute);

  // Graceful shutdown com timeout
  closeWithGrace({ delay: 5000 }, async ({ signal, err }) => {
    if (err) {
      app.log.error({ err }, "Server closing due to error");
    } else {
      app.log.info({ signal }, "Server shutting down");
    }

    // Dispõe DI container (fecha pools, connections, etc)
    await app.diContainer?.dispose();
    await app.close();
  });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Server running at http://${env.HOST}:${env.PORT}`);
    app.log.info(`Docs at http://${env.HOST}:${env.PORT}/docs`);
  } catch (err) {
    app.log.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
}

main();
