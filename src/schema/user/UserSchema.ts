import { IsNotEmpty, IsEmail, IsStrongPassword, IsEnum, IsOptional } from "class-validator";
import { Permission } from "../../type/auth/Permission";

export default class UserSchema {

    @IsNotEmpty()
    public readonly name: string;

    @IsNotEmpty()
    @IsEmail()
    public readonly email: string;

    @IsNotEmpty()
    @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
    public readonly password: string;

    @IsOptional()
    @IsEnum(Permission, { each: true })
    public readonly permissions: Permission[];
}