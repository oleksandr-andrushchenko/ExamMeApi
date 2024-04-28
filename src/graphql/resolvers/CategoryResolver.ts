import { Inject, Service } from 'typedi'
import CategoryService from '../../service/category/CategoryService'
import { Args, Query, Resolver } from 'type-graphql'
import Category from '../../entity/Category'
import CategoryQuerySchema from '../../schema/category/CategoryQuerySchema'
import GetCategorySchema from '../../schema/category/GetCategorySchema'

@Service()
@Resolver(Category)
export default class CategoryResolver {

  public constructor(
    @Inject() private readonly categoryService: CategoryService,
  ) {
  }

  @Query(_returns => Category)
  public async category(@Args() args: GetCategorySchema): Promise<Category> {
    return await this.categoryService.getCategory(args.categoryId)
  }

  @Query(_returns => [ Category ])
  public async categories(@Args() args: CategoryQuerySchema): Promise<Category[]> {
    return await this.categoryService.queryCategories(args) as Category[]
  }
}