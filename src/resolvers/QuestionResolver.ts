import { Inject, Service } from 'typedi'
import { Arg, Args, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql'
import User from '../entities/User'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import Question from '../entities/Question'
import QuestionService from '../services/question/QuestionService'
import GetQuestion from '../schema/question/GetQuestion'
import GetQuestions from '../schema/question/GetQuestions'
import CreateQuestion from '../schema/question/CreateQuestion'
import UpdateQuestion from '../schema/question/UpdateQuestion'
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
    @Args() getQuestion: GetQuestion,
  ): Promise<Question> {
    await this.validator.validate(getQuestion)

    return await this.questionService.getQuestion(getQuestion.questionId)
  }

  @Query(_returns => [ Question ], { name: 'questions' })
  public async getQuestions(
    @Args() getQuestions: GetQuestions,
  ): Promise<Question[]> {
    return await this.questionService.getQuestions(getQuestions) as Question[]
  }

  @Query(_returns => PaginatedQuestions, { name: 'paginatedQuestions' })
  public async getPaginatedQuestions(
    @Args() getQuestions: GetQuestions,
  ): Promise<PaginatedQuestions> {
    return await this.questionService.getQuestions(getQuestions, true) as PaginatedQuestions
  }

  @Authorized()
  @Mutation(_returns => Question)
  public async createQuestion(
    @Arg('createQuestion') question: CreateQuestion,
    @Ctx('user') user: User,
  ): Promise<Question> {
    return await this.questionService.createQuestion(question, user)
  }

  @Authorized()
  @Mutation(_returns => Question)
  public async updateQuestion(
    @Args() getQuestion: GetQuestion,
    @Arg('updateQuestion') updateQuestion: UpdateQuestion,
    @Ctx('user') user: User,
  ): Promise<Question> {
    await this.validator.validate(getQuestion)
    const question = await this.questionService.getQuestion(getQuestion.questionId)

    return await this.questionService.updateQuestion(question, updateQuestion, user)
  }

  @Authorized()
  @Mutation(_returns => Boolean)
  public async deleteQuestion(
    @Args() getQuestion: GetQuestion,
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