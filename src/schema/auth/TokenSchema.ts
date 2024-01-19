import { IsNotEmpty } from "class-validator";

export default class TokenSchema {

    @IsNotEmpty()
    public token: string;

    @IsNotEmpty()
    public expires: number;
}