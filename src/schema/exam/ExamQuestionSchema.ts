import { QuestionDifficulty, QuestionType } from '../../entity/Question'

export default class ExamQuestionSchema {

  public question: string

  public difficulty: QuestionDifficulty

  public type: QuestionType

  public choices: string[]

  public choice: number

  public answer: string
}