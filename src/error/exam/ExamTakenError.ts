import Exam from '../../entity/Exam'

export default class ExamTakenError extends Error {

  public constructor(exam: Exam) {
    super(`Exam "${ exam.category.toString() }" is already taken`)
  }
}