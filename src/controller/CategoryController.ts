import {
    JsonController,
    Get, Post, Delete, Put, Patch,
    Body,
    HttpCode,
    CurrentUser,
    Param,
    NotFoundError, ForbiddenError, Authorized
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
        security: [{ bearerAuth: [] }],
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
        @CurrentUser({ required: true }) user: User,
        @Body({ required: true }) category: CategorySchema,
    ): Promise<Category> {
        try {
            return await this.categoryService.createCategory(category, user);
        } catch (error) {
            switch (true) {
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

    @Get('/:id')
    @OpenAPI({
        responses: {
            200: { description: 'OK' },
            404: { description: 'Not Found' },
        },
    })
    @ResponseSchema(Category)
    public async findCategory(@Param('id') id: string): Promise<Category> {
        try {
            return await this.categoryService.getCategory(id);
        } catch (error) {
            switch (true) {
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError((error as CategoryNotFoundError).message);
            }
        }
    }

    @Put('/:id')
    @Authorized()
    @HttpCode(205)
    @OpenAPI({
        security: [{ bearerAuth: [] }],
        responses: {
            205: { description: 'Reset Content' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Not Found' },
        },
    })
    @ResponseSchema(Category)
    public async replaceCategory(
        @CurrentUser({ required: true }) user: User,
        @Param('id') id: string,
        @Body({ required: true }) category: CategorySchema,
    ): Promise<Category> {
        try {
            return await this.categoryService.replaceCategoryById(id, category, user);
        } catch (error) {
            switch (true) {
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError((error as CategoryNotFoundError).message);
                case error instanceof CategoryOwnershipError:
                    throw new ForbiddenError((error as CategoryOwnershipError).message);
            }
        }
    }

    @Patch('/:id')
    @Authorized()
    @HttpCode(205)
    @OpenAPI({
        security: [{ bearerAuth: [] }],
        responses: {
            205: { description: 'Reset Content' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Not Found' },
        },
    })
    @ResponseSchema(Category)
    public async updateCategory(
        @CurrentUser({ required: true }) user: User,
        @Param('id') id: string,
        @Body({ required: true }) category: CategorySchema,
    ): Promise<Category> {
        try {
            return await this.categoryService.updateCategoryById(id, category, user);
        } catch (error) {
            switch (true) {
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError((error as CategoryNotFoundError).message);
                case error instanceof CategoryOwnershipError:
                    throw new ForbiddenError((error as CategoryOwnershipError).message);
            }
        }
    }

    @Delete('/:id')
    @Authorized()
    @HttpCode(204)
    @OpenAPI({
        security: [{ bearerAuth: [] }],
        responses: {
            204: { description: 'No Content' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Not Found' },
        },
    })
    public async deleteCategory(
        @CurrentUser({ required: true }) user: User,
        @Param('id') id: string,
    ): Promise<void> {
        try {
            await this.categoryService.deleteCategoryById(id, user);
        } catch (error) {
            switch (true) {
                case error instanceof CategoryOwnershipError:
                    throw new ForbiddenError((error as CategoryOwnershipError).message);
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError((error as CategoryNotFoundError).message);
            }
        }
    }
}