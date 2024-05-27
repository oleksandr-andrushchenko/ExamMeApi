import UserSchema from '../../../../src/schema/user/UserSchema'

export const createUserMutation = (variables: { user: UserSchema }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CreateUser($user: UserSchema!) {
        createUser(user: $user) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}