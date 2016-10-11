/* eslint-env mocha */
const browserify = require('browserify')
const chooify = require('../index')
const fs = require('fs')
const path = require('path')
const expect = require('chai').expect
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const jsdom = require('jsdom')

const tempDir = path.resolve(__dirname, './temp')
const mockEntry = path.resolve(tempDir, 'entry.js')
rimraf.sync(tempDir)
mkdirp.sync(tempDir)

function test (file, assert) {
  it(file, done => {
    fs.writeFileSync(mockEntry, `
window.chooModule = require('../fixtures/${file}.choo')
window.chooApp = require('../fixtures/${file}.js')
window.document.body.appendChild(window.chooApp.start())
    `)
    browserify(mockEntry)
      .transform(chooify)
      .bundle((err, buf) => {
        if (err) {
          console.error(err.stack.replace(/^.*?\n/, ''))
          return done(err)
        }
        jsdom.env({
          html: '<!DOCTYPE html><html><head></head><body></body></html>',
          src: [buf.toString()],
          done: (err, window) => {
            if (err) {
              console.error(err.stack.replace(/^.*?\n/, ''))
              return done(err)
            }
            assert(window)
            done()
          }
        })
      })
  })
}

describe('chooify', () => {
  test('basic', window => {
    const module = window.chooModule
    const app = window.chooApp
    expect(module.view).to.be.ok
    expect(module.model).to.be.ok

    const h1 = window.document.querySelector('h1').innerHTML
    expect(h1).to.equal('John Doe')
    expect(app._store.state().undef).to.be.not.ok
    const span = window.document.querySelector('span').innerHTML
    expect(span).to.equal('Peter')
  })

  /* test('local', window => {
    const module = window.chooModule
    expect(module.view).to.be.ok
    expect(module.model).to.be.ok
    console.log(JSON5.stringify(module.model))
  }) */
})
