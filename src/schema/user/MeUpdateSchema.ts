import { IsEmail, IsStrongPassword, IsOptional } from "class-validator";

export default class MeUpdateSchema {

    @IsOptional()
    public readonly name: string;

    @IsOptional()
    @IsEmail()
    public readonly email: string;

    @IsOptional()
    @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
    public readonly password: string;
}