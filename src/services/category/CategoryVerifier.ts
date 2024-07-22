import { Inject, Service } from 'typedi'
import CategoryRepository from '../../repositories/CategoryRepository'
import CategoryNameTakenError from '../../errors/category/CategoryNameTakenError'
import { ObjectId } from 'mongodb'

@Service()
export default class CategoryVerifier {

  public constructor(
    @Inject() private readonly categoryRepository: CategoryRepository,
  ) {
  }

  /**
   * @param {string} name
   * @param {ObjectId} ignoreId
   * @returns {Promise<void>}
   * @throws {CategoryNameTakenError}
   */
  public async verifyCategoryNameNotExists(name: string, ignoreId: ObjectId = undefined): Promise<void> {
    const category = await this.categoryRepository.findOneByName(name)

    if (!category) {
      return
    }

    if (ignoreId && category.id.toString() === ignoreId.toString()) {
      return
    }

    throw new CategoryNameTakenError(name)
  }
}