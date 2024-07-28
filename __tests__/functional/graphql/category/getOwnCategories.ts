export const getOwnCategories = (fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetOwnCategories{
        ownCategories {
          ${ fields.join('\r') }
        }
      }
  `,
    variables: {},
  }
}