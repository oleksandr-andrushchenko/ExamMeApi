import { IsEmail, IsOptional, IsStrongPassword, Length } from 'class-validator'

export default class MeSchema {

  @IsOptional()
  @Length(2, 30)
  public readonly name: string

  @IsEmail()
  public readonly email: string

  @Length(5, 15)
  @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
  public readonly password: string
}