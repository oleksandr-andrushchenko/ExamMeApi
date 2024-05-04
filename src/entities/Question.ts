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
  Length,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { Field, Int, ObjectType } from 'type-graphql'
import { ObjectIdScalar } from '../scalars/ObjectIdScalar'
import { GraphQLTimestamp } from 'graphql-scalars'

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
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  @Field(_type => ObjectIdScalar)
  public readonly id: ObjectId

  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  @Field(_type => ObjectIdScalar)
  public category: ObjectId

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

  @ValidateIf(question => question.type === QuestionType.CHOICE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionChoice)
  @Column(() => QuestionChoice)
  @Field(_type => [ QuestionChoice ], { nullable: true })
  public choices?: QuestionChoice[]

  @ValidateIf(question => question.type === QuestionType.TYPE)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswer)
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

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  public creator: ObjectId

  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  @Field(_type => ObjectIdScalar)
  public owner: ObjectId

  @IsNumber()
  @Column()
  @CreateDateColumn()
  @Transform(({ value }: { value: Date }) => value.getTime())
  @Field(_type => GraphQLTimestamp)
  public created: Date

  @IsOptional()
  @IsNumber()
  @Column({ nullable: true })
  @UpdateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  @Field(_type => GraphQLTimestamp, { nullable: true })
  public updated?: Date

  @Exclude()
  @IsOptional()
  @IsNumber()
  @Column()
  @DeleteDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  public deleted?: Date
}