import { Length } from "class-validator";

export default class CategorySchema {

    @Length(3, 30)
    public readonly name: string;
}