import { IsEmail, Length } from 'class-validator'

export default class AuthSchema {

  @IsEmail()
  public readonly email: string

  @Length(5, 15)
  public readonly password: string
}