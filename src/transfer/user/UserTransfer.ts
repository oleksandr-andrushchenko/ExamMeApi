import { IsNotEmpty, IsEmail, IsStrongPassword } from "class-validator";

export default class UserTransfer {

    @IsNotEmpty()
    public name: string;

    @IsNotEmpty()
    @IsEmail()
    public email: string;

    @IsNotEmpty()
    @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
    public password: string;
}