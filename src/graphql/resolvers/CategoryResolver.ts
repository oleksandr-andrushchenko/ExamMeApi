import { Inject, Service } from 'typedi'
import CategoryService from '../../service/category/CategoryService'
import { Args, Query, Resolver } from 'type-graphql'
import Category from '../../entity/Category'
import CategoryQuerySchema from '../../schema/category/CategoryQuerySchema'
import GetCategorySchema from '../../schema/category/GetCategorySchema'
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
}