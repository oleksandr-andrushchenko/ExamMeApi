import { ArrayNotEmpty, IsEnum, IsMongoId, Length, ValidateIf, ValidateNested } from "class-validator";
import { QuestionChoice, QuestionDifficulty, QuestionType } from "../../entity/Question";
import { Type } from "class-transformer";

export default class QuestionSchema {

    @IsMongoId()
    public readonly category: string;

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

    @ValidateIf(question => question.type === QuestionType.TYPE)
    @ArrayNotEmpty()
    @Length(2, 10, { each: true })
    public readonly answers: string[];

    @ValidateIf(question => question.type === QuestionType.TYPE)
    @Length(10, 1000)
    public readonly explanation: string;
}