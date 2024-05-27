import { Inject, Service } from 'typedi'
import { Arg, Args, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql'
import User from '../entities/User'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import Question from '../entities/Question'
import QuestionService from '../services/question/QuestionService'
import GetQuestionSchema from '../schema/question/GetQuestionSchema'
import QuestionQuerySchema from '../schema/question/QuestionQuerySchema'
import QuestionSchema from '../schema/question/QuestionSchema'
import QuestionUpdateSchema from '../schema/question/QuestionUpdateSchema'
import PaginatedQuestions from '../schema/question/PaginatedQuestions'
import Category from '../entities/Category'
import CategoryService from '../services/category/CategoryService'

@Service()
@Resolver(Question)
export class QuestionResolver {

  public constructor(
    @Inject() private readonly questionService: QuestionService,
    @Inject() private readonly categoryService: CategoryService,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  @Query(_returns => Question, { name: 'question' })
  public async getQuestion(
    @Args() getQuestion: GetQuestionSchema,
  ): Promise<Question> {
    await this.validator.validate(getQuestion)

    return await this.questionService.getQuestion(getQuestion.questionId)
  }

  @Query(_returns => [ Question ], { name: 'questions' })
  public async getQuestions(
    @Args() questionQuery: QuestionQuerySchema,
  ): Promise<Question[]> {
    return await this.questionService.queryQuestions(questionQuery) as Question[]
  }

  @Query(_returns => PaginatedQuestions, { name: 'paginatedQuestions' })
  public async getPaginatedQuestions(
    @Args() questionQuery: QuestionQuerySchema,
  ): Promise<PaginatedQuestions> {
    return await this.questionService.queryQuestions(questionQuery, true) as PaginatedQuestions
  }

  @Authorized()
  @Mutation(_returns => Question)
  public async createQuestion(
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

  @Authorized()
  @Mutation(_returns => Boolean)
  public async removeQuestion(
    @Args() getQuestion: GetQuestionSchema,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    await this.validator.validate(getQuestion)
    const question = await this.questionService.getQuestion(getQuestion.questionId)

    await this.questionService.deleteQuestion(question, user)

    return true
  }

  @FieldResolver(_returns => Category, { name: 'category' })
  public async getQuestionCategory(
    @Root() question: Question,
  ): Promise<Category> {
    return await this.categoryService.getCategory(question.categoryId)
  }
}