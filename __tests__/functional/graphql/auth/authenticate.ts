import { Credentials } from '../../../../src/schema/auth/Credentials'

export const authenticate = (variables: { credentials: Credentials }, fields: string[] = [ 'token' ]) => {
  return {
    query: `
      mutation Authenticate($credentials: Credentials!) {
        authenticate(credentials: $credentials) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}