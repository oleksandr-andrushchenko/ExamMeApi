import { IsNotEmpty, IsEmail, IsStrongPassword, IsEnum, IsArray, IsOptional } from "class-validator";
import { Permission } from "../../type/auth/Permission";

export default class UserSchema {

    @IsNotEmpty()
    public name: string;

    @IsNotEmpty()
    @IsEmail()
    public email: string;

    @IsNotEmpty()
    @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
    public password: string;

    @IsOptional()
    @IsEnum(Permission, { each: true })
    public permissions: Permission[];
}