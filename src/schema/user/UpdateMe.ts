import { IsEmail, IsOptional, IsStrongPassword, Length } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
export default class UpdateMe {

  @IsOptional()
  @Length(2, 30)
  @Field({ nullable: true })
  public readonly name?: string

  @IsOptional()
  @IsEmail()
  @Field({ nullable: true })
  public readonly email?: string

  @IsOptional()
  @Length(5, 15)
  @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
  @Field({ nullable: true })
  public readonly password?: string
}