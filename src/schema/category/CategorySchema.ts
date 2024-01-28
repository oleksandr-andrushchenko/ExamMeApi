import { IsNotEmpty } from "class-validator";

export default class CategorySchema {

    @IsNotEmpty()
    public readonly name: string;
}