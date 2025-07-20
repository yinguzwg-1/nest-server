// 日志拦截器

import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { catchError, Observable, tap, throwError } from "rxjs";
import { MonitorService } from "../../monitor/service"; 
import { RedisService } from "../../redis/service";
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly log_key = 'log_stream';
  constructor(private readonly monitorService: MonitorService, private readonly redisService: RedisService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now(); 
    return next.handle().pipe(
        tap(() => {
           this.redisService.addLogToStream(this.log_key, JSON.stringify({
             method: request.method,
             url: request.url,
             body: JSON.stringify(request.body),
             response: JSON.stringify(response.body),
             error: null,
             timestamp: new Date(),
             status_code: response.statusCode,
             duration: Date.now() - startTime,
             query: JSON.stringify(request.query),
            })
           ) 

        }),
        catchError((err) => {
          this.redisService.addLogToStream(this.log_key, JSON.stringify({

            method: request.method,
            url: request.url,
            body: JSON.stringify(request.body),
            response: null,
            error: JSON.stringify(err.message),
            timestamp: new Date(),
            duration: Date.now() - startTime,
            status_code: err.statusCode || 500,
            query: JSON.stringify(request.query),
          }))
    
            return throwError(() => err);
        })
    )
  }
}