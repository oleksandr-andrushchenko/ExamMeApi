import { Field, Float, Int, ObjectType } from 'type-graphql'
import { IsNumber, Max, Min } from 'class-validator'
import { Column } from 'typeorm'

@ObjectType()
export default class Rating {

  @Min(0)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Column()
  @Field(_type => Int)
  public markCount: number

  @Min(1)
  @Max(5)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Column()
  @Field(_type => Float)
  public mark: number
}