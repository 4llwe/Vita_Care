import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateMenuGroupDto,
  CreateMenuItemDto,
  UpdateMenuGroupDto,
  UpdateMenuItemDto,
} from "./menu.dto";
@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}
  publicMenu() {
    return this.prisma.navigationMenuGroup.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { items: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    });
  }
  async publicItem(section: string, slug: string) {
    const group = await this.prisma.navigationMenuGroup.findFirst({
      where: { key: section, isActive: true },
      include: { items: { where: { slug, isActive: true } } },
    });
    if (!group || !group.items[0]) throw new NotFoundException("Menu tidak ditemukan");
    return {
      group: { key: group.key, label: group.label, description: group.description },
      item: group.items[0],
    };
  }
  adminMenu() {
    return this.prisma.navigationMenuGroup.findMany({
      orderBy: { sortOrder: "asc" },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
  }
  async createGroup(dto: CreateMenuGroupDto, actorId: string) {
    const item = await this.prisma.navigationMenuGroup.create({ data: dto });
    await this.audit(actorId, "MENU_GROUP_CREATED", item.id);
    return item;
  }
  async updateGroup(id: string, dto: UpdateMenuGroupDto, actorId: string) {
    const item = await this.prisma.navigationMenuGroup.update({
      where: { id },
      data: dto,
    });
    await this.audit(actorId, "MENU_GROUP_UPDATED", id);
    return item;
  }
  async deactivateGroup(id: string, actorId: string) {
    const item = await this.prisma.navigationMenuGroup.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit(actorId, "MENU_GROUP_DEACTIVATED", id);
    return item;
  }
  async createItem(groupId: string, dto: CreateMenuItemDto, actorId: string) {
    if (dto.hrefOverride && !/^https:\/\/|^\//.test(dto.hrefOverride))
      throw new BadRequestException("hrefOverride harus HTTPS atau path internal");
    const item = await this.prisma.navigationMenuItem.create({
      data: { ...dto, groupId, steps: dto.steps ?? [] },
    });
    await this.audit(actorId, "MENU_ITEM_CREATED", item.id);
    return item;
  }
  async updateItem(id: string, dto: UpdateMenuItemDto, actorId: string) {
    if (dto.hrefOverride && !/^https:\/\/|^\//.test(dto.hrefOverride))
      throw new BadRequestException("hrefOverride harus HTTPS atau path internal");
    const item = await this.prisma.navigationMenuItem.update({
      where: { id },
      data: { ...dto, steps: dto.steps },
    });
    await this.audit(actorId, "MENU_ITEM_UPDATED", id);
    return item;
  }
  async deactivateItem(id: string, actorId: string) {
    const item = await this.prisma.navigationMenuItem.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit(actorId, "MENU_ITEM_DEACTIVATED", id);
    return item;
  }
  private async audit(actorId: string, action: string, entityId: string) {
    await this.prisma.auditLog.create({
      data: { actorId, action, entity: "NavigationMenu", entityId },
    });
  }
}
