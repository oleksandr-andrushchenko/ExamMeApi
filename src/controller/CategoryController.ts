import { JsonController, Get } from "routing-controllers";
import { Inject, Service } from "typedi";
import Category from "../entity/Category";
import CategoryRepository from "../repository/CategoryRepository";
import InjectRepository from "../decorator/InjectRepository";
import LoggerInterface from "../logger/LoggerInterface";
import InjectEntityManager, { EntityManagerInterface } from "../decorator/InjectEntityManager";

@Service()
@JsonController('/categories')
export default class CategoryController {

    constructor(
        @InjectRepository() private readonly categoryRepository: CategoryRepository,
        @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
        @Inject('logger') private readonly logger: LoggerInterface,
    ) {
    }

    @Get('/')
    public getAll(): Promise<Category[]> {
        return this.categoryRepository.findAll();
    }
}