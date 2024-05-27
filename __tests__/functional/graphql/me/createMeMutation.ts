import MeSchema from '../../../../src/schema/user/MeSchema'

export const createMeMutation = (variables: { me: MeSchema }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CreateMe($me: MeSchema!) {
        createMe(me: $me) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}