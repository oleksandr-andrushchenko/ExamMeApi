import { Field, ObjectType } from 'type-graphql'
import { ArrayNotEmpty, IsBoolean, IsOptional, Length } from 'class-validator'
import { Column } from 'typeorm'

@ObjectType()
export default class QuestionAnswer {

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