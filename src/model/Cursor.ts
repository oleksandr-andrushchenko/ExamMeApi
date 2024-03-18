import PaginationSchema from '../schema/pagination/PaginationSchema'
import { ObjectId } from 'mongodb'
import { MongoRepository } from 'typeorm'
import PaginatedSchema, { PaginatedMetaSchema } from '../schema/pagination/PaginatedSchema'

interface Where {
  where: {}
  limit: {}
  sort: {}
}

export default class Cursor<Entity> {

  constructor(
    private readonly pagination: PaginationSchema,
    private readonly baseUrl: string = '',
    private repository: MongoRepository<Entity> = undefined,
    // todo: change
    private readonly defaultLimit: number = 1,
    private readonly maxLimit: number = 1,
    private readonly defaultOrder: string = 'desc',
  ) {
  }

  public setRepository(repository: MongoRepository<Entity>): void {
    this.repository = repository
  }

  public getSize(): number {
    return this.pagination.size
  }

  public getOrder(): string {
    return this.pagination.order
  }

  public getBefore(): string {
    return this.pagination.before
  }

  public getAfter(): string {
    return this.pagination.after
  }

  public getWhere(): Where {
    // todo: use this.getOrder()
    const sort = { _id: -1 }
    const where: { _id?: object } = {}

    if (this.getBefore()) {
      sort._id = 1
      where._id = { $gt: new ObjectId(this.getBefore()) }
    } else if (this.getAfter()) {
      where._id = { $lt: new ObjectId(this.getAfter()) }
    }

    let limit = +this.getSize() || this.defaultLimit

    if (limit < 1) {
      limit = this.defaultLimit
    }

    if (limit > this.maxLimit) {
      limit = this.maxLimit
    }

    return { where, limit, sort }
  }

  public getUrl(): string {
    return `${ this.baseUrl }?size=${ this.getSize() }&order=${ this.getOrder() }`
  }

  public async getPaginated(data: Entity[]): Promise<PaginatedSchema<Entity>> {
    if (this.getBefore()) {
      data.reverse()
    }

    const paginated = new PaginatedSchema<Entity>()
    paginated.data = data
    paginated.meta = new PaginatedMetaSchema()

    if (data.length) {
      const lastId = data[data.length - 1]['id']

      if (await this.repository.findOneBy({ _id: { $lt: lastId } })) {
        paginated.meta.beforeCursor = lastId
        paginated.meta.prevUrl = `${ this.getUrl() }&before=${ lastId.toString() }`
      }

      const firstId = data[0]['id']

      if (await this.repository.findOneBy({ _id: { $gt: firstId } })) {
        paginated.meta.afterCursor = firstId
        paginated.meta.prevUrl = `${ this.getUrl() }&after=${ firstId.toString() }`
      }
    }

    return paginated
  }
}