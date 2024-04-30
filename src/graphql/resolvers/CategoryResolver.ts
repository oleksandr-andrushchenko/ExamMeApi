import { Inject, Service } from 'typedi'
import CategoryService from '../../service/category/CategoryService'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import Category from '../../entity/Category'
import CategoryQuerySchema from '../../schema/category/CategoryQuerySchema'
import GetCategorySchema from '../../schema/category/GetCategorySchema'
import CategorySchema from '../../schema/category/CategorySchema'
import User from '../../entity/User'
import CategoryUpdateSchema from '../../schema/category/CategoryUpdateSchema'
import ValidatorInterface from '../../service/validator/ValidatorInterface'

@Service()
@Resolver(Category)
export class CategoryResolver {

  public constructor(
    @Inject() private readonly categoryService: CategoryService,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  @Query(_returns => Category)
  public async category(
    @Args() getCategory: GetCategorySchema,
  ): Promise<Category> {
    await this.validator.validate(getCategory)

    return await this.categoryService.getCategory(getCategory.categoryId)
  }

  @Query(_returns => [ Category ])
  public async categories(
    @Args() categoryQuery: CategoryQuerySchema,
  ): Promise<Category[]> {
    return await this.categoryService.queryCategories(categoryQuery) as Category[]
  }

  @Authorized()
  @Mutation(_returns => Category)
  public async addCategory(
    @Arg('category') category: CategorySchema,
    @Ctx('user') user: User,
  ): Promise<Category> {
    return await this.categoryService.createCategory(category, user)
  }

  @Authorized()
  @Mutation(_returns => Category)
  public async updateCategory(
    @Args() getCategory: GetCategorySchema,
    @Arg('categoryUpdate') categoryUpdate: CategoryUpdateSchema,
    @Ctx('user') user: User,
  ): Promise<Category> {
    await this.validator.validate(getCategory)
    const category = await this.categoryService.getCategory(getCategory.categoryId)

    return await this.categoryService.updateCategory(category, categoryUpdate, user)
  }

  @Authorized()
  @Mutation(_returns => Boolean)
  public async removeCategory(
    @Args() getCategory: GetCategorySchema,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    await this.validator.validate(getCategory)
    const category = await this.categoryService.getCategory(getCategory.categoryId)

    await this.categoryService.deleteCategory(category, user)

    return true
  }
}