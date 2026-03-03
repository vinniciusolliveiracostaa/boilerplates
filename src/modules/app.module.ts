import type {Module} from "../shared/contracts/module.contract.ts";
import type {FastifyInstance} from "fastify";
import {diContainer} from "@fastify/awilix";
import {asValue} from "awilix";


export class AppModule implements Module {
    private readonly infraModules: Module[] = [];
    private readonly featureModules: Module[] = [];

    constructor() {
        this.infraModules = []

        this.featureModules = []
    }

    async register(app: FastifyInstance): Promise<void> {
        diContainer.register({
            logger: asValue(app.log),
            //authorizationService: asValue(undefined),
        })

        app.addHook("onRequest", async (request, _reply) => {
            request.diScope.register({
                logger: asValue(request.log),
            });
        })

        app.log.info("📦 Registrando módulos de infraestrutura...");

        for (const module of this.infraModules) {
            await module.register(app);
            app.log.info(`✅ ${module.constructor.name} registrado`);
        }

        app.log.info("📦 Registrando módulos de features...");

        for (const module of this.featureModules) {
            await module.register(app);
            app.log.info(`✅ ${module.constructor.name} registrado`);
        }
    }

    async bootstrap(app: FastifyInstance): Promise<void> {
        const allModules = [...this.infraModules, ...this.featureModules];

        for (const module of allModules) {
            if (module.bootstrap) {
                await module.bootstrap(app);
            }
        }
    }
}

