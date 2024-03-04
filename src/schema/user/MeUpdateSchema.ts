import { IsEmail, IsOptional, IsStrongPassword, Length } from "class-validator";

export default class MeUpdateSchema {

  @IsOptional()
  @Length(2, 30)
  public readonly name: string;

  @IsOptional()
  @IsEmail()
  public readonly email: string;

  @IsOptional()
  @Length(5, 15)
  @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
  public readonly password: string;
}