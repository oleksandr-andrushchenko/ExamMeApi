import MeUpdateSchema from '../../../../src/schema/user/MeUpdateSchema'

export const updateMeMutation = (variables: { meUpdate: MeUpdateSchema }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation UpdateMe($meUpdate: MeUpdateSchema!) {
        updateMe(meUpdate: $meUpdate) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}