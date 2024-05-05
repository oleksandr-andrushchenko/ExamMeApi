import MeSchema from '../../../src/schema/user/MeSchema'

export const addMeMutation = (variables: { me: MeSchema }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation AddMe($me: MeSchema!) {
        addMe(me: $me) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}