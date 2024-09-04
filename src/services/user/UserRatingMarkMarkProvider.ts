import { Service } from 'typedi'
import { ObjectId } from 'mongodb'

@Service()
export default class UserRatingMarkMarkProvider {

  public getUserRatingMarkMark(ratingMarks: ObjectId[][], objectId: ObjectId): number | undefined {
    if (!Array.isArray(ratingMarks)) {
      return undefined
    }

    for (let index = 0; index < 5; index++) {
      const ratingMarkArray = ratingMarks[index]

      if (Array.isArray(ratingMarkArray) && ratingMarkArray.includes(objectId)) {
        return index + 1
      }
    }

    return undefined
  }
}
