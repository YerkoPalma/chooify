'use strict'
const through = require('through')

module.exports = function chooify (file) {
  // ignore files without choo extension
  if (!/.choo$/.test(file)) {
    return through()
  }
  let data = ''

  let stream = through(write, end)

  function write (buf) {
    data += buf
  }

  function end () {
    const viewRegex = /(\/\* choo\-view \*\/)[\s\S]*(\/\* choo\-model \*\/)|(\/\* choo\-view \*\/)[\s\S]*/
    const modelRegex = /(\/\* choo\-model \*\/)[\s\S]*(\/\* choo\-view \*\/)|(\/\* choo\-model \*\/)[\s\S]*/

    // get the view part
    const view = parseView(data.match(viewRegex)[0])
    // get the model part
    const model = parseModel(data.match(modelRegex)[0])

    stream.queue(`module.exports = { view: ${view}, model: ${model} }`)
    stream.queue(null)
  }
  return stream
}

function clean (str) {
  str = str.replace('/* choo-view */', '')
  str = str.replace('/* choo-model */', '')
  return str.trim()
}

function parseModel (model) {
  const namespaceRegex = /namespace[\s]*:[^,]+,/
  let output = clean(model)
  // ignore namespace
  output = output.replace(namespaceRegex, '')
  // exclude (ignore) state

  // check if local property is defined
  // check if effects, reducers and/or subscriptions are arrow functions
    // if they are, replace them by old fashioned functions
  // bind model.local to this in effects, reducers and subscriptions
  return output
}

function parseView (view) {
  // wrap in a function that require choo/html
  // check if there is any package required
  // require the package after choo/html and before the view function
  return `(function () {
      const html = require('bel')
      return (state, prev, send) => { 
        return html${clean(view)}
      }
  })()`
}
