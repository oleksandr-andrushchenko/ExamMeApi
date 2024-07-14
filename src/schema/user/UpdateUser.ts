import { ArrayUnique, IsEmail, IsEnum, IsOptional, Length } from 'class-validator'
import { Field, InputType } from 'type-graphql'
import Permission from '../../enums/Permission'

@InputType()
export default class UpdateUser {

  @IsOptional()
  @Length(2, 30)
  @Field({ nullable: true })
  public readonly name?: string

  @IsOptional()
  @IsEmail()
  @Field({ nullable: true })
  public readonly email?: string

  @IsOptional()
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  @Field(_type => [ String ], { nullable: true })
  public readonly permissions?: Permission[] = [ Permission.REGULAR ]
}