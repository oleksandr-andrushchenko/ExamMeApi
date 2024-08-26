import QuestionSubscriber from './QuestionSubscriber'
import UserSubscriber from './UserSubscriber'
import CategoryCreatedEventSubscriber from './category/CategoryCreatedEventSubscriber'
import CategoryApprovedEventSubscriber from './category/CategoryApprovedEventSubscriber'
import CategoryRatedEventSubscriber from './category/CategoryRatedEventSubscriber'
import QuestionRatedEventSubscriber from './question/QuestionRatedEventSubscriber'

export default [
  CategoryCreatedEventSubscriber,
  CategoryApprovedEventSubscriber,
  CategoryRatedEventSubscriber,
  QuestionRatedEventSubscriber,
]

export const subscribers = [
  QuestionSubscriber,
  UserSubscriber,
]