import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from 'typeorm'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { ObjectId } from 'mongodb'
import { IsDate, IsMongoId, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'
import { Field, Int, ObjectType } from 'type-graphql'
import { GraphQLTimestamp } from 'graphql-scalars'
import { ObjectIdScalar } from '../scalars/ObjectIdScalar'

@ObjectType()
export class ExamQuestion {

  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value.toString())
  @Field(_type => ObjectIdScalar)
  public question: ObjectId

  @IsOptional()
  @IsNumber()
  @Column({ nullable: true })
  @Field(_type => Int, { nullable: true })
  public choice?: number

  @IsOptional()
  @IsString()
  @Column({ nullable: true })
  @Field({ nullable: true })
  public answer?: string
}

@ObjectType()
@Entity({ name: 'exams' })
export default class Exam {

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

  @Exclude()
  @ValidateNested({ each: true })
  @Type(() => ExamQuestion)
  @Column(() => ExamQuestion)
  @Field(_type => [ ExamQuestion ])
  public questions: ExamQuestion[]

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ default: 0 })
  @Field(_type => Int)
  public questionNumber: number = 0

  @Exclude()
  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ default: 0 })
  @Field(_type => Int)
  public correctCount: number = 0

  @IsOptional()
  @IsDate()
  @Column()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  @Field(_type => GraphQLTimestamp, { nullable: true })
  public completed?: Date

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  @Field(_type => ObjectIdScalar)
  public creator: ObjectId

  @Exclude()
  @IsMongoId()
  @Column()
  @Transform(({ value }: { value: ObjectId }) => value?.toString())
  @Field(_type => ObjectIdScalar)
  public owner: ObjectId

  @IsNumber()
  @Column()
  @CreateDateColumn()
  @Transform(({ value }: { value: Date }) => value?.getTime())
  @Field(_type => GraphQLTimestamp)
  public created: Date

  @IsOptional()
  @IsNumber()
  @Column()
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
  @Field(_type => GraphQLTimestamp, { nullable: true })
  public deleted?: Date

  @Expose({ name: 'questionsCount' })
  @Field(_type => Int)
  public getQuestionsCount(): number {
    return this.questions?.length || 0
  }

  @Expose({ name: 'answeredCount' })
  @Field(_type => Int)
  public getQuestionsAnsweredCount(): number {
    return (this?.questions || [])
      .filter((question: ExamQuestion): boolean => typeof question.choice === 'number' || typeof question.answer === 'string')
      .length
  }
}
