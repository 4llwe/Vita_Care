import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto, NewVersionDto, ReviewDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  constructor(private readonly docs: DocumentService) {}

  @Post()
  @Roles('UNIT_HEAD', 'COORDINATOR', 'SUPER_ADMIN')
  create(@Body() dto: CreateDocumentDto) {
    return this.docs.create(dto);
  }

  @Post(':id/versions')
  @Roles('UNIT_HEAD', 'COORDINATOR', 'SUPER_ADMIN')
  addVersion(@Param('id') id: string, @Body() dto: NewVersionDto) {
    return this.docs.addVersion(id, dto);
  }

  @Post(':id/submit')
  @Roles('UNIT_HEAD', 'COORDINATOR', 'SUPER_ADMIN')
  submit(@Param('id') id: string) {
    return this.docs.submitForReview(id);
  }

  @Post(':id/approve')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  approve(@Param('id') id: string, @Body() dto: ReviewDto) {
    return this.docs.approve(id, dto);
  }

  @Post(':id/reject')
  @Roles('DIRECTOR', 'SUPER_ADMIN')
  reject(@Param('id') id: string, @Body() dto: ReviewDto) {
    return this.docs.reject(id, dto);
  }

  @Get()
  @Roles('UNIT_HEAD', 'COORDINATOR', 'DIRECTOR', 'AUDITOR', 'SUPER_ADMIN')
  findAll() {
    return this.docs.findAll();
  }

  @Get(':id')
  @Roles('UNIT_HEAD', 'COORDINATOR', 'DIRECTOR', 'AUDITOR', 'SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.docs.findOne(id);
  }
}
