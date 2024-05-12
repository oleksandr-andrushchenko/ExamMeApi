import { CredentialsSchema } from '../../../../src/schema/auth/CredentialsSchema'

export const addAuthMutation = (variables: { credentials: CredentialsSchema }, fields: string[] = [ 'token' ]) => {
  return {
    query: `
      mutation AddAuth($credentials: CredentialsSchema!) {
        addAuth(credentials: $credentials) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}