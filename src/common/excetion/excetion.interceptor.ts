import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";



@Catch(HttpException, Error)
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    // this.logger.error(request.url);
  }
}