const choo = require('choo')
const component = require('./counter.choo')({ author: 'Yerko' })

const app = choo()
app.model(component.model)

app.router((route) => [
  route('/', component.view)
])

const tree = app.start()
document.body.appendChild(tree)
