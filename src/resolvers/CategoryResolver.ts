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
import CategoryListProvider from '../services/category/CategoryListProvider'
import CategoryApproveSwitcher from '../services/category/CategoryApproveSwitcher'
import CategoryRepository from '../repositories/CategoryRepository'
import CategoryRatingMarkCreator from '../services/category/CategoryRatingMarkCreator'
import RateCategoryRequest from '../schema/category/RateCategoryRequest'
import GetCategoryRatingMarksRequest from '../schema/category/GetCategoryRatingMarksRequest'
import RatingMark from '../entities/rating/RatingMark'
import CategoryRatingMarkListProvider from '../services/category/CategoryRatingMarkListProvider'
import RatingSchema from '../schema/rating/RatingSchema'
import CategoryRatingProvider from '../services/category/CategoryRatingProvider'

@Service()
@Resolver(Category)
export class CategoryResolver {

  public constructor(
    @Inject() private readonly categoryProvider: CategoryProvider,
    @Inject() private readonly categoryListProvider: CategoryListProvider,
    @Inject() private readonly categoryCreator: CategoryCreator,
    @Inject() private readonly categoryUpdater: CategoryUpdater,
    @Inject() private readonly categoryDeleter: CategoryDeleter,
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject() private readonly categoryApproveSwitcher: CategoryApproveSwitcher,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly categoryRatingMarkCreator: CategoryRatingMarkCreator,
    @Inject() private readonly categoryRatingMarkLinkProvider: CategoryRatingMarkListProvider,
    @Inject() private readonly categoryRatingProvider: CategoryRatingProvider,
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
  public async getCurrentUserCategories(
    @Ctx('user') user: User,
  ): Promise<Category[]> {
    return await this.categoryRepository.findByOwner(user)
  }

  @Query(_returns => [ Category ], { name: 'categories' })
  public async getCategories(
    @Args() getCategories: GetCategories,
    @Ctx('user') user: User,
  ): Promise<Category[]> {
    return await this.categoryListProvider.getCategories(getCategories, false, user) as Category[]
  }

  @Query(_returns => PaginatedCategories, { name: 'paginatedCategories' })
  public async getPaginatedCategories(
    @Args() getCategories: GetCategories,
    @Ctx('user') user: User,
  ): Promise<PaginatedCategories> {
    return await this.categoryListProvider.getCategories(getCategories, true, user) as PaginatedCategories
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

  @Authorized()
  @FieldResolver(_returns => Boolean, { name: 'isOwner', nullable: true })
  public async getIsAuthorizedUserOwner(
    @Root() category: Category,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    return user && user.id.toString() === category?.ownerId?.toString()
  }

  @Authorized()
  @FieldResolver(_returns => Boolean, { name: 'isCreator', nullable: true })
  public async getIsAuthorizedUserCreator(
    @Root() category: Category,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    return user && user.id.toString() === category.creatorId.toString()
  }

  @Authorized()
  @Mutation(_returns => Category)
  public async rateCategory(
    @Args() rateCategoryRequest: RateCategoryRequest,
    @Ctx('user') user: User,
  ): Promise<Category> {
    await this.validator.validate(rateCategoryRequest)
    const category = await this.categoryProvider.getCategory(rateCategoryRequest.categoryId)

    await this.categoryRatingMarkCreator.createCategoryRatingMark(category, rateCategoryRequest.mark, user)

    return category
  }

  @Authorized()
  @Query(_returns => [ RatingMark ], { name: 'categoryRatingMarks' })
  public async getCategoryRatingMarks(
    @Args() getCategoryRatingMarksRequest: GetCategoryRatingMarksRequest,
    @Ctx('user') user: User,
  ): Promise<RatingMark[]> {
    await this.validator.validate(getCategoryRatingMarksRequest)
    const categories = await this.categoryListProvider.getCategoriesByIds(getCategoryRatingMarksRequest.categoryIds)

    return await this.categoryRatingMarkLinkProvider.getCategoryRatingMarks(categories, user)
  }

  @FieldResolver(_returns => RatingSchema, { name: 'rating', nullable: true })
  public async getCategoryRating(
    @Root() category: Category,
    @Ctx('user') user: User,
  ): Promise<RatingSchema> {
    return this.categoryRatingProvider.getCategoryRating(category, user)
  }
}