import { Field, Float, Int, ObjectType } from 'type-graphql'
import { IsNumber, Min } from 'class-validator'
import { Column } from 'typeorm'

@ObjectType()
export default class Rating {

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column()
  @Field(_type => Int, { nullable: true })
  public voterCount?: number

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Column()
  @Field(_type => Float, { nullable: true })
  public value?: number
}