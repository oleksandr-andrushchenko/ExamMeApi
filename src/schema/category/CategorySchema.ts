import { IsNotEmpty } from "class-validator";

export default class CategorySchema {

    @IsNotEmpty()
    public name: string;
}