import { IsMongoId } from 'class-validator'

export default class GetQuestionSchema {

  @IsMongoId()
  public readonly questionId: string
}