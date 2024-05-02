import { CredentialsSchema } from '../../../src/schema/auth/CredentialsSchema'

export const authenticateMutation = (variables: { credentials: CredentialsSchema }, fields: string[] = [ 'token' ]) => {
  return {
    query: `
      mutation Authenticate($credentials: CredentialsSchema!) {
        authenticate(credentials: $credentials) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}