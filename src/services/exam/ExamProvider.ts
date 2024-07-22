import { Inject, Service } from 'typedi'
import User from '../../entities/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import Cursor from '../../models/Cursor'
import ExamRepository from '../../repositories/ExamRepository'
import Exam from '../../entities/Exam'
import ExamNotFoundError from '../../errors/exam/ExamNotFoundError'
import ExamQuestionSchema from '../../schema/exam/ExamQuestionSchema'
import QuestionProvider from '../question/QuestionProvider'
import { ObjectId } from 'mongodb'
import AuthorizationFailedError from '../../errors/auth/AuthorizationFailedError'
import GetExams from '../../schema/exam/GetExams'
import ExamQuestionNumberNotFoundError from '../../errors/exam/ExamQuestionNumberNotFoundError'
import ExamPermission from '../../enums/exam/ExamPermission'
import PaginatedExams from '../../schema/exam/PaginatedExams'
import QuestionType from '../../entities/question/QuestionType'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamProvider {

  constructor(
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {Exam} exam
   * @param {number} questionNumber
   * @param {User} initiator
   * @returns {Promise<ExamQuestionSchema>}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionNotFoundError}
   * @throws {ExamQuestionNumberNotFoundError}
   */
  public async getExamQuestion(exam: Exam, questionNumber: number, initiator: User): Promise<ExamQuestionSchema> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.GetQuestion, exam)

    const questions = exam.questions

    if (typeof questions[questionNumber] === 'undefined') {
      throw new ExamQuestionNumberNotFoundError(questionNumber)
    }

    const question = await this.questionProvider.getQuestion(questions[questionNumber].questionId)

    const examQuestion = new ExamQuestionSchema()
    examQuestion.exam = exam
    examQuestion.question = question
    examQuestion.number = questionNumber

    if (question.type === QuestionType.CHOICE) {
      examQuestion.choice = questions[questionNumber].choice
      examQuestion.choices = question.choices.map(choice => choice.title)
    }

    return examQuestion
  }

  /**
   * @param {GetExams} getExams
   * @param {User} initiator
   * @param {boolean} meta
   * @returns {Promise<Exam[] | PaginatedExams>}
   * @throws {ValidatorError}
   */
  public async getExams(
    getExams: GetExams,
    initiator: User,
    meta: boolean = false,
  ): Promise<Exam[] | PaginatedExams> {
    await this.validator.validate(getExams)

    const cursor = new Cursor<Exam>(getExams, this.examRepository)
    const where = {}

    try {
      await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Get)
    } catch (error) {
      if (error instanceof AuthorizationFailedError) {
        where['ownerId'] = initiator.id
      } else {
        throw error
      }
    }

    if ('categoryId' in getExams) {
      where['categoryId'] = new ObjectId(getExams.categoryId)
    }

    if ('completion' in getExams) {
      where['completedAt'] = { $exists: getExams.completion }
    }

    return await cursor.getPaginated({ where, meta })
  }

  /**
   * @param {ObjectId | string} id
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {ExamNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async getExam(id: ObjectId | string, initiator: User): Promise<Exam> {
    if (typeof id === 'string') {
      this.validator.validateId(id)
      id = new ObjectId(id)
    }

    const exam = await this.examRepository.findOneById(id)

    if (!exam) {
      throw new ExamNotFoundError(id)
    }

    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Get, exam)

    if ('correctAnswerCount' in exam && !exam.completedAt) {
      delete exam.correctAnswerCount
    }

    return exam
  }
}