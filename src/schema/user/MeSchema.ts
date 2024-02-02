import { IsNotEmpty, IsEmail, IsStrongPassword } from "class-validator";

export default class MeSchema {

    @IsNotEmpty()
    public readonly name: string;

    @IsNotEmpty()
    @IsEmail()
    public readonly email: string;

    @IsNotEmpty()
    @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
    public readonly password: string;
}