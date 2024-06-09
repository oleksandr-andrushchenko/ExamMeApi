import { Column, Entity } from 'typeorm'
import { ArrayNotEmpty, ArrayUnique, IsEmail, IsEnum, IsOptional, Length } from 'class-validator'
import Permission from '../enums/Permission'
import { Field, ObjectType } from 'type-graphql'
import Base from './Base'

@ObjectType()
@Entity({ name: 'users' })
export default class User extends Base {

  @IsOptional()
  @Length(2, 30)
  @Column()
  @Field({ nullable: true })
  public name?: string

  @IsEmail()
  @Column({ unique: true })
  @Field()
  public email: string

  @Length(5, 15)
  @Column()
  public password: string

  @ArrayNotEmpty()
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  @Column({ type: 'set', enum: Permission, default: [ Permission.REGULAR ] })
  @Field(_type => [ String! ], { defaultValue: [ Permission.REGULAR ] })
  public permissions: Permission[] = [ Permission.REGULAR ]
}
