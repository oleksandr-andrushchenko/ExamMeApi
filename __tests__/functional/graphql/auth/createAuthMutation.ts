import { CredentialsSchema } from '../../../../src/schema/auth/CredentialsSchema'

export const createAuthMutation = (variables: { credentials: CredentialsSchema }, fields: string[] = [ 'token' ]) => {
  return {
    query: `
      mutation CreateAuth($credentials: CredentialsSchema!) {
        createAuth(credentials: $credentials) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}