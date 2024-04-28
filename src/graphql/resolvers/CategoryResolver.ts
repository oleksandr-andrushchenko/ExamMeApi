import { Inject, Service } from 'typedi'
import CategoryService from '../../service/category/CategoryService'
import { Arg, Args, Query, Resolver } from 'type-graphql'
import Category from '../../entity/Category'
import CategoryQuerySchema from '../../schema/category/CategoryQuerySchema'

@Service()
@Resolver(Category)
export default class CategoryResolver {

  public constructor(
    @Inject() private readonly categoryService: CategoryService,
  ) {
  }

  @Query(_returns => Category)
  public async category(@Arg('id') id: string): Promise<Category> {
    return await this.categoryService.getCategory(id)
  }

  @Query(_returns => [ Category ])
  public async categories(@Args() query: CategoryQuerySchema): Promise<Category[]> {
    return await this.categoryService.queryCategories(query) as Category[]
  }
}