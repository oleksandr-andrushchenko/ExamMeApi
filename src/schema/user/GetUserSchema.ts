import { IsMongoId } from 'class-validator'

export default class GetUserSchema {

  @IsMongoId()
  public readonly userId: string
}