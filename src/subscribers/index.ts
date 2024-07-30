import QuestionSubscriber from './QuestionSubscriber'
import UserSubscriber from './UserSubscriber'
import CategoryCreatedEventSubscriber from './category/CategoryCreatedEventSubscriber'

export default [
  CategoryCreatedEventSubscriber,
]

export const subscribers = [
  QuestionSubscriber,
  UserSubscriber,
]