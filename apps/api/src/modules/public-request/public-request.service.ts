import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationService } from "../notification/notification.service";
import { CreatePublicRequestDto, UpdatePublicRequestDto } from "./public-request.dto";
@Injectable()
export class PublicRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotificationService,
  ) {}
  async create(dto: CreatePublicRequestDto) {
    const item = await this.prisma.publicServiceRequest.create({
      data: {
        ...dto,
        preferredAt: dto.preferredAt ? new Date(dto.preferredAt) : undefined,
      },
    });
    await this.notify.enqueueClinical(
      `Permintaan publik baru: ${dto.type}`,
      `${dto.name} · ${dto.section}/${dto.slug} · ${dto.phone ?? dto.email ?? "kontak tidak tersedia"}`,
    );
    return { id: item.id, status: item.status, createdAt: item.createdAt };
  }
  list(status?: string) {
    return this.prisma.publicServiceRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }
  async update(id: string, dto: UpdatePublicRequestDto, actorId: string) {
    const found = await this.prisma.publicServiceRequest.findUnique({ where: { id } });
    if (!found) throw new NotFoundException("Permintaan tidak ditemukan");
    const item = await this.prisma.publicServiceRequest.update({
      where: { id },
      data: { status: dto.status, resolution: dto.resolution, assignedToId: actorId },
    });
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: "PUBLIC_REQUEST_UPDATED",
        entity: "PublicServiceRequest",
        entityId: id,
        after: { status: dto.status },
      },
    });
    return item;
  }
}
