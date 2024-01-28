import { Inject, Service } from "typedi";
import { validate } from "class-validator";
import InjectEventDispatcher, { EventDispatcherInterface } from "../../decorator/InjectEventDispatcher";
import InjectEntityManager, { EntityManagerInterface } from "../../decorator/InjectEntityManager";
import Category from "../../entity/Category";
import CategoryRepository from "../../repository/CategoryRepository";
import CategoryNameTakenError from "../../error/category/CategoryNameTakenError";
import User from "../../entity/User";
import CategoryNotFoundError from "../../error/category/CategoryNotFoundError";
import CategoryOwnershipError from "../../error/category/CategoryOwnershipError";
import CategorySchema from "../../schema/category/CategorySchema";
import AuthService from "../auth/AuthService";
import { Permission } from "../../type/auth/Permission";

@Service()
export default class CategoryService {

    constructor(
        @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
        @Inject() private readonly categoryRepository: CategoryRepository,
        @InjectEventDispatcher() private readonly eventDispatcher: EventDispatcherInterface,
        @Inject() private readonly authService: AuthService,
    ) {
    }

    /**
     * @param transfer
     * @param initiator
     * @throws AuthorizationFailedError
     */
    public async createCategory(transfer: CategorySchema, initiator: User): Promise<Category> {
        await validate(transfer);

        await this.authService.verifyAuthorization(initiator, Permission.CREATE_CATEGORY);

        const name = transfer.name;
        await this.verifyCategoryNameNotExists(name);

        const category: Category = new Category();
        category.name = transfer.name;
        category.createdBy = initiator._id;
        await this.entityManager.save<Category>(category);

        this.eventDispatcher.dispatch('categoryCreated', { category });

        return category;
    }

    public async getCategory(id: string): Promise<Category> {
        const category: Category = await this.categoryRepository.findOneById(id);

        if (!category) {
            throw new CategoryNotFoundError(id);
        }

        return category;
    }

    public async updateCategoryById(id: string, transfer: CategorySchema, initiator: User): Promise<Category> {
        await validate(transfer);

        const category: Category = await this.getCategory(id);
        this.verifyCategoryOwnership(category, initiator);

        if (transfer.name) {
            category.name = transfer.name;
        }

        await this.entityManager.save<Category>(category);

        this.eventDispatcher.dispatch('categoryUpdated', { category });

        return category;
    }

    public async replaceCategoryById(id: string, transfer: CategorySchema, initiator: User): Promise<Category> {
        await validate(transfer);

        const category: Category = await this.getCategory(id);
        this.verifyCategoryOwnership(category, initiator);

        category.name = transfer.name;
        await this.entityManager.save<Category>(category);

        this.eventDispatcher.dispatch('categoryReplaced', { category });

        return category;
    }

    public async deleteCategory(category: Category, initiator: User): Promise<Category> {
        this.verifyCategoryOwnership(category, initiator);
        await this.entityManager.remove<Category>(category);

        this.eventDispatcher.dispatch('categoryDeleted', { category });

        return category;
    }

    public async deleteCategoryById(id: string, initiator: User): Promise<Category> {
        const category: Category = await this.getCategory(id);
        this.verifyCategoryOwnership(category, initiator);

        return await this.deleteCategory(category, initiator);
    }

    public async verifyCategoryNameNotExists(name: string): Promise<void> {
        if (await this.categoryRepository.findOneByName(name)) {
            throw new CategoryNameTakenError(`Name "${name}" is already taken`);
        }
    }

    public verifyCategoryOwnership(category: Category, initiator: User): void {
        if (category.createdBy.toString() !== initiator._id.toString()) {
            throw new CategoryOwnershipError(category._id.toString());
        }
    }
}