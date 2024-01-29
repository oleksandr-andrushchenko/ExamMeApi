import { IsEnum, IsOptional } from "class-validator";
import { Permission } from "../../type/auth/Permission";
import UserMeSchema from "./UserMeSchema";

export default class UserSchema extends UserMeSchema {

    @IsOptional()
    @IsEnum(Permission, { each: true })
    public readonly permissions: Permission[];
}