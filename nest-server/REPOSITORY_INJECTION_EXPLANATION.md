# @InjectRepository(Media) 详细解释

## 🎯 **核心概念**

`@InjectRepository(Media)` 是TypeORM在NestJS中的依赖注入装饰器，用于将数据库实体的Repository注入到服务类中。

## 📝 **语法结构**

```typescript
@InjectRepository(实体类)
private repositoryName: Repository<实体类>
```

### **参数说明**
- **`@InjectRepository`** - TypeORM的依赖注入装饰器
- **`Media`** - 要注入的实体类（对应数据库表）
- **`Repository<Media>`** - TypeORM提供的Repository类型

## 🔄 **依赖注入流程**

### **步骤1: 实体定义**
```typescript
@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;
  
  // ... 其他字段
}
```

### **步骤2: Module注册**
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Media]), // 注册Media实体
  ],
  providers: [MediaService],
})
export class MediaModule {}
```

### **步骤3: Service注入**
```typescript
@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>, // 注入Repository
  ) {}
}
```

### **步骤4: 使用Repository**
```typescript
async findAll(): Promise<Media[]> {
  return await this.mediaRepository.find(); // 使用注入的Repository
}
```

## 🗃️ **Repository提供的方法**

### **基础CRUD操作**

#### **查询操作**
```typescript
// 查找单个
const media = await this.mediaRepository.findOne({ where: { id: 1 } });
const mediaByTitle = await this.mediaRepository.findOne({ where: { title: '电影标题' } });

// 查找多个
const allMedia = await this.mediaRepository.find();
const movies = await this.mediaRepository.find({ where: { type: 'MOVIE' } });

// 计数
const count = await this.mediaRepository.count();
const movieCount = await this.mediaRepository.count({ where: { type: 'MOVIE' } });

// 查找并计数
const [items, total] = await this.mediaRepository.findAndCount({
  where: { type: 'MOVIE' },
  skip: 0,
  take: 10,
});
```

#### **创建操作**
```typescript
// 方法1: create + save
const newMedia = this.mediaRepository.create({
  title: '新电影',
  description: '电影描述',
  year: 2023,
});
await this.mediaRepository.save(newMedia);

// 方法2: 直接save
await this.mediaRepository.save({
  title: '新电影',
  description: '电影描述',
  year: 2023,
});
```

#### **更新操作**
```typescript
// 更新单个
await this.mediaRepository.update(1, { title: '更新后的标题' });

// 更新多个
await this.mediaRepository.update(
  { type: 'MOVIE' }, 
  { status: 'RELEASED' }
);
```

#### **删除操作**
```typescript
// 删除单个
await this.mediaRepository.delete(1);

// 删除多个
await this.mediaRepository.delete({ type: 'TV_SHOW' });
```

### **高级查询操作**

#### **QueryBuilder**
```typescript
// 基础查询
const media = await this.mediaRepository
  .createQueryBuilder('media')
  .where('media.id = :id', { id: 1 })
  .getOne();

// 关联查询
const mediaWithTranslations = await this.mediaRepository
  .createQueryBuilder('media')
  .leftJoinAndSelect('media.translations', 'translation')
  .where('media.id = :id', { id: 1 })
  .getOne();

// 复杂条件
const movies = await this.mediaRepository
  .createQueryBuilder('media')
  .where('media.type = :type', { type: 'MOVIE' })
  .andWhere('media.year >= :year', { year: 2020 })
  .andWhere('media.rating >= :rating', { rating: 8.0 })
  .orderBy('media.rating', 'DESC')
  .limit(10)
  .getMany();
```

#### **原生SQL**
```typescript
// 查询
const result = await this.mediaRepository.query(
  'SELECT * FROM media WHERE type = ? AND year >= ?',
  ['MOVIE', 2020]
);

// 插入
await this.mediaRepository.query(
  'INSERT INTO media (title, description, year) VALUES (?, ?, ?)',
  ['新电影', '描述', 2023]
);

// 更新
await this.mediaRepository.query(
  'UPDATE media SET title = ? WHERE id = ?',
  ['新标题', 1]
);
```

## 🔍 **实际应用示例**

### **完整的Service示例**
```typescript
@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  // 获取所有媒体
  async findAll(): Promise<Media[]> {
    return await this.mediaRepository.find();
  }

  // 根据ID获取媒体
  async findOne(id: number): Promise<Media> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }
    return media;
  }

  // 创建媒体
  async create(createMediaDto: CreateMediaDto): Promise<Media> {
    const media = this.mediaRepository.create(createMediaDto);
    return await this.mediaRepository.save(media);
  }

  // 更新媒体
  async update(id: number, updateMediaDto: UpdateMediaDto): Promise<Media> {
    await this.mediaRepository.update(id, updateMediaDto);
    return this.findOne(id);
  }

  // 删除媒体
  async remove(id: number): Promise<void> {
    const result = await this.mediaRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }
  }

  // 分页查询
  async findWithPagination(page: number = 1, limit: number = 10): Promise<{ items: Media[], total: number }> {
    const [items, total] = await this.mediaRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });
    return { items, total };
  }

  // 搜索
  async search(query: string): Promise<Media[]> {
    return await this.mediaRepository
      .createQueryBuilder('media')
      .where('media.title LIKE :query', { query: `%${query}%` })
      .orWhere('media.description LIKE :query', { query: `%${query}%` })
      .getMany();
  }
}
```

## ⚡ **性能优化技巧**

### **1. 使用索引**
```typescript
// 在实体中定义索引
@Entity('media')
@Index(['type', 'status']) // 复合索引
@Index(['year']) // 单字段索引
export class Media {
  // ...
}
```

### **2. 选择查询**
```typescript
// 只选择需要的字段
const titles = await this.mediaRepository
  .createQueryBuilder('media')
  .select(['media.id', 'media.title'])
  .getMany();
```

### **3. 批量操作**
```typescript
// 批量插入
await this.mediaRepository.save(mediaArray);

// 批量更新
await this.mediaRepository
  .createQueryBuilder()
  .update(Media)
  .set({ status: 'RELEASED' })
  .where('type = :type', { type: 'MOVIE' })
  .execute();
```

## 🔧 **常见问题解决**

### **问题1: Repository未定义**
```typescript
// 错误: Repository未在Module中注册
@Module({
  imports: [], // 缺少TypeOrmModule.forFeature([Media])
})
export class MediaModule {}

// 解决: 添加实体注册
@Module({
  imports: [
    TypeOrmModule.forFeature([Media]), // 添加这行
  ],
})
export class MediaModule {}
```

### **问题2: 循环依赖**
```typescript
// 错误: 两个Service相互依赖
@Injectable()
export class MediaService {
  constructor(
    private translationService: TranslationService, // 依赖TranslationService
  ) {}
}

@Injectable()
export class TranslationService {
  constructor(
    private mediaService: MediaService, // 依赖MediaService
  ) {}
}

// 解决: 使用forwardRef
@Module({
  imports: [
    forwardRef(() => TranslationModule),
  ],
})
export class MediaModule {}
```

## 💡 **最佳实践**

1. **总是使用Repository模式**：避免直接使用EntityManager
2. **合理使用QueryBuilder**：复杂查询使用QueryBuilder而不是原生SQL
3. **使用事务**：涉及多个操作时使用事务
4. **错误处理**：总是检查查询结果并处理异常
5. **性能监控**：监控查询性能，必要时添加索引

通过这种方式，你可以充分利用TypeORM的Repository模式来简化数据库操作！ 