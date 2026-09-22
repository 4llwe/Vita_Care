import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import {
  CreateMenuGroupDto,
  CreateMenuItemDto,
  UpdateMenuGroupDto,
  UpdateMenuItemDto,
} from "./menu.dto";
import { MenuService } from "./menu.service";
@Controller("menus")
export class MenuController {
  constructor(private readonly menu: MenuService) {}
  @Get() list() {
    return this.menu.publicMenu();
  }
  @Get("admin") @UseGuards(JwtAuthGuard, RolesGuard) @Roles("SUPER_ADMIN") admin() {
    return this.menu.adminMenu();
  }
  @Get(":section/:slug") item(
    @Param("section") section: string,
    @Param("slug") slug: string,
  ) {
    return this.menu.publicItem(section, slug);
  }
  @Post("groups") @UseGuards(JwtAuthGuard, RolesGuard) @Roles("SUPER_ADMIN") createGroup(
    @Body() dto: CreateMenuGroupDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.menu.createGroup(dto, u.id);
  }
  @Patch("groups/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  updateGroup(
    @Param("id") id: string,
    @Body() dto: UpdateMenuGroupDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.menu.updateGroup(id, dto, u.id);
  }
  @Delete("groups/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  deleteGroup(@Param("id") id: string, @CurrentUser() u: { id: string }) {
    return this.menu.deactivateGroup(id, u.id);
  }
  @Post("groups/:id/items")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  createItem(
    @Param("id") id: string,
    @Body() dto: CreateMenuItemDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.menu.createItem(id, dto, u.id);
  }
  @Patch("items/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  updateItem(
    @Param("id") id: string,
    @Body() dto: UpdateMenuItemDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.menu.updateItem(id, dto, u.id);
  }
  @Delete("items/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN")
  deleteItem(@Param("id") id: string, @CurrentUser() u: { id: string }) {
    return this.menu.deactivateItem(id, u.id);
  }
}
