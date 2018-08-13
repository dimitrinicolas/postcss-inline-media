# postcss-inline-media [![Build Status][travis badge]][travis link] [![Coverage Status][coveralls badge]][coveralls link]

A [PostCSS][postcss] plugin that allows you to write media queries properties 
on the same line.

```pcss
.title {
  font-size: 20px @1200 18px @480 16px;
}
```

## Installation

```console
$ npm install postcss-inline-media
```

## Usage

```js
// Postcss plugins
postcss([ require('postcss-inline-media') ])
```

Check out [PostCSS][postcss] docs for the complete installation.

### Example

You can inline media queries just by writing its condition next to an `@` 
symbol.

If you only write a number after the `@`, it will be read as a `max-width` 
value in pixels, you can change this shorthand with the `shorthand` and 
'shorthandUnit' option of this plugin, eg: 
`require('postcss-inline-media')({ shorthand: 'min-width' })`.

This file:

```pcss
.btn {
  margin: 20px 10px @(print) 10px 5px @600 5px 0;
}
```

will output:

```pcss
.btn {
  margin: 20px 10px;
}
@media (print) {
  .btn {
    margin: 10px 5px;
  }
}
@media (max-width: 600px) {
  .btn {
    margin: 5px 0;
  }
}
```

### Media queries variables

You can use
[**postcss-simple-vars**][postcss-simple-vars] as media queries shortcut, put 
the `postcss-simple-vars` plugin **after** `postcss-inline-media`.

```pcss
$md: (max-width: 900px);
.btn {
  padding: 20px @md 10px;
}
```

will output:

```pcss
.btn {
  padding: 20px;
}
@media (max-width: 900px) {
  .btn {
    padding: 10px;
  }
}
```

### Nested conditions

You can nest media queries in parentheses, but you can't set multiples nesting 
parentheses on the same CSS property.

```pcss
div {
  margin: 50px (30px @(print) 20px @(max-width: 800px) 10px) 5px 5px;
}
```

will output:

```pcss
div {
  margin: 50px 30px 5px 5px;
}
@media print {
  div {
    margin: 50px 20px 5px 5px;
  }
}
@media (max-width: 800px) {
  div {
    margin: 50px 10px 5px 5px;
  }
}
```

### postcss-media-minmax

This plugin is compatible with 
[**postcss-media-minmax**][postcss-media-minmax], put the 
`postcss-media-minmax` plugin **after** `postcss-inline-media`.

```pcss
.btn {
  padding: 20px @(width <= 500px) 10px;
}
```

### postcss-custom-media

You can also use
[**postcss-custom-media**][postcss-custom-media], put the 
`postcss-custom-media` plugin **after** `postcss-inline-media`.

```pcss
@custom-media --small-viewport (max-width: 30em);
.btn {
  padding: 20px @(--small-viewport) 10px;
}
```

## Related

- [postcss][postcss] - Transforming styles with JS plugins
- [postcss-simple-vars][postcss-simple-vars] - PostCSS plugin for Sass-like 
variables
- [postcss-media-minmax][postcss-media-minmax] - Writing simple and graceful 
Media Queries!
- [postcss-custom-media][postcss-custom-media] - PostCSS plugin to transform 
- [ava-postcss-tester][ava-postcss-tester] - Simply test your PostCSS plugin 
with AVA

## License

This project is licensed under the [MIT license](LICENSE).

[travis badge]: https://travis-ci.org/dimitrinicolas/postcss-inline-media.svg?branch=master
[travis link]: https://travis-ci.org/dimitrinicolas/postcss-inline-media
[coveralls badge]: https://coveralls.io/repos/github/dimitrinicolas/postcss-inline-media/badge.svg?branch=master
[coveralls link]: https://coveralls.io/github/dimitrinicolas/postcss-inline-media?branch=master

[postcss]: https://github.com/postcss/postcss
[postcss-simple-vars]: https://github.com/postcss/postcss-simple-vars
[postcss-media-minmax]: https://github.com/postcss/postcss-media-minmax
[postcss-custom-media]: https://github.com/postcss/postcss-custom-media
[ava-postcss-tester]: https://github.com/dimitrinicolas/ava-postcss-tester
