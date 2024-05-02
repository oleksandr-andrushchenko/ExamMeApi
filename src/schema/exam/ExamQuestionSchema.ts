import { QuestionDifficulty, QuestionType } from '../../entities/Question'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export default class ExamQuestionSchema {

  @Field(_type => Int)
  public number: number

  @Field()
  public question: string

  @Field({ nullable: true })
  public difficulty: QuestionDifficulty

  @Field({ nullable: true })
  public type: QuestionType

  @Field(_type => [ String ], { nullable: true })
  public choices?: string[]

  @Field(_type => Int, { nullable: true })
  public choice?: number

  @Field({ nullable: true })
  public answer?: string
}