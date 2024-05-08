export const meQuery = (fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query Me {
        me {
          ${ fields.join('\r') }
        }
      }
  `,
  }
}