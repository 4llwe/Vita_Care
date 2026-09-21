import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditExecutionStatus } from '@prisma/client';
import { AuditService } from './audit.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { AddEvidenceDto } from './dto/add-evidence.dto';
import { CreateFindingFromAnswerDto } from './dto/create-finding-from-answer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('audits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  // ----- Checklist (template) -----
  @Post('checklists')
  @Roles('AUDITOR', 'SUPER_ADMIN')
  createChecklist(@Body() dto: CreateChecklistDto) {
    return this.audit.createChecklist(dto);
  }

  @Get('checklists')
  @Roles('AUDITOR', 'UNIT_HEAD', 'DIRECTOR', 'SUPERVISORY_BOARD', 'SUPER_ADMIN')
  listChecklists() {
    return this.audit.listChecklists();
  }

  @Get('checklists/:id')
  @Roles('AUDITOR', 'UNIT_HEAD', 'DIRECTOR', 'SUPERVISORY_BOARD', 'SUPER_ADMIN')
  getChecklist(@Param('id') id: string) {
    return this.audit.getChecklist(id);
  }

  // ----- Pelaksanaan audit -----
  @Post('executions')
  @Roles('AUDITOR', 'SUPER_ADMIN')
  createExecution(@Body() dto: CreateExecutionDto, @CurrentUser() user: { id: string }) {
    return this.audit.createExecution(dto, user.id);
  }

  @Get('executions')
  @Roles('AUDITOR', 'UNIT_HEAD', 'DIRECTOR', 'SUPERVISORY_BOARD', 'SUPER_ADMIN')
  listExecutions(@Query('status') status?: AuditExecutionStatus) {
    return this.audit.listExecutions({ status });
  }

  @Get('executions/:id')
  @Roles('AUDITOR', 'UNIT_HEAD', 'DIRECTOR', 'SUPERVISORY_BOARD', 'SUPER_ADMIN')
  getExecution(@Param('id') id: string) {
    return this.audit.getExecution(id);
  }

  @Patch('executions/:id/answers')
  @Roles('AUDITOR', 'SUPER_ADMIN')
  submitAnswers(@Param('id') id: string, @Body() dto: SubmitAnswersDto) {
    return this.audit.submitAnswers(id, dto);
  }

  @Patch('executions/:id/complete')
  @Roles('AUDITOR', 'SUPER_ADMIN')
  complete(@Param('id') id: string) {
    return this.audit.completeExecution(id);
  }

  // ----- Audit -> Temuan -----
  @Post('executions/:id/answers/:answerId/finding')
  @Roles('AUDITOR', 'SUPER_ADMIN')
  createFinding(
    @Param('id') id: string,
    @Param('answerId') answerId: string,
    @Body() dto: CreateFindingFromAnswerDto,
  ) {
    return this.audit.createFindingFromAnswer(id, answerId, dto);
  }

  // ----- Evidence Capture -----
  @Post('executions/:id/evidence')
  @Roles('AUDITOR', 'SUPER_ADMIN')
  addEvidence(
    @Param('id') id: string,
    @Body() dto: AddEvidenceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.audit.addEvidence(id, dto, user.id);
  }

  @Get('executions/:id/evidence')
  @Roles('AUDITOR', 'UNIT_HEAD', 'DIRECTOR', 'SUPERVISORY_BOARD', 'SUPER_ADMIN')
  listEvidence(@Param('id') id: string) {
    return this.audit.listEvidence(id);
  }

  @Delete('executions/:id/evidence/:evidenceId')
  @Roles('AUDITOR', 'SUPER_ADMIN')
  deleteEvidence(@Param('id') id: string, @Param('evidenceId') evidenceId: string) {
    return this.audit.deleteEvidence(id, evidenceId);
  }
}
