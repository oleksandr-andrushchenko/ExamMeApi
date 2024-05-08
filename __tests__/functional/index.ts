// @ts-ignore
import TestFramework from './TestFramework'

export const globalSetup = async () => {
  globalThis.framework = new TestFramework()

  await globalThis.framework.appUp()
}

export const globalTeardown = async () => {
  await globalThis.framework.appDown()
}