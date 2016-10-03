const choo = require('choo')
const basicComponent = require('./basic.choo')

const app = choo()

app.model(basicComponent.model)

app.router(route => [
  route('/', basicComponent.view)
])

const tree = app.start()

// export app for tests
module.exports = tree
