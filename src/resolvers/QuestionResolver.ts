import { Inject, Service } from 'typedi'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import User from '../entities/User'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import Question from '../entities/Question'
import QuestionService from '../services/question/QuestionService'
import GetQuestionSchema from '../schema/question/GetQuestionSchema'
import QuestionSchema from '../schema/question/QuestionSchema'

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

  @Authorized()
  @Mutation(_returns => Question)
  public async addQuestion(
    @Arg('question') question: QuestionSchema,
    @Ctx('user') user: User,
  ): Promise<Question> {
    return await this.questionService.createQuestion(question, user)
  }
}