import PaginationSchema from '../pagination/PaginationSchema'
import { IsIn, IsOptional, IsString } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class CategoryQuerySchema extends PaginationSchema {

  @IsOptional()
  @IsIn([ 'free', 'subscription' ])
  @Field({ nullable: true })
  public readonly price?: string

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  public readonly search?: string
}