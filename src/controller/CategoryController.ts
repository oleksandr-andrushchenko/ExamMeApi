import { JsonController, Get } from "routing-controllers";
import { Inject, Service } from "typedi";
import { Category } from "../entity/Category";
import { CategoryRepository } from "../repository/CategoryRepository";

@Service()
@JsonController('/categories')
export default class CategoryController {

    constructor(
        @Inject() private readonly categoryRepository: CategoryRepository,
    ) {
    }

    @Get('/')
    public getAll(): Promise<Category[]> {
        return this.categoryRepository.findAll();
    }
}