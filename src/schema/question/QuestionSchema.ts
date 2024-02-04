import { ArrayNotEmpty, IsEnum, Length, ValidateIf, ValidateNested } from "class-validator";
import { QuestionChoice, QuestionDifficulty, QuestionType } from "../../entity/Question";
import { Type } from "class-transformer";

export default class QuestionSchema {

    @IsEnum(QuestionType)
    public readonly type: QuestionType;

    @IsEnum(QuestionDifficulty)
    public readonly difficulty: QuestionDifficulty;

    @Length(50, 3000)
    public readonly title: string;

    @ValidateIf(question => question.type === QuestionType.CHOICE)
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => QuestionChoice)
    public readonly choices: QuestionChoice[];
}