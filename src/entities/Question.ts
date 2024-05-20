import { Column, Entity, ObjectIdColumn } from 'typeorm'
import { ObjectId } from 'mongodb'
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  Length,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { Authorized, Field, Int, ObjectType } from 'type-graphql'
import { ObjectIdScalar } from '../scalars/ObjectIdScalar'
import { GraphQLTimestamp } from 'graphql-scalars'
import QuestionPermission from '../enums/question/QuestionPermission'

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

@ObjectType()
export class QuestionChoice {

  @Length(10, 3000)
  @Column()
  @Field()
  public title: string

  @IsBoolean()
  @Column()
  @Field({ nullable: true })
  public correct?: boolean

  @IsOptional()
  @Length(10, 3000)
  @Column()
  @Field({ nullable: true })
  public explanation?: string
}

@ObjectType()
export class QuestionAnswer {

  @ArrayNotEmpty()
  @Length(2, 10, { each: true })
  @Column()
  @Field(_type => [ String! ])
  public variants: string[]

  @IsBoolean()
  @Column()
  @Field({ nullable: true })
  public correct?: boolean

  @IsOptional()
  @Length(10, 3000)
  @Column()
  @Field({ nullable: true })
  public explanation?: string
}

@ObjectType()
@Entity({ name: 'questions' })
export default class Question {

  @IsMongoId()
  @ObjectIdColumn()
  @Field(_type => ObjectIdScalar)
  public readonly id: ObjectId

  @IsMongoId()
  @Column()
  @Field(_type => ObjectIdScalar)
  public categoryId: ObjectId

  @IsEnum(QuestionType)
  @Column({ type: 'enum', enum: QuestionType })
  @Field()
  public type: QuestionType

  @IsEnum(QuestionDifficulty)
  @Column({ type: 'enum', enum: QuestionDifficulty })
  @Field()
  public difficulty: QuestionDifficulty

  @Length(10, 3000)
  @Column({ unique: true })
  @Field()
  public title: string

  @Authorized(QuestionPermission.READ_CHOICES)
  @ValidateIf(question => question.type === QuestionType.CHOICE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Column(() => QuestionChoice)
  @Field(_type => [ QuestionChoice ], { nullable: true })
  public choices?: QuestionChoice[]

  @Authorized(QuestionPermission.READ_ANSWERS)
  @ValidateIf(question => question.type === QuestionType.TYPE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Column(() => QuestionAnswer)
  @Field(_type => [ QuestionAnswer ], { nullable: true })
  public answers?: QuestionAnswer[]

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ nullable: true, default: 0 })
  @Field(_type => Int, { nullable: true })
  public voters?: number = 0

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Column({ nullable: true, default: 0 })
  @Field(_type => Int, { nullable: true })
  public rating?: number = 0

  @IsMongoId()
  @Column()
  public creatorId: ObjectId

  @IsMongoId()
  @Column()
  @Field(_type => ObjectIdScalar)
  public ownerId: ObjectId

  @IsNumber()
  @Column({ update: false })
  @Field(_type => GraphQLTimestamp)
  public createdAt: Date

  @IsOptional()
  @IsNumber()
  @Column({ nullable: true, insert: false })
  @Field(_type => GraphQLTimestamp, { nullable: true })
  public updatedAt?: Date

  @IsOptional()
  @IsNumber()
  @Column({ nullable: true, insert: false })
  public deletedAt?: Date
}