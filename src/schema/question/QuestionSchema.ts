import { ArrayNotEmpty, IsEnum, IsNotEmpty, ValidateIf, ValidateNested } from "class-validator";
import { QuestionChoice, QuestionDifficulty, QuestionType } from "../../entity/Question";
import { Type } from "class-transformer";

export default class QuestionSchema {

    @IsNotEmpty()
    @IsEnum(QuestionType)
    public readonly type: QuestionType;

    @IsNotEmpty()
    @IsEnum(QuestionDifficulty)
    public readonly difficulty: QuestionDifficulty;

    @IsNotEmpty()
    public readonly title: string;

    @ValidateIf(question => question.type === QuestionType.CHOICE)
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => QuestionChoice)
    public readonly choices: QuestionChoice[];
}