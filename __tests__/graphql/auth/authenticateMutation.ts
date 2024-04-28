export const authenticateMutation = (fields: string[] = [ 'token' ], variables: object = {}) => {
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