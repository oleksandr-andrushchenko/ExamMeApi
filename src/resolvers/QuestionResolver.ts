import { Inject, Service } from 'typedi'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import User from '../entities/User'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import Question from '../entities/Question'
import QuestionService from '../services/question/QuestionService'
import GetQuestionSchema from '../schema/question/GetQuestionSchema'
import QuestionQuerySchema from '../schema/question/QuestionQuerySchema'
import QuestionSchema from '../schema/question/QuestionSchema'
import QuestionUpdateSchema from '../schema/question/QuestionUpdateSchema'

@Service()
@Resolver(Question)
export class QuestionResolver {

  public constructor(
    @Inject() private readonly questionService: QuestionService,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  @Query(_returns => Question)
  public async question(
    @Args() getQuestion: GetQuestionSchema,
  ): Promise<Question> {
    await this.validator.validate(getQuestion)

    return await this.questionService.getQuestion(getQuestion.questionId)
  }

  @Query(_returns => [ Question ])
  public async questions(
    @Args() questionQuery: QuestionQuerySchema,
  ): Promise<Question[]> {
    return await this.questionService.queryQuestions(questionQuery) as Question[]
  }

  @Authorized()
  @Mutation(_returns => Question)
  public async addQuestion(
    @Arg('question') question: QuestionSchema,
    @Ctx('user') user: User,
  ): Promise<Question> {
    return await this.questionService.createQuestion(question, user)
  }

  @Authorized()
  @Mutation(_returns => Question)
  public async updateQuestion(
    @Args() getQuestion: GetQuestionSchema,
    @Arg('questionUpdate') questionUpdate: QuestionUpdateSchema,
    @Ctx('user') user: User,
  ): Promise<Question> {
    await this.validator.validate(getQuestion)
    const question = await this.questionService.getQuestion(getQuestion.questionId)

    return await this.questionService.updateQuestion(question, questionUpdate, user)
  }
}