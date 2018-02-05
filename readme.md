# PostCSS Inline Media Queries

It is a [PostCSS](https://github.com/postcss/postcss) plugin that allow writing media queries properties on the same line.

## Installation

```console
$ npm install postcss-inline-media
```

## Usage

```js
// dependencies
postcss([ require('postcss-inline-media') ])
```

Check out [PostCSS](https://github.com/postcss/postcss) docs for the complete installation.

#### Example

You can inline media queries just by writing its condition next to an `@` symbol.
If you only write a number, it will be read as a `max-width` value in pixels.

This file:

```css
.btn {
    margin: 20px 10px @(max-width: 800px) 10px 5px @600 5px 0;
}
```

will output:

```css
.btn {
    margin: 20px 10px;
}
@media (max-width: 800px) {
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

#### Media queries variables

You can use [postcss-simple-vars](https://github.com/postcss/postcss-simple-vars) as media queries shortcut

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

#### Nested conditions

You can nest media queries in parentheses, but you can't set multiples nesting parentheses on the same css property

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

## [License](LICENSE.txt)
