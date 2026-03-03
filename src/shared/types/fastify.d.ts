import "fastify";
import type { User } from "../../modules/user/domain/entities/user.entity";

declare module "fastify" {
  interface FastifyRequest {
    user: User;
    session: Session;
  }
}
