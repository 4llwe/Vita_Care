import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested,
} from 'class-validator';

export class InvoiceItemDto {
  @IsString()
  @MinLength(2)
  description!: string;

  @IsInt() @Min(1)
  qty!: number;

  @IsInt() @Min(0)
  unitPrice!: number;
}

export class CreateInvoiceDto {
  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsString()
  @MinLength(2)
  patientName!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];

  /** Persentase pajak/biaya admin (mis. 11 untuk PPN 11%). Default 0. */
  @IsOptional()
  @IsInt() @Min(0)
  taxPercent?: number;
}
