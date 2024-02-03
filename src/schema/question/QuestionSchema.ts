import { IsArray, IsDefined, IsEnum, IsNotEmpty, ValidateIf, ValidateNested } from "class-validator";
import { QuestionChoice, QuestionDifficulty, QuestionType } from "../../entity/Question";
import { Permission } from "../../type/auth/Permission";

export default class QuestionSchema {

    @IsNotEmpty()
    @IsEnum(QuestionType)
    public readonly type: QuestionType;

    @IsNotEmpty()
    @IsEnum(QuestionDifficulty)
    public readonly difficulty: QuestionDifficulty;

    @IsNotEmpty()
    public readonly title: string;

    @ValidateIf(o => o.type === QuestionType.CHOICE)
    @IsNotEmpty()
    @ValidateNested()
    public readonly choices: QuestionChoice[];
}