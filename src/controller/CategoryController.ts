import { JsonController, Get } from "routing-controllers";
import { Inject, Service } from "typedi";
import { Category } from "../entity/Category";
import { CategoryRepository } from "../repository";

@Service()
@JsonController('/categories')
export default class CategoryController {

    constructor(
        @Inject('category_repository') private readonly categoryRepository: CategoryRepository,
    ) {
    }

    @Get('/')
    public getAll(): Promise<Category[]> {
        return this.categoryRepository.findAll();
    }
}