import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const lang =
      request.headers['accept-language']?.split(',')[0]?.substring(0, 2) ||
      'zh';

    return next.handle().pipe(
      map((data) => {
        if (Array.isArray(data?.items)) {
          // 处理列表数据
          return {
            ...data,
            items: data.items.map((item) => this.transformItem(item, lang)),
          };
        } else if (data?.translations) {
          // 处理单个项目
          return this.transformItem(data, lang);
        }
        return data;
      }),
    );
  }

  private transformItem(item: any, lang: string): any {
    if (!item.translations) {
      return item;
    }

    const result = { ...item };

    // 根据语言选择标题
    if (item.translations.title) {
      result.title = item.translations.title[lang] || item.title;
    }

    // 根据语言选择描述
    if (item.translations.description) {
      result.description =
        item.translations.description[lang] || item.description;
    }

    // 删除translations字段
    delete result.translations;

    return result;
  }
}
