import { IsNumber, IsString } from 'class-validator'

export default class TokenSchema {

  @IsString()
  public token: string

  @IsNumber()
  public expires: number
}