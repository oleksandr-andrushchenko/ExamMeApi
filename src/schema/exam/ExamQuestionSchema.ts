import { QuestionDifficulty, QuestionType } from '../../entities/Question'

export default class ExamQuestionSchema {

  public number: number

  public question: string

  public difficulty: QuestionDifficulty

  public type: QuestionType

  public choices: string[]

  public choice: number

  public answer: string
}