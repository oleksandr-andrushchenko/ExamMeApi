import { IsMongoId } from 'class-validator'

export default class CreateExamSchema {

  @IsMongoId()
  public readonly category: string
}