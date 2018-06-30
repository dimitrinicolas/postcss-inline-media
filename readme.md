# PostCSS Inline Media Queries [![Build Status](https://travis-ci.org/dimitrinicolas/postcss-inline-media.svg?branch=master)](https://travis-ci.org/dimitrinicolas/postcss-inline-media)

A [PostCSS](https://github.com/postcss/postcss) plugin that allows you to write
media queries properties on the same line.

```css
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
// dependencies
postcss([ require('postcss-inline-media') ])
```

Check out [PostCSS](https://github.com/postcss/postcss) docs for the complete
installation.

### Example

You can inline media queries just by writing its condition next to an `@`
symbol.

If you only write a number after the `@`, it will be read as a `max-width` value
in pixels, you can change this shorthand with the `shorthand` and
'shorthandUnit' option of this plugin, eg:
`require('postcss-inline-media')({ shorthand: 'min-width' })`.

This file:

```css
.btn {
    margin: 20px 10px @(print) 10px 5px @600 5px 0;
}
```

will output:

```css
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
[**postcss-simple-vars**](https://github.com/postcss/postcss-simple-vars) as
media queries shortcut, put the `postcss-simple-vars` plugin **after**
`postcss-inline-media`.

```css
$md: (max-width: 900px);
.btn {
    padding: 20px @md 10px;
}
```

will output:

```css
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
parentheses on the same css property.

```css
div {
    margin: 50px (30px @(print) 20px @(max-width: 800px) 10px) 5px 5px;
}
```

will output:

```css
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
[**postcss-media-minmax**](https://github.com/postcss/postcss-media-minmax), put
the `postcss-media-minmax` plugin **after** `postcss-inline-media`.

```css
.btn {
    padding: 20px @(width <= 500px) 10px;
}
```

### postcss-custom-media

You can also use
[**postcss-custom-media**](https://github.com/postcss/postcss-custom-media), put
the `postcss-custom-media` plugin **after** `postcss-inline-media`.

```css
@custom-media --small-viewport (max-width: 30em);
.btn {
    padding: 20px @(--small-viewport) 10px;
}
```

## License

This project is licensed under the [MIT license](LICENSE).
