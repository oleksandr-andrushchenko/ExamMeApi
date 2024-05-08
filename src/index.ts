import { serverUp } from './app'

serverUp(true).catch(error => console.log(error))