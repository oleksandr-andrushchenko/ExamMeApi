import { IsOptional } from "class-validator";

export default class CategoryUpdateSchema {

    @IsOptional()
    public readonly name: string;
}