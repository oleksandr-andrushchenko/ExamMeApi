import { CategoryResolver } from './CategoryResolver'
import { AuthResolver } from './AuthResolver'
import { QuestionResolver } from './QuestionResolver'
import { ExamResolver } from './ExamResolver'

export const resolvers = [
  AuthResolver,
  CategoryResolver,
  QuestionResolver,
  ExamResolver,
]