# chooify [![Build Status](https://secure.travis-ci.org/YerkoPalma/chooify.svg?branch=master)](https://travis-ci.org/YerkoPalma/chooify) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

> WIP - Browserify transform to process .choo files as isolated, stateless choo components

## TODO

- [ ] `require` .choo files.
  - [ ] Parse view.
    - [x] Wrap view function to bind local data to `this`.
    - [ ] Allow to require packages.
  - [x] Parse and export model.
    - [x] Ignore state.
    - [x] Remove namespaces.
    - [x] Read local data and pass it to view.
    - [x] Bind local data to this in effects.
    - [x] Bind local data to this in reducers.
    - [x] Bind local data to this in subscriptions.
  - [ ] Allow to pass local data when required.
- [ ] Create init hook.
  - [ ] Wrap initial state.
  - [ ] Re-render when there are local changes.
- [ ] Make a _real life_ example.

## Installation

```bash
npm install --save chooify
```

## Usage

Run it as any Browserify transform

### CLI

```bash
$ browserify -e index.js -o bundle.js -t chooify
```

### Node

```javascript
var fs = require("fs")
var browserify = require('browserify')
var chooify = require('chooify')

browserify('./main.js')
  .transform(chooify)
  .bundle()
  .pipe(fs.createWriteStream("bundle.js"))
```

## How it works

The above transform allows you to write choo stateless components like this

```javascript
// my-component.choo -> yep, .choo files

/* choo-view */

<main onload=${(e) => send('toggle')}>
  <h1 class="${this.active ? 'active' : ''}">${state.title}</h1>
</main>

/* choo-model */
{
  local: {
    active: false
  },
  effects: {
    toggle: (data, state, send, done) => {
      this.active = !this.active
    }
  }
}
```

```javascript
// main.js
const choo = require('choo')
const init = require('chooify/init')
const state = require('./state')
const mainComponent = require('./components/main.choo')({ active: true })

const app = choo()
init(app, state)

app.model(mainComponent.model)

app.router(route => [
  route('/', mainComponent.view)
])
```

## Explanation

Tha main idea is to have components that manage local data without polluting the global state, and that are completly reusable.
To do this, I created the `.choo` files, which is a javascript file with two sections, the view and the model, which are also exported, when required, as an object with two properties, view and model.
When required, the choo components receive an object as input, and return an object with the view and model, for choo app.
The input object, is the local data for that component.

### The model section

Starts whit a comment like this `/* choo-model */` and ends with the end of the file or the start of the view section. It must contain an object definition, which is a choo model, with some litle differences.

- No `namespace` support.
- `state` property is ignored.
- `local` property added. The component local data, not binded to the global app state, can be initialized here and/or by passing it when required. IF initialized in both places, like in the example, the input data takes preference. Anything passed that is not defined in the model part will be ignored.
- Local data binded to `this` in effects, reducers and subscriptions

### The view section

Starts whit a comment like this `/* choo-view */` and ends with the end of the file or the start of the model section. It must contain a string to be parsed by bel.
You can access to the `state, prev, send` arguments, as any other choo view, and to any data defined in the component local property of the model, as the `active` local data in the example.

### Considerations

Components ignore the `state` property of choo model, so to initialize a global state, this module also expose an `init` method that implement the `wrapInitialState` hook, so your global state is in a single place and not splitted in different models.
There is no required section for components. You can have a choo file with no model section or without view section, also you could use a component view outside of the router inside another component. You can even pass a full component as local data of another component (maybe we could have an `extend` property in the model section?).
Effects and reducers are still global, to make them local, we must define a way of communication between components.

## License

MIT

Crafted with <3 by [Yerko Palma](https://github.com/YerkoPalma).

***

> This package was initially generated with [yeoman](http://yeoman.io) and the [p generator](https://github.com/johnotander/generator-p.git).
