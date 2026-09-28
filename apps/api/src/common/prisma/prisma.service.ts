import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";

export type DatabaseActor = {
  id: string;
  role: string;
  roles?: string[];
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }

  async withActor<T>(
    actor: DatabaseActor,
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const roles = [...new Set([actor.role, ...(actor.roles ?? [])])].join(",");
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.user_id', ${actor.id}, true)`;
      await tx.$executeRaw`SELECT set_config('app.roles', ${roles}, true)`;
      return callback(tx);
    });
  }
}
