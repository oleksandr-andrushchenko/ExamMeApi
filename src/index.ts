import app from './app'

app().api().up(true).catch(error => console.log(error))