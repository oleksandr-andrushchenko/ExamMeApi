import { Field, InputType } from 'type-graphql'
import { ArrayNotEmpty, IsBoolean, IsOptional, Length } from 'class-validator'
import { Column } from 'typeorm'

@InputType()
export class QuestionAnswerSchema {

  @ArrayNotEmpty()
  @Length(2, 10, { each: true })
  @Column()
  @Field(_type => [ String! ])
  public readonly variants: string[]

  @IsBoolean()
  @Column()
  @Field()
  public readonly correct: boolean

  @IsOptional()
  @Length(10, 3000)
  @Column()
  @Field()
  public readonly explanation: string
}