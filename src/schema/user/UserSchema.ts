import { ArrayUnique, IsEnum, IsOptional } from 'class-validator'
import Permission from '../../enums/Permission'
import MeSchema from './MeSchema'
import { Field, InputType } from 'type-graphql'

@InputType()
export default class UserSchema extends MeSchema {

  @IsOptional()
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  @Field(_type => [ String ])
  public readonly permissions?: Permission[] = [ Permission.REGULAR ]
}