import UserSchema from '../../../../src/schema/user/UserSchema'

export const addUserMutation = (variables: { user: UserSchema }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation AddUser($user: UserSchema!) {
        addUser(user: $user) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}