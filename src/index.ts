import application from './app'

application().api().up(true).catch(error => console.log(error))