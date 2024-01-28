import { IsNotEmpty, IsEmail } from "class-validator";

export default class AuthSchema {

    @IsNotEmpty()
    @IsEmail()
    public readonly email: string;

    @IsNotEmpty()
    public readonly password: string;
}