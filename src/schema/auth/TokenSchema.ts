import { IsNumber, IsString } from 'class-validator'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export default class TokenSchema {

  @IsString()
  @Field()
  public token: string

  @IsNumber()
  public expires: number
}