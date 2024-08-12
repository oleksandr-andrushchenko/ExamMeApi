import QuestionSubscriber from './QuestionSubscriber'
import UserSubscriber from './UserSubscriber'
import CategoryCreatedEventSubscriber from './category/CategoryCreatedEventSubscriber'
import CategoryApprovedEventSubscriber from './category/CategoryApprovedEventSubscriber'
import CategoryRatedEventSubscriber from './category/CategoryRatedEventSubscriber'

export default [
  CategoryCreatedEventSubscriber,
  CategoryApprovedEventSubscriber,
  CategoryRatedEventSubscriber,
]

export const subscribers = [
  QuestionSubscriber,
  UserSubscriber,
]