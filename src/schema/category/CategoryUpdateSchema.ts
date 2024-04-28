import { IsNumber, IsOptional, Length, Max, Min } from 'class-validator'
import { Field, InputType, Int } from 'type-graphql'

@InputType()
export default class CategoryUpdateSchema {

  @IsOptional()
  @Length(3, 30)
  @Field({ nullable: true })
  public readonly name?: string

  @IsOptional()
  @Min(0)
  @Max(100)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Field(_type => Int, { nullable: true })
  public readonly requiredScore?: number = 0
}