import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from 'typeorm'
import { Exclude, Transform, Type } from 'class-transformer'
import { ObjectId } from 'mongodb'
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  Length, Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator'

export enum QuestionType {
  TYPE = 'type',
  CHOICE = 'choice',
}

export enum QuestionDifficulty {
  EASY = 'easy',
  MODERATE = 'moderate',
  DIFFICULT = 'difficult',
  EXPERT = 'expert',
}

export class QuestionChoice {

  @Length(10, 3000)
  @Column({ nullable: false })
  private title: string

  @IsBoolean()
  @Column({ nullable: false })
  private correct: boolean

  @IsOptional()
  @Length(10, 3000)
  @Column()
  private explanation: string

  public setTitle(title: string): this {
    this.title = title

    return this
  }

  public getTitle(): string {
    return this.title
  }

  public setIsCorrect(isCorrect: boolean): this {
    this.correct = isCorrect

    return this
  }

  public isCorrect(): boolean {
    return this.correct
  }

  public setExplanation(explanation: string | undefined): this {
    this.explanation = explanation

    return this
  }

  public getExplanation(): string | undefined {
    return this.explanation
  }
}

export class QuestionAnswer {

  @ArrayNotEmpty()
  @Length(2, 10, { each: true })
  @Column()
  private variants: string[]

  @IsBoolean()
  @Column({ nullable: false })
  private correct: boolean

  @IsOptional()
  @Length(10, 3000)
  @Column()
  private explanation: string

  public setVariants(variants: string[]): this {
    this.variants = variants

    return this
  }

  public getVariants(): string[] {
    return this.variants
  }

  public setIsCorrect(isCorrect: boolean): this {
    this.correct = isCorrect

    return this
  }

  public isCorrect(): boolean {
    return this.correct
  }

  public setExplanation(explanation: string | undefined): this {
    this.explanation = explanation

    return this
  }

  public getExplanation(): string | undefined {
    return this.explanation
  }
}

@Entity({ name: 'questions' })
export default class Question {

  @IsMongoId()
  @ObjectIdColumn()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  private id: ObjectId

  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  private category: ObjectId

  @IsEnum(QuestionType)
  @Column({ type: 'enum', enum: QuestionType, nullable: false })
  private type: QuestionType

  @IsEnum(QuestionDifficulty)
  @Column({ type: 'enum', enum: QuestionDifficulty, nullable: false })
  private difficulty: QuestionDifficulty

  @Length(10, 3000)
  @Column({ unique: true, nullable: false })
  private title: string

  @ValidateIf(question => question.type === QuestionType.CHOICE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionChoice)
  @Column(() => QuestionChoice)
  private choices: QuestionChoice[]

  @ValidateIf(question => question.type === QuestionType.TYPE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswer)
  @Column(() => QuestionAnswer)
  private answers: QuestionAnswer[]

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ nullable: false })
  private voters: number = 0

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Column({ nullable: false })
  private rating: number = 0

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  private creator: ObjectId

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  private owner: ObjectId

  @IsNumber()
  @Column()
  @CreateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  private created: Date

  @IsOptional()
  @IsNumber()
  @Column()
  @UpdateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  private updated: Date

  @Exclude()
  @IsOptional()
  @IsNumber()
  @Column()
  @DeleteDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  private deleted: Date

  public getId(): ObjectId {
    return this.id
  }

  public setCategory(category: ObjectId): this {
    this.category = category

    return this
  }

  public getCategory(): ObjectId {
    return this.category
  }

  public setType(type: QuestionType): this {
    this.type = type

    return this
  }

  public getType(): QuestionType {
    return this.type
  }

  public setDifficulty(difficulty: QuestionDifficulty): this {
    this.difficulty = difficulty

    return this
  }

  public getDifficulty(): QuestionDifficulty {
    return this.difficulty
  }

  public setTitle(title: string): this {
    this.title = title

    return this
  }

  public getTitle(): string {
    return this.title
  }

  public setChoices(choices: QuestionChoice[] | undefined): this {
    this.choices = choices

    return this
  }

  public getChoices(): QuestionChoice[] | undefined {
    return this.choices
  }

  public setAnswers(answers: QuestionAnswer[] | undefined): this {
    this.answers = answers

    return this
  }

  public getAnswers(): QuestionAnswer[] | undefined {
    return this.answers
  }

  public setCreator(creator: ObjectId): this {
    this.creator = creator

    return this
  }

  public getCreator(): ObjectId {
    return this.creator
  }

  public setOwner(owner: ObjectId): this {
    this.owner = owner

    return this
  }

  public getOwner(): ObjectId {
    return this.owner
  }
}