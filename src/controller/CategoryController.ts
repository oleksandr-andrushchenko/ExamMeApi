import {
  Authorized,
  BadRequestError,
  Body,
  CurrentUser,
  Delete,
  ForbiddenError,
  Get,
  HttpCode,
  JsonController,
  NotFoundError,
  OnUndefined,
  Params,
  Patch,
  Post,
  Put,
  QueryParams,
} from 'routing-controllers'
import { Inject, Service } from 'typedi'
import Category from '../entity/Category'
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi'
import CategoryService from '../service/category/CategoryService'
import User from '../entity/User'
import CategorySchema from '../schema/category/CategorySchema'
import CategoryNotFoundError from '../error/category/CategoryNotFoundError'
import CategoryNameTakenError from '../error/category/CategoryNameTakenError'
import ConflictHttpError from '../error/http/ConflictHttpError'
import AuthorizationFailedError from '../error/auth/AuthorizationFailedError'
import CategoryUpdateSchema from '../schema/category/CategoryUpdateSchema'
import ValidatorError from '../error/validator/ValidatorError'
import PaginatedCategories from '../schema/category/PaginatedCategories'
import ValidatorInterface from '../service/validator/ValidatorInterface'
import GetCategorySchema from '../schema/category/GetCategorySchema'
import CategoryQuerySchema from '../schema/category/CategoryQuerySchema'

@Service()
@JsonController('/categories')
export default class CategoryController {

  constructor(
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
    try {
      return await this.categoryService.createCategory(category, user)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof CategoryNameTakenError:
          throw new ConflictHttpError((error as CategoryNameTakenError).message)
      }
    }
  }

  @Get()
  @OpenAPI({
    responses: {
      200: { description: 'OK' },
    },
  })
  @ResponseSchema(PaginatedCategories)
  public async queryCategories(
    @QueryParams({ type: CategoryQuerySchema }) query: CategoryQuerySchema,
  ): Promise<PaginatedCategories> {
    try {
      return await this.categoryService.queryCategories(query, true) as PaginatedCategories
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
      }
    }
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
    @Params({ type: GetCategorySchema, required: true }) getCategorySchema: GetCategorySchema,
  ): Promise<Category> {
    try {
      await this.validator.validate(getCategorySchema)

      return await this.categoryService.getCategory(getCategorySchema.categoryId)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof CategoryNotFoundError:
          throw new NotFoundError((error as CategoryNotFoundError).message)
      }
    }
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
    @Params({ type: GetCategorySchema, required: true }) getCategorySchema: GetCategorySchema,
    @Body({ type: CategorySchema, required: true }) categorySchema: CategorySchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    try {
      await this.validator.validate(getCategorySchema)

      const category = await this.categoryService.getCategory(getCategorySchema.categoryId)

      await this.categoryService.replaceCategory(category, categorySchema, user)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof CategoryNotFoundError:
          throw new NotFoundError((error as CategoryNotFoundError).message)
        case error instanceof CategoryNameTakenError:
          throw new ConflictHttpError((error as CategoryNameTakenError).message)
      }
    }
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
    @Params({ type: GetCategorySchema, required: true }) getCategorySchema: GetCategorySchema,
    @Body({ type: CategoryUpdateSchema, required: true }) categoryUpdateSchema: CategoryUpdateSchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    try {
      await this.validator.validate(getCategorySchema)

      const category = await this.categoryService.getCategory(getCategorySchema.categoryId)

      await this.categoryService.updateCategory(category, categoryUpdateSchema, user)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof CategoryNotFoundError:
          throw new NotFoundError((error as CategoryNotFoundError).message)
        case error instanceof CategoryNameTakenError:
          throw new ConflictHttpError((error as CategoryNameTakenError).message)
      }
    }
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
    @Params({ type: GetCategorySchema, required: true }) getCategorySchema: GetCategorySchema,
    @CurrentUser({ required: true }) user: User,
  ): Promise<void> {
    try {
      await this.validator.validate(getCategorySchema)
      const category = await this.categoryService.getCategory(getCategorySchema.categoryId)

      await this.categoryService.deleteCategory(category, user)
    } catch (error) {
      switch (true) {
        case error instanceof ValidatorError:
          throw new BadRequestError((error as ValidatorError).message)
        case error instanceof AuthorizationFailedError:
          throw new ForbiddenError((error as AuthorizationFailedError).message)
        case error instanceof CategoryNotFoundError:
          throw new NotFoundError((error as CategoryNotFoundError).message)
      }
    }
  }
}