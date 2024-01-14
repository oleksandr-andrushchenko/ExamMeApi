import { Controller, Get } from "routing-controllers";
import { Service } from "typedi";

@Service()
@Controller()
export default class IndexController {

    @Get('/')
    public getIndex(): string {
        return 'Hello World';
    }

}