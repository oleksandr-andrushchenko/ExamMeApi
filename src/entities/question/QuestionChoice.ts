import { Field, ObjectType } from 'type-graphql'
import { IsBoolean, IsOptional, Length } from 'class-validator'
import { Column } from 'typeorm'

@ObjectType()
export default class QuestionChoice {

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