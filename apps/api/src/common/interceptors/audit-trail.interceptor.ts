import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { from, Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { PrismaService } from "../prisma/prisma.service";

/** Mencatat setiap mutasi (POST/PUT/PATCH/DELETE) ke tabel AuditLog. */
@Injectable()
export class AuditTrailInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    return next.handle().pipe(
      mergeMap((result) => {
        if (!mutating || !req.user) return from(Promise.resolve(result));
        return from(
          this.prisma.auditLog
            .create({
              data: {
                actorId: req.user.id,
                action: req.method,
                entity: req.route?.path ?? req.url,
                entityId: (result as any)?.id ?? null,
                ip: req.ip,
              },
            })
            .then(() => result),
        );
      }),
    );
  }
}
