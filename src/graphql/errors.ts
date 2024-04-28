import { ApolloServerErrorCode } from '@apollo/server/errors'

export const errors = {
  'ValidatorError': 'BadRequestError',
  'CategoryNotFoundError': 'NotFoundError',
  [ApolloServerErrorCode.BAD_USER_INPUT]: 'BadRequestError',
  'UserEmailNotFoundError': 'NotFoundError',
  'UserWrongCredentialsError': 'ForbiddenError',
}