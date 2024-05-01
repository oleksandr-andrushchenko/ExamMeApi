import { ArrayUnique, IsEnum, IsOptional } from 'class-validator'
import Permission from '../../enums/Permission'
import MeSchema from './MeSchema'

export default class UserSchema extends MeSchema {

  @IsOptional()
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  public readonly permissions: Permission[]
}