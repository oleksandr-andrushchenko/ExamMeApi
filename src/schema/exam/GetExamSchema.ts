import { IsMongoId } from 'class-validator'

export default class GetExamSchema {

  @IsMongoId()
  public readonly examId: string
}