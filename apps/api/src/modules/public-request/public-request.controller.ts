import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreatePublicRequestDto, UpdatePublicRequestDto } from "./public-request.dto";
import { PublicRequestService } from "./public-request.service";
@Controller("public-requests")
export class PublicRequestController {
  constructor(private readonly service: PublicRequestService) {}
  @Post() create(@Body() dto: CreatePublicRequestDto) {
    return this.service.create(dto);
  }
  @Get() @UseGuards(JwtAuthGuard, RolesGuard) @Roles("COORDINATOR", "SUPER_ADMIN") list(
    @Query("status") status?: string,
  ) {
    return this.service.list(status);
  }
  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("COORDINATOR", "SUPER_ADMIN")
  update(
    @Param("id") id: string,
    @Body() dto: UpdatePublicRequestDto,
    @CurrentUser() u: { id: string },
  ) {
    return this.service.update(id, dto, u.id);
  }
}
