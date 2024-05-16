import { Column, Entity, ObjectIdColumn } from 'typeorm'
import { ObjectId } from 'mongodb'
import { IsDate, IsMongoId, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'
import { Field, Int, ObjectType } from 'type-graphql'
import { GraphQLTimestamp } from 'graphql-scalars'
import { ObjectIdScalar } from '../scalars/ObjectIdScalar'

@ObjectType()
export class ExamQuestion {

  @IsMongoId()
  @Column()
  @Field(_type => ObjectIdScalar)
  public questionId: ObjectId

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
  @Field(_type => ObjectIdScalar)
  public readonly id: ObjectId

  @IsMongoId()
  @Column()
  @Field(_type => ObjectIdScalar)
  public categoryId: ObjectId

  @ValidateNested({ each: true })
  @Column(() => ExamQuestion)
  public questions: ExamQuestion[]

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ default: 0 })
  @Field(_type => Int)
  public questionNumber: number = 0

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column({ default: 0 })
  public correctCount: number = 0

  @IsOptional()
  @IsDate()
  @Column({ nullable: true })
  @Field(_type => GraphQLTimestamp, { nullable: true })
  public completedAt?: Date

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

  @Field(_type => Int)
  public questionsCount(): number {
    return this.getQuestionsCount()
  }

  public getQuestionsCount(): number {
    return this.questions?.length || 0
  }

  @Field(_type => Int)
  public answeredCount(): number {
    return this.getQuestionsAnsweredCount()
  }

  public getQuestionsAnsweredCount(): number {
    return (this?.questions || [])
      .filter((question: ExamQuestion): boolean => typeof question.choice === 'number' || typeof question.answer === 'string')
      .length
  }
}
