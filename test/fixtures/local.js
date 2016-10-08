const choo = require('choo')
const basicComponent = require('./local.choo')

const app = choo()

app.model({
  state: { username: 'John Doe', mail: 'john@doe.com' }
})

app.model(basicComponent.model)

app.router(route => [
  route('/', basicComponent.view)
])

// export app for tests
module.exports = app
