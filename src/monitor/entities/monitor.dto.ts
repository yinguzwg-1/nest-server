import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";

export class MonitorDto {
  @IsString()
  @IsOptional()
    method?: string;
    @IsString()
    @IsOptional()
    url?: string;
    @IsString()
    @IsOptional()
    body?: string;
    @IsString()
    @IsOptional()
    response?: string;
    @IsString()
    @IsOptional()
    error?: string;
    @IsNumber()
    @IsOptional()
    status_code?: number;
    @IsNumber()
    @IsOptional()
    duration?: number;
    @IsDate()
    @IsOptional()
    timestamp?: Date;
    @IsString()
    @IsOptional()
    query?: string;
}