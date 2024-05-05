export const removeMeMutation = () => {
  return {
    query: `
      mutation RemoveMe {
        removeMe
      }
  `,
  }
}