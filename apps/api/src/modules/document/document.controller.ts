import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto, NewVersionDto, ReviewDto, SetDocumentAccessDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthActor } from '../../common/auth/actor';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  constructor(private readonly docs: DocumentService) {}

  @Post()
  @Roles('UNIT_HEAD', 'COORDINATOR', 'SUPER_ADMIN')
  create(@Body() dto: CreateDocumentDto, @CurrentUser() actor: AuthActor) {
    return this.docs.create(dto, actor);
  }

  @Post(':id/versions')
  @Roles('UNIT_HEAD', 'COORDINATOR', 'SUPER_ADMIN')
  addVersion(@Param('id') id: string, @Body() dto: NewVersionDto, @CurrentUser() actor: AuthActor) {
    return this.docs.addVersion(id, dto, actor);
  }

  @Post(':id/submit')
  @Roles('UNIT_HEAD', 'COORDINATOR', 'SUPER_ADMIN')
  submit(@Param('id') id: string, @CurrentUser() actor: AuthActor) {
    return this.docs.submitForReview(id, actor);
  }

  @Post(':id/approve')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  approve(@Param('id') id: string, @Body() dto: ReviewDto, @CurrentUser() actor: AuthActor) {
    return this.docs.approve(id, dto, actor);
  }

  @Post(':id/reject')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  reject(@Param('id') id: string, @Body() dto: ReviewDto, @CurrentUser() actor: AuthActor) {
    return this.docs.reject(id, dto, actor);
  }

  @Get()
  @Roles('UNIT_HEAD', 'COORDINATOR', 'DIRECTOR', 'AUDITOR', 'SUPER_ADMIN')
  findAll(@CurrentUser() actor: AuthActor) {
    return this.docs.findAll(actor);
  }

  @Get(':id')
  @Roles('UNIT_HEAD', 'COORDINATOR', 'DIRECTOR', 'AUDITOR', 'SUPER_ADMIN')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthActor) {
    return this.docs.findOne(id, actor);
  }

  @Post(':id/access')
  @Roles('UNIT_HEAD', 'COORDINATOR', 'SUPER_ADMIN')
  setAccess(
    @Param('id') id: string,
    @Body() dto: SetDocumentAccessDto,
    @CurrentUser() actor: AuthActor,
  ) {
    return this.docs.setAccess(id, dto, actor);
  }
}
