import { Field, InputType } from 'type-graphql'
import { IsBoolean, IsOptional, Length } from 'class-validator'
import { Column } from 'typeorm'

@InputType()
export class QuestionChoiceSchema {

  @Length(10, 3000)
  @Column()
  @Field()
  public readonly title: string

  @IsOptional()
  @IsBoolean()
  @Column()
  @Field({ nullable: true })
  public readonly correct?: boolean

  @IsOptional()
  @Length(10, 3000)
  @Column()
  @Field({ nullable: true })
  public readonly explanation?: string
}