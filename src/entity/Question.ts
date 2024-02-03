import {
    Entity,
    ObjectIdColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn
} from "typeorm";
import { Exclude, Expose, Transform, Type } from "class-transformer";
import { ObjectId } from "mongodb";
import { ArrayNotEmpty, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";

export enum QuestionType {
    RAW = 'raw',
    CHOICE = 'choice',
}

export enum QuestionDifficulty {
    EASY = 'easy',
    MODERATE = 'moderate',
    DIFFICULT = 'difficult',
    EXPERT = 'expert',
}

export class QuestionChoice {

    @IsNotEmpty()
    @Column({ nullable: false })
    private title: string;

    @IsNotEmpty()
    @Column({ nullable: false })
    private correct: boolean;

    @IsOptional()
    @IsString()
    @Column()
    private explanation: string;

    public setTitle(title: string): this {
        this.title = title;

        return this;
    }

    public getTitle(): string {
        return this.title;
    }

    public setIsCorrect(isCorrect: boolean): this {
        this.correct = isCorrect;

        return this;
    }

    public isCorrect(): boolean {
        return this.correct;
    }
}

@Entity({ name: 'questions' })
export default class Question {

    @ObjectIdColumn()
    @Expose({ name: 'id' })
    @Transform((params: { value: ObjectId }) => params.value.toString())
    private _id: ObjectId;

    @Exclude()
    @Column()
    @Transform((params: { value: ObjectId }) => params.value?.toString())
    private category: ObjectId;

    @IsNotEmpty()
    @IsEnum(QuestionType)
    @Column({ type: 'enum', enum: QuestionType, nullable: false })
    private type: QuestionType;

    @IsNotEmpty()
    @IsEnum(QuestionDifficulty)
    @Column({ type: 'enum', enum: QuestionDifficulty, nullable: false })
    private difficulty: QuestionDifficulty;

    @IsNotEmpty()
    @Column({ unique: true, nullable: false })
    private title: string;

    @ValidateIf(question => question.type === QuestionType.CHOICE)
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => QuestionChoice)
    @Column(() => QuestionChoice)
    private choices: QuestionChoice[];

    @Exclude()
    @Column()
    @Transform((params: { value: ObjectId }) => params.value?.toString())
    private creator: ObjectId;

    @Column()
    @CreateDateColumn()
    private created: Date;

    @Column()
    @UpdateDateColumn()
    private updated: Date;

    @Column()
    @DeleteDateColumn()
    private deleted: Date;

    public getId(): ObjectId {
        return this._id;
    }

    public setCategory(category: ObjectId): this {
        this.category = category;

        return this;
    }

    public getCategory(): ObjectId {
        return this.category;
    }

    public setType(type: QuestionType): this {
        this.type = type;

        return this;
    }

    public getType(): QuestionType {
        return this.type;
    }

    public setDifficulty(difficulty: QuestionDifficulty): this {
        this.difficulty = difficulty;

        return this;
    }

    public getDifficulty(): QuestionDifficulty {
        return this.difficulty;
    }

    public setTitle(title: string): this {
        this.title = title;

        return this;
    }

    public getTitle(): string {
        return this.title;
    }

    public setChoices(choices: QuestionChoice[]): this {
        this.choices = choices;

        return this;
    }

    public getChoices(): QuestionChoice[] {
        return this.choices;
    }

    public setCreator(creator: ObjectId): this {
        this.creator = creator;

        return this;
    }

    public getCreator(): ObjectId {
        return this.creator;
    }
}