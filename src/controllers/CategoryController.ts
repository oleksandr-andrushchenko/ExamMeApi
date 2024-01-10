import { JsonController, Get } from "routing-controllers";
import { Service } from "typedi";

@Service()
@JsonController('/categories')
export default class CategoryController {
    @Get('/')
    public getAll() {
        return [];
    }
}