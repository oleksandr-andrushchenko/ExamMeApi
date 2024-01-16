import { IsNotEmpty, IsEmail } from "class-validator";

export default class UserCredentialsTransfer {
    @IsNotEmpty()
    @IsEmail()
    public email: string;

    @IsNotEmpty()
    public password: string;
}