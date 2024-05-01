import { ObjectIdScalar } from './scalars/ObjectIdScalar'
import { ObjectId } from 'mongodb'

export const scalars = [
  { type: ObjectId, scalar: ObjectIdScalar },
]