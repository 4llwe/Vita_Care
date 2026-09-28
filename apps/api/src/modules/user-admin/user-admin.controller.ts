import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { UserAdminService } from './user-admin.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class UserAdminController {
  constructor(private readonly users: UserAdminService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserAdminDto,
    @CurrentUser() actor: { id: string },
  ) {
    return this.users.update(id, dto, actor.id);
  }
}
