import { CategoryResolver } from './CategoryResolver'
import { AuthResolver } from './AuthResolver'
import { QuestionResolver } from './QuestionResolver'
import { ExamResolver } from './ExamResolver'
import { MeResolver } from './MeResolver'
import { UserResolver } from './UserResolver'
import { PermissionResolver } from './PermissionResolver'

export const resolvers = [
  AuthResolver,
  CategoryResolver,
  QuestionResolver,
  ExamResolver,
  MeResolver,
  UserResolver,
  PermissionResolver,
]