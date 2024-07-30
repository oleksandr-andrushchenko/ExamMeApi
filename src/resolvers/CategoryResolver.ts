import { Inject, Service } from 'typedi'
import CategoryProvider from '../services/category/CategoryProvider'
import { Arg, Args, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql'
import Category from '../entities/category/Category'
import GetCategories from '../schema/category/GetCategories'
import GetCategory from '../schema/category/GetCategory'
import CreateCategory from '../schema/category/CreateCategory'
import User from '../entities/user/User'
import UpdateCategory from '../schema/category/UpdateCategory'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import PaginatedCategories from '../schema/category/PaginatedCategories'
import CategoryDeleter from '../services/category/CategoryDeleter'
import CategoryCreator from '../services/category/CategoryCreator'
import CategoryUpdater from '../services/category/CategoryUpdater'
import CategoriesProvider from '../services/category/CategoriesProvider'
import CategoryApproveSwitcher from '../services/category/CategoryApproveSwitcher'
import CategoryRepository from '../repositories/CategoryRepository'

@Service()
@Resolver(Category)
export class CategoryResolver {

  public constructor(
    @Inject() private readonly categoryProvider: CategoryProvider,
    @Inject() private readonly categoriesProvider: CategoriesProvider,
    @Inject() private readonly categoryCreator: CategoryCreator,
    @Inject() private readonly categoryUpdater: CategoryUpdater,
    @Inject() private readonly categoryDeleter: CategoryDeleter,
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject() private readonly categoryApproveSwitcher: CategoryApproveSwitcher,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  @Query(_returns => Category, { name: 'category' })
  public async getCategory(
    @Args() getCategory: GetCategory,
  ): Promise<Category> {
    await this.validator.validate(getCategory)

    return await this.categoryProvider.getCategory(getCategory.categoryId)
  }

  @Authorized()
  @Query(_returns => [ Category ], { name: 'ownCategories' })
  public async getOwnCategories(
    @Ctx('user') user: User,
  ): Promise<Category[]> {
    return await this.categoryRepository.findByOwner(user)
  }

  @Query(_returns => [ Category ], { name: 'categories' })
  public async getCategories(
    @Args() getCategories: GetCategories,
    @Ctx('user') user: User,
  ): Promise<Category[]> {
    return await this.categoriesProvider.getCategories(getCategories, false, user) as Category[]
  }

  @Query(_returns => PaginatedCategories, { name: 'paginatedCategories' })
  public async getPaginatedCategories(
    @Args() getCategories: GetCategories,
    @Ctx('user') user: User,
  ): Promise<PaginatedCategories> {
    return await this.categoriesProvider.getCategories(getCategories, true, user) as PaginatedCategories
  }

  @Authorized()
  @Mutation(_returns => Category)
  public async createCategory(
    @Arg('createCategory') createCategory: CreateCategory,
    @Ctx('user') user: User,
  ): Promise<Category> {
    return await this.categoryCreator.createCategory(createCategory, user)
  }

  @Authorized()
  @Mutation(_returns => Category)
  public async updateCategory(
    @Args() getCategory: GetCategory,
    @Arg('updateCategory') updateCategory: UpdateCategory,
    @Ctx('user') user: User,
  ): Promise<Category> {
    await this.validator.validate(getCategory)
    const category = await this.categoryProvider.getCategory(getCategory.categoryId)

    return await this.categoryUpdater.updateCategory(category, updateCategory, user)
  }

  @Authorized()
  @Mutation(_returns => Category)
  public async toggleCategoryApprove(
    @Args() getCategory: GetCategory,
    @Ctx('user') user: User,
  ): Promise<Category> {
    await this.validator.validate(getCategory)
    const category = await this.categoryProvider.getCategory(getCategory.categoryId)

    await this.categoryApproveSwitcher.toggleCategoryApprove(category, user)

    return category
  }

  @Authorized()
  @Mutation(_returns => Boolean)
  public async deleteCategory(
    @Args() getCategory: GetCategory,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    await this.validator.validate(getCategory)
    const category = await this.categoryProvider.getCategory(getCategory.categoryId)

    await this.categoryDeleter.deleteCategory(category, user)

    return true
  }

  @FieldResolver(_returns => Boolean, { nullable: true })
  public async isOwner(
    @Root() category: Category,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    return user && user.id.toString() === category?.ownerId?.toString()
  }

  @FieldResolver(_returns => Boolean, { nullable: true })
  public async isCreator(
    @Root() category: Category,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    return user && user.id.toString() === category.creatorId.toString()
  }
}