import {
  Authorized,
  Body,
  CurrentUser,
  Delete,
  Get,
  HttpCode,
  JsonController,
  OnUndefined,
  Params,
  Patch,
  Post,
  Put,
  QueryParams,
} from 'routing-controllers'
import { Inject, Service } from 'typedi'
import Category from '../entities/Category'
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi'
import CategoryService from '../services/category/CategoryService'
import User from '../entities/User'
import CategorySchema from '../schema/category/CategorySchema'
import CategoryUpdateSchema from '../schema/category/CategoryUpdateSchema'
import PaginatedCategories from '../schema/category/PaginatedCategories'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import GetCategorySchema from '../schema/category/GetCategorySchema'
import CategoryQuerySchema from '../schema/category/CategoryQuerySchema'

@Service()
@JsonController('/categories')
export default class CategoryController {

  public constructor(
    @Inject() private readonly categoryService: CategoryService,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  @Post()
  @Authorized()
  @HttpCode(201)
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
      409: { description: 'Conflict' },
    },
  })
  @ResponseSchema(Category)
  public async createCategory(
    @Body({ type: CategorySchema, required: true }) category: CategorySchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<Category> {
    return await this.categoryService.createCategory(category, user)
  }

  @Get()
  @OpenAPI({
    responses: {
      200: { description: 'OK' },
    },
  })
  @ResponseSchema(PaginatedCategories)
  public async queryCategories(
    @QueryParams({ type: CategoryQuerySchema }) categoryQuery: CategoryQuerySchema,
  ): Promise<PaginatedCategories> {
    return await this.categoryService.queryCategories(categoryQuery, true) as PaginatedCategories
  }

  @Get('/:categoryId')
  @OpenAPI({
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad Request' },
      404: { description: 'Not Found' },
    },
  })
  @ResponseSchema(Category)
  public async getCategory(
    @Params({ type: GetCategorySchema, required: true }) getCategory: GetCategorySchema,
  ): Promise<Category> {
    await this.validator.validate(getCategory)

    return await this.categoryService.getCategory(getCategory.categoryId)
  }

  @Put('/:categoryId')
  @Authorized()
  @HttpCode(205)
  @OnUndefined(205)
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      205: { description: 'Reset Content' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
      404: { description: 'Not Found' },
      409: { description: 'Conflict' },
    },
  })
  public async replaceCategory(
    @Params({ type: GetCategorySchema, required: true }) getCategory: GetCategorySchema,
    @Body({ type: CategorySchema, required: true }) categoryReplace: CategorySchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    await this.validator.validate(getCategory)
    const category = await this.categoryService.getCategory(getCategory.categoryId)

    await this.categoryService.replaceCategory(category, categoryReplace, user)
  }

  @Patch('/:categoryId')
  @Authorized()
  @HttpCode(205)
  @OnUndefined(205)
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      205: { description: 'Reset Content' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
      404: { description: 'Not Found' },
      409: { description: 'Conflict' },
    },
  })
  public async updateCategory(
    @Params({ type: GetCategorySchema, required: true }) getCategory: GetCategorySchema,
    @Body({ type: CategoryUpdateSchema, required: true }) categoryUpdate: CategoryUpdateSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    await this.validator.validate(getCategory)
    const category = await this.categoryService.getCategory(getCategory.categoryId)

    await this.categoryService.updateCategory(category, categoryUpdate, user)
  }

  @Delete('/:categoryId')
  @Authorized()
  @HttpCode(204)
  @OnUndefined(204)
  @OpenAPI({
    security: [ { bearerAuth: [] } ],
    responses: {
      204: { description: 'No Content' },
      400: { description: 'Bad Request' },
      401: { description: 'Unauthorized' },
      403: { description: 'Forbidden' },
      404: { description: 'Not Found' },
    },
  })
  public async deleteCategory(
    @Params({ type: GetCategorySchema, required: true }) getCategory: GetCategorySchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    await this.validator.validate(getCategory)
    const category = await this.categoryService.getCategory(getCategory.categoryId)

    await this.categoryService.deleteCategory(category, user)
  }
}