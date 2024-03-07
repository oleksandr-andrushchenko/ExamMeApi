import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn, } from 'typeorm'
import { Exclude, Transform, Type } from 'class-transformer'
import { ObjectId } from 'mongodb'
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  Length,
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

  @Length(3, 1000)
  @Column({ nullable: false })
  private title: string

  @IsBoolean()
  @Column({ nullable: false })
  private correct: boolean

  @IsOptional()
  @Length(10, 1000)
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

@Entity({ name: 'questions' })
export default class Question {

  @IsMongoId()
  @ObjectIdColumn()
  @Transform((params: { value: ObjectId }) => params.value.toString())
  private id: ObjectId

  @IsMongoId()
  @Column()
  @Transform((params: { value: ObjectId }) => params.value?.toString())
  private category: ObjectId

  @IsEnum(QuestionType)
  @Column({ type: 'enum', enum: QuestionType, nullable: false })
  private type: QuestionType

  @IsEnum(QuestionDifficulty)
  @Column({ type: 'enum', enum: QuestionDifficulty, nullable: false })
  private difficulty: QuestionDifficulty

  @Length(50, 3000)
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
  @Length(2, 10, { each: true })
  @Column()
  private answers: string[]

  @ValidateIf(question => question.type === QuestionType.TYPE)
  @Length(10, 1000)
  @Column()
  private explanation: string

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform((params: { value: ObjectId }) => params.value?.toString())
  private creator: ObjectId

  @IsNumber()
  @Column()
  @CreateDateColumn()
  @Transform((params: { value: Date }) => params.value?.getTime())
  private created: Date

  @IsOptional()
  @IsNumber()
  @Column()
  @UpdateDateColumn()
  @Transform((params: { value: Date }) => params.value?.getTime())
  private updated: Date

  @Exclude()
  @IsOptional()
  @IsNumber()
  @Column()
  @DeleteDateColumn()
  @Transform((params: { value: Date }) => params.value?.getTime())
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

  public setAnswers(answers: string[] | undefined): this {
    this.answers = answers

    return this
  }

  public getAnswers(): string[] | undefined {
    return this.answers
  }

  public setExplanation(explanation: string | undefined): this {
    this.explanation = explanation

    return this
  }

  public getExplanation(): string | undefined {
    return this.explanation
  }

  public setCreator(creator: ObjectId): this {
    this.creator = creator

    return this
  }

  public getCreator(): ObjectId {
    return this.creator
  }
}