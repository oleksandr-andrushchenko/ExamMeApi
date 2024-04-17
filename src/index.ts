import application from './application'

application().api().up(true).catch(error => console.log(error))