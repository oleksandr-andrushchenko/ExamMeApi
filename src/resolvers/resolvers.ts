import { CategoryResolver } from './CategoryResolver'
import { AuthResolver } from './AuthResolver'
import { QuestionResolver } from './QuestionResolver'

export const resolvers = [
  AuthResolver,
  CategoryResolver,
  QuestionResolver,
]