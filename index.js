'use strict'
const through = require('through')
const JSON5 = require('json5')

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

    // get the model part
    const parsedModel = parseModel(data.match(modelRegex)[0])
    // get the view part, ensure to pass the model object string (it has the local property)
    const view = parseView(data.match(viewRegex)[0], parsedModel.local)

    stream.queue(`module.exports = { view: ${view}, model: ${parsedModel.model} }`)
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
  const arrowFnRegex = /\([\s\S]*\)\s*=>\s*{/g
  let str = clean(model)
  if (arrowFnRegex.test(str)) str = str.split(arrowFnRegex).join('function ' + str.match(arrowFnRegex)[0].replace('=>', ' '))
  console.log(str)

  let output = JSON5.parse(str)
  // ignore namespace
  if (output.namespace) delete output.namespace
  // exclude (ignore) state
  if (output.state) delete output.state

  // check if local property is defined
  let local = output.local
  // check if effects, reducers and/or subscriptions are arrow functions
    // if they are, replace them by old fashioned functions
  // bind model.local to this in effects, reducers and subscriptions
  return { model: JSON5.stringify(output), local }
}

function parseView (view, local) {
  // wrap in a function that require choo/html
  // check if there is any package required
  // require the package after choo/html and before the view function
  return `(function () {
      const html = require('bel')
      const local = ${JSON5.stringify(local)}

      return (function (state, prev, send) {
        return html${clean(view)}
      }).bind(local)
  })()`
}
