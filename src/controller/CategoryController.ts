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
            401: { description: 'Unauthorized' },
            409: { description: 'Conflict' },
        },
    })
    @ResponseSchema(Category)
    public async create(
        @CurrentUser({ required: true }) user: User,
        @Body({ required: true }) category: CategorySchema,
    ): Promise<Category> {
        try {
            return await this.categoryService.createCategory(category, user);
        } catch (error: any) {
            switch (true) {
                case error instanceof CategoryNameTakenError:
                    throw new ConflictHttpError(error.message);
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
    public async query(): Promise<Category[]> {
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
    public async find(@Param('id') id: string): Promise<Category> {
        try {
            return await this.categoryService.getCategory(id);
        } catch (error: any) {
            switch (true) {
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError(error.message);
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
    public async replace(
        @CurrentUser({ required: true }) user: User,
        @Param('id') id: string,
        @Body({ required: true }) category: CategorySchema,
    ): Promise<Category> {
        try {
            return await this.categoryService.replaceCategoryById(id, category, user);
        } catch (error: any) {
            switch (true) {
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError(error.message);
                case error instanceof CategoryOwnershipError:
                    throw new ForbiddenError(error.message);
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
    public async update(
        @CurrentUser({ required: true }) user: User,
        @Param('id') id: string,
        @Body({ required: true }) category: CategorySchema,
    ): Promise<Category> {
        try {
            return await this.categoryService.updateCategoryById(id, category, user);
        } catch (error: any) {
            switch (true) {
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError(error.message);
                case error instanceof CategoryOwnershipError:
                    throw new ForbiddenError(error.message);
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
    public async delete(
        @CurrentUser() user: User,
        @Param('id') id: string,
    ): Promise<void> {
        try {
            await this.categoryService.deleteCategoryById(id, user);
        } catch (error: any) {
            switch (true) {
                case error instanceof CategoryOwnershipError:
                    throw new ForbiddenError(error.message);
                case error instanceof CategoryNotFoundError:
                    throw new NotFoundError(error.message);
            }
        }
    }
}