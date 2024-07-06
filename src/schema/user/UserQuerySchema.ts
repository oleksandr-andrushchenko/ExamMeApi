import PaginationSchema from '../pagination/PaginationSchema'
import { IsOptional, IsString } from 'class-validator'
import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class UserQuerySchema extends PaginationSchema {

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  public readonly search?: string
}