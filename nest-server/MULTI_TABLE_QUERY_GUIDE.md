# 多表查询指南 - Media与Translations表关联查询

## 概述

本指南介绍如何在NestJS应用中实现Media表与Translations表的多表关联查询，获取中英文翻译数据。

## 数据库结构

### Media表
- `id`: 主键
- `title`: 标题
- `description`: 描述
- 其他媒体相关字段...

### Translations表
- `id`: 主键
- `mediaId`: 外键，关联Media表
- `field`: 翻译字段类型 (title/description)
- `language`: 语言代码 (zh/en)
- `value`: 翻译内容

## 实现方法

### 方法1: 使用TypeORM的leftJoinAndSelect

#### 单个媒体查询
```typescript
// Service方法
async findOneWithTranslations(id: number): Promise<MediaWithTranslations> {
  const media = await this.mediaRepository
    .createQueryBuilder('media')
    .leftJoinAndSelect('media.translations', 'translation')
    .where('media.id = :id', { id })
    .getOne();
  
  // 处理翻译数据...
  return mediaWithTranslations;
}

// API端点
GET /media/:id/with-translations
```

#### 媒体列表查询
```typescript
// Service方法
async findAllWithTranslations(query: QueryMediaDto): Promise<MediaWithTranslationsResponseDto> {
  const queryBuilder = this.mediaRepository
    .createQueryBuilder('media')
    .leftJoinAndSelect('media.translations', 'translation')
    .where(whereConditions)
    .orderBy('media.id', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  const [items, total] = await queryBuilder.getManyAndCount();
  // 处理翻译数据...
  return result;
}

// API端点
GET /media/with-translations?page=1&limit=10
```

### 方法2: 使用原生SQL查询

#### 单个媒体查询
```typescript
// Service方法
async findOneWithTranslationsRaw(id: number): Promise<MediaWithTranslations> {
  const result = await this.mediaRepository.query(`
    SELECT 
      m.*,
      t.field,
      t.language,
      t.value
    FROM media m
    LEFT JOIN translations t ON m.id = t.mediaId
    WHERE m.id = ?
    ORDER BY t.field, t.language
  `, [id]);
  
  // 处理结果数据...
  return mediaWithTranslations;
}

// API端点
GET /media/:id/with-translations/raw
```

#### 媒体列表查询
```typescript
// Service方法
async findAllWithTranslationsRaw(query: QueryMediaDto): Promise<MediaWithTranslationsResponseDto> {
  const result = await this.mediaRepository.query(`
    SELECT 
      m.*,
      t.field,
      t.language,
      t.value
    FROM media m
    LEFT JOIN translations t ON m.id = t.mediaId
    ${whereConditions}
    ORDER BY m.id DESC, t.field, t.language
    LIMIT ? OFFSET ?
  `, [...params, limit, offset]);
  
  // 处理结果数据...
  return result;
}

// API端点
GET /media/with-translations/raw?page=1&limit=10
```

## 返回数据格式

```json
{
  "id": 1,
  "title": "原始标题",
  "description": "原始描述",
  "poster": "海报URL",
  "backdrop": "背景URL",
  "year": 2023,
  "rating": 8.5,
  "genres": ["动作", "冒险"],
  "status": "RELEASED",
  "type": "MOVIE",
  "cast": ["演员1", "演员2"],
  "duration": 120,
  "director": "导演",
  "boxOffice": 1000000,
  "views": 1000,
  "likes": 500,
  "sourceUrl": "源URL",
  "isImagesDownloaded": true,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z",
  "translations": {
    "title": {
      "zh": "中文标题",
      "en": "English Title"
    },
    "description": {
      "zh": "中文描述",
      "en": "English Description"
    }
  }
}
```

## 性能优化

### 1. 缓存机制
所有查询方法都实现了Redis缓存，避免重复查询数据库。

### 2. 索引优化
建议在以下字段上创建索引：
```sql
-- Translations表索引
CREATE INDEX idx_translations_media_id ON translations(mediaId);
CREATE INDEX idx_translations_field_language ON translations(field, language);
CREATE INDEX idx_translations_media_field ON translations(mediaId, field);

-- Media表索引
CREATE INDEX idx_media_type_status ON media(type, status);
CREATE INDEX idx_media_year ON media(year);
```

### 3. 查询优化
- 使用LEFT JOIN而不是INNER JOIN，确保即使没有翻译也能返回媒体数据
- 在WHERE条件中使用索引字段
- 合理使用LIMIT和OFFSET进行分页

## 使用建议

### 选择合适的方法
1. **TypeORM QueryBuilder**: 适合简单查询，代码更易维护
2. **原生SQL**: 适合复杂查询，性能更好，但需要手动处理数据转换

### 缓存策略
- 单个媒体数据缓存时间较长（如1小时）
- 列表数据缓存时间较短（如5分钟）
- 更新操作时主动清除相关缓存

### 错误处理
- 处理数据库连接异常
- 处理数据格式异常（如JSON解析错误）
- 返回合适的HTTP状态码和错误信息

## 测试示例

```bash
# 获取单个媒体及其翻译
curl "http://localhost:3000/media/1/with-translations"

# 获取媒体列表及其翻译
curl "http://localhost:3000/media/with-translations?page=1&limit=10&type=MOVIE"

# 使用原生SQL查询
curl "http://localhost:3000/media/1/with-translations/raw"
curl "http://localhost:3000/media/with-translations/raw?page=1&limit=10"
```

## 注意事项

1. 确保数据库连接配置正确
2. 监控查询性能，必要时添加数据库索引
3. 定期清理过期缓存
4. 考虑添加查询超时机制
5. 在生产环境中使用连接池 