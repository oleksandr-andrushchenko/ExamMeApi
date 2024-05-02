import { Inject, Service } from 'typedi'
import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql'
import User from '../entities/User'
import Question from '../entities/Question'
import QuestionService from '../services/question/QuestionService'
import QuestionSchema from '../schema/question/QuestionSchema'

@Service()
@Resolver(Question)
export class QuestionResolver {

  public constructor(
    @Inject() private readonly questionService: QuestionService,
  ) {
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