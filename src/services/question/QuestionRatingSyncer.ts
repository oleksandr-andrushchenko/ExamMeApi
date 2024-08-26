import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Rating from '../../entities/rating/Rating'
import RatingMarkRepository from '../../repositories/RatingMarkRepository'
import Question from '../../entities/question/Question'

@Service()
export default class QuestionRatingSyncer {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly ratingMarkRepository: RatingMarkRepository,
  ) {
  }

  public async syncQuestionRating(question: Question): Promise<Question> {
    const markCount = await this.ratingMarkRepository.countByQuestion(question)
    const markSum = await this.ratingMarkRepository.sumByQuestion(question)

    question.rating = new Rating()
    question.rating.markCount = markCount
    question.rating.mark = markSum / markCount
    question.updatedAt = new Date()

    await this.entityManager.save<Question>(question)

    return question
  }
}