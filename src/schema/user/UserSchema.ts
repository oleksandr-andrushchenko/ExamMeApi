import { IsEnum, IsOptional } from "class-validator";
import { Permission } from "../../type/auth/Permission";
import MeSchema from "./MeSchema";

export default class UserSchema extends MeSchema {

    @IsOptional()
    @IsEnum(Permission, { each: true })
    public readonly permissions: Permission[];
}