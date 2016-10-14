'use strict'
const through = require('through')
const JSON5 = require('json5')
const falafel = require('falafel')

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
    // initialize local data only if it is present in the local property of the model
    const init = `
    function chooify () {}
    chooify.local = ${JSON5.stringify(parsedModel.local)}
    chooify.view = ${view}
    chooify.model = ${parsedModel.model}
    `

    stream.queue(`
    ${init}
    module.exports = chooify`)
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
  let str = 'var o = ' + clean(model)

  let local
  let output = falafel(str, (node) => {
    // parse arrow functions
    if (/ArrowFunctionExpression/.test(node.type)) {
      const params = node.params.map(param => param.name).join(', ')
      // inline arrow function
      let body
      if (/ObjectExpression/.test(node.body.type)) body = `{ return ${node.body.source()} }`
      else body = '\n    ' + node.body.source()
      node.update(`function (${params}) ${body}`)
    }
    // exclude (ignore) state
    if (/Property/.test(node.type) && node.key.name === 'state') node.value.update('{}')
    // ignore namespace
    if (/Property/.test(node.type) && node.key.name === 'namespace') node.value.update('undefined')
    if (/Property/.test(node.type) && node.key.name === 'local') {
      local = JSON5.parse(node.value.source())
    }
  })
  output = falafel(output.toString(), node => {
    // assign local value to this in effects
    if (/Property/.test(node.type) && ['effects', 'reducers', 'subscriptions'].indexOf(node.key.name) > -1) {
      node.value.properties.forEach(function (effect) {
        effect.value.update('(' + effect.value.source() + ').bind(chooify.local)')
      })
    }
  })
  let outputStr = output.toString()
  // check if local property is defined
  // let local = output.local
  // check if effects, reducers and/or subscriptions are arrow functions
    // if they are, replace them by old fashioned functions
  // bind model.local to this in effects, reducers and subscriptions
  return { model: outputStr.substring(8, outputStr.length), local }
}

function parseView (view, local) {
  // wrap in a function that require choo/html
  // check if there is any package required
  // require the package after choo/html and before the view function
  return `(function () {
      const html = require('bel')

      return (function (state, prev, send) {
        return html\`${clean(view)}\`
      }).bind(chooify.local)
  })()`
}
