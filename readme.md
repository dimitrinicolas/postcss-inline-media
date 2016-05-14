# PostCSS Inline Media Queries

It is a [PostCSS][PostCSS] plugin that allow writing media queries properties on the same line.

## Installation

```console
$ npm install postcss-inline-media
```

## Usage

```js
// dependencies
postcss([ require('postcss-inline-media')() ])
```

Check out [PostCSS][PostCSS] docs for the complete installation.

#### This file:

```css
.btn {
    margin: 20px 10px @(max-width: 800px) 10px 5px;
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
```

#### You can use multiple media queries

```css
.btn {
    color: blue @(max-width: 800px) red @(print) black;
}
```

will output:

```css
.btn {
    color: blue;
}
@media (max-width: 800px) {
    .btn {
        color: red;
    }
}
@media print {
    .btn {
        color: black;
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

## [License](LICENSE)
