import QuestionSubscriber from './QuestionSubscriber'
import UserSubscriber from './UserSubscriber'
import CategoryCreatedEventSubscriber from './category/CategoryCreatedEventSubscriber'
import CategoryApprovedEventSubscriber from './category/CategoryApprovedEventSubscriber'

export default [
  CategoryCreatedEventSubscriber,
  CategoryApprovedEventSubscriber,
]

export const subscribers = [
  QuestionSubscriber,
  UserSubscriber,
]