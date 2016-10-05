const choo = require('choo')
const basicComponent = require('./basic.choo')

const app = choo()

app.model({
  state: { name: 'John Doe' }
})

app.model(basicComponent.model)

app.router(route => [
  route('/', basicComponent.view)
])

// export app for tests
module.exports = app
