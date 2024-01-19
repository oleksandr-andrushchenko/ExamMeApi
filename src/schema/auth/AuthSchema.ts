import { IsNotEmpty, IsEmail } from "class-validator";

export default class AuthSchema {

    @IsNotEmpty()
    @IsEmail()
    public email: string;

    @IsNotEmpty()
    public password: string;
}