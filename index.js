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

  function clean (str) {
    str = str.replace('/* choo-view */', '')
    str = str.replace('/* choo-model */', '')
    return str.trim()
  }

  function end () {
    const viewRegex = /(\/\* choo\-view \*\/)[\s\S]*(\/\* choo\-model \*\/)|(\/\* choo\-view \*\/)[\s\S]*/
    const modelRegex = /(\/\* choo\-model \*\/)[\s\S]*(\/\* choo\-view \*\/)|(\/\* choo\-model \*\/)[\s\S]*/

    // get the view part
    const view = clean(data.match(viewRegex)[0])
    // get the model part
    const model = clean(data.match(modelRegex)[0])
    //  bind 'local' data to the local scope of component
    let result = {
      view,
      model
    }
    stream.queue(`module.exports = ${JSON.stringify(result, null, 2)}`)
    stream.queue(null)
  }
  return stream
}
