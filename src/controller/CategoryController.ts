import {
    JsonController, Get, Post, Delete, Put, Patch, Body, HttpCode, CurrentUser, Param, NotFoundError, ForbiddenError,
    Authorized, OnUndefined, BadRequestError,
} from "routing-controllers";
import { Inject, Service } from "typedi";
import Category from "../entity/Category";
import CategoryRepository from "../repository/CategoryRepository";
import InjectRepository from "../decorator/InjectRepository";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import CategoryService from "../service/category/CategoryService";
import User from "../entity/User";
import CategorySchema from "../schema/category/CategorySchema";
import CategoryNotFoundError from "../error/category/CategoryNotFoundError";
import CategoryOwnershipError from "../error/category/CategoryOwnershipError";
import CategoryNameTakenError from "../error/category/CategoryNameTakenError";
import ConflictHttpError from "../error/http/ConflictHttpError";
import AuthorizationFailedError from "../error/auth/AuthorizationFailedError";
import CategoryUpdateSchema from "../schema/category/CategoryUpdateSchema";
import ValidatorError from "../error/validator/ValidatorError";

@Service()
@JsonController('/categories')
export default class CategoryController {

    constructor(
        @InjectRepository() private readonly categoryRepository: CategoryRepository,
        @Inject() private readonly categoryService: CategoryService,
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
        @Body({ required: true }) category: CategorySchema,
        @CurrentUser({ required: true }) user: User,
    ): Promise<Category> {
        try {
            return await this.categoryService.createCategory(category, user);
        } catch (error) {
            switch (true) {
                case error instanceof ValidatorError:
                    throw new BadRequestError((error as ValidatorError).message);
                case error instanceof AuthorizationFailedError:
                    throw new ForbiddenError((error as AuthorizationFailedError).message);
                case error instanceof CategoryNameTakenError:
                    throw new ConflictHttpError((error as CategoryNameTakenError).message);
            }
        }
    }

    @Get()
    @OpenAPI({
        responses: {
            200: { description: 'OK' },
        },
    })
    @ResponseSchema(Category, { isArray: true })
    public async queryCategories(): Promise<Category[]> {
        return this.categoryRepository.findAll();
    }

    @Get('/:category_id')
    @OpenAPI({
        responses: {
            200: { description: 'OK' },
            404: { description: 'Not Found' },
        },
    })
    @ResponseSchema(Category)
    public async findCategory(
        @Param('category_id') id: string,
    ): Promise<Category> {
        try {
            return await this.categoryService.getCategory(id);
        } catch (error) {
            switch (true) {
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError((error as CategoryNotFoundError).message);
            }
        }
    }

    @Put('/:category_id')
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
        @Param('category_id') id: string,
        @Body({ required: true }) category: CategorySchema,
        @CurrentUser({ required: true }) user: User,
    ): Promise<void> {
        try {
            await this.categoryService.replaceCategory(id, category, user);
        } catch (error) {
            switch (true) {
                case error instanceof ValidatorError:
                    throw new BadRequestError((error as ValidatorError).message);
                case error instanceof AuthorizationFailedError:
                    throw new ForbiddenError((error as AuthorizationFailedError).message);
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError((error as CategoryNotFoundError).message);
                case error instanceof CategoryOwnershipError:
                    throw new ForbiddenError((error as CategoryOwnershipError).message);
                case error instanceof CategoryNameTakenError:
                    throw new ConflictHttpError((error as CategoryNameTakenError).message);
            }
        }
    }

    @Patch('/:category_id')
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
        @Param('category_id') id: string,
        @Body({ required: true }) category: CategoryUpdateSchema,
        @CurrentUser({ required: true }) user: User,
    ): Promise<void> {
        try {
            await this.categoryService.updateCategory(id, category, user);
        } catch (error) {
            switch (true) {
                case error instanceof ValidatorError:
                    throw new BadRequestError((error as ValidatorError).message);
                case error instanceof AuthorizationFailedError:
                    throw new ForbiddenError((error as AuthorizationFailedError).message);
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError((error as CategoryNotFoundError).message);
                case error instanceof CategoryOwnershipError:
                    throw new ForbiddenError((error as CategoryOwnershipError).message);
                case error instanceof CategoryNameTakenError:
                    throw new ConflictHttpError((error as CategoryNameTakenError).message);
            }
        }
    }

    @Delete('/:category_id')
    @Authorized()
    @HttpCode(204)
    @OnUndefined(204)
    @OpenAPI({
        security: [ { bearerAuth: [] } ],
        responses: {
            204: { description: 'No Content' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Not Found' },
        },
    })
    public async deleteCategory(
        @Param('category_id') id: string,
        @CurrentUser({ required: true }) user: User,
    ): Promise<void> {
        try {
            await this.categoryService.deleteCategory(id, user);
        } catch (error) {
            switch (true) {
                case error instanceof AuthorizationFailedError:
                    throw new ForbiddenError((error as AuthorizationFailedError).message);
                case error instanceof CategoryOwnershipError:
                    throw new ForbiddenError((error as CategoryOwnershipError).message);
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError((error as CategoryNotFoundError).message);
            }
        }
    }
}