import { Column, Entity } from 'typeorm'
import { ArrayNotEmpty, ArrayUnique, IsEmail, IsEnum, IsOptional, Length } from 'class-validator'
import Permission from '../enums/Permission'
import { Authorized, Field, ObjectType } from 'type-graphql'
import Base from './Base'
import UserPermission from '../enums/user/UserPermission'

@ObjectType()
@Entity({ name: 'users' })
export default class User extends Base {

  @IsOptional()
  @Length(2, 30)
  @Column()
  @Field({ nullable: true })
  public name?: string

  @Authorized(UserPermission.GetEmail)
  @IsEmail()
  @Column({ unique: true })
  @Field({ nullable: true })
  public email?: string

  @Length(5, 15)
  @Column()
  public password: string

  @Authorized(UserPermission.GetPermissions)
  @ArrayNotEmpty()
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  @Column({ type: 'set', enum: Permission, default: [ Permission.Regular ] })
  @Field(_type => [ String! ], { nullable: true, defaultValue: [ Permission.Regular ] })
  public permissions?: Permission[] = [ Permission.Regular ]
}
