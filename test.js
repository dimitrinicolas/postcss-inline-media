import test from 'ava';
import PostcssTester from 'ava-postcss-tester';

import postcss from 'postcss';
import postcssSimpleVars from 'postcss-simple-vars';
import postcssCustomMedia from 'postcss-custom-media';
import postcssMediaMinMax from 'postcss-media-minmax';

import postcssInlineMedia from '.';

const tester = new PostcssTester({
  postcss,
  plugin: postcssInlineMedia,
});

test('@(max-width: 800px)', async (t) => {
  const input = /* scss */ `
    div { margin: 20px @(max-width: 800px) 10px; }
  `;
  const output = /* scss */ `
    div { margin: 20px; }
    @media (max-width: 800px) {
      div { margin: 10px; }
    }
  `;
  tester.test(input, output, t);
});

test('no default value', async (t) => {
  const input = /* scss */ `
    div { margin: @(max-width: 800px) 10px; }
  `;
  const output = /* scss */ `
    div { }
    @media (max-width: 800px) {
      div { margin: 10px }
    }
  `;
  tester.test(input, output, t);
});

test('or operator replacement', async (t) => {
  const input = /* scss */ `
    div { margin: 20px @(print or tv) 10px; }
  `;
  const output = /* scss */ `
    div { margin: 20px; }
    @media print,tv {
      div { margin: 10px; }
    }
  `;
  tester.test(input, output, t);
});

test('@Number shorthand', async (t) => {
  const input = /* scss */ `
    div { margin: 20px @800 10px; }
  `;
  const output = /* scss */ `
    div { margin: 20px; }
    @media (max-width: 800px) {
      div { margin: 10px; }
    }
  `;
  tester.test(input, output, t);
});

test('Custom shorthand option', async (t) => {
  const input = /* scss */ `
    div { margin: 20px @800 10px; }
  `;
  const output = /* scss */ `
    div { margin: 20px; }
    @media (min-width: 800px) {
      div { margin: 10px; }
    }
  `;
  tester.test(input, output, t, {
    pluginOptions: {
      shorthand: 'min-width',
    },
  });
});

test('Custom shorthandUnit option', async (t) => {
  const input = /* scss */ `
    div { margin: 20px @30 10px; }
  `;
  const output = /* scss */ `
    div { margin: 20px; }
    @media (max-width: 30em) {
      div { margin: 10px; }
    }
  `;
  tester.test(input, output, t, {
    pluginOptions: {
      shorthandUnit: 'em',
    },
  });
});

test('Custom shorthandValueAddition option', async (t) => {
  const input = /* scss */ `
    div { margin: 20px @30 10px; }
  `;
  const output = /* scss */ `
    div { margin: 20px; }
    @media (max-width: 29px) {
      div { margin: 10px; }
    }
  `;
  tester.test(input, output, t, {
    pluginOptions: {
      shorthandValueAddition: -1,
    },
  });
});

test('multiples conditions', async (t) => {
  const input = /* scss */ `
    div { margin: 20px @800 10px @600 5px; }
  `;
  const output = /* scss */ `
    div { margin: 20px; }
    @media (max-width: 800px) {
      div { margin: 10px; }
    }
    @media (max-width: 600px) {
      div { margin: 5px; }
    }
  `;
  tester.test(input, output, t);
});

test('postcss-simple-vars', async (t) => {
  const input = /* scss */ `
    $media: (print);
    div { margin: 20px @media 10px; }
  `;
  const output = /* scss */ `
    div { margin: 20px; }
    @media (print) {
      div { margin: 10px; }
    }
  `;
  tester.test(input, output, t, {
    pluginsAfter: [postcssSimpleVars()],
  });
});

test('simple nested condition', async (t) => {
  const input = /* scss */ `
    div { margin: 20px (15px @800 10px); }
  `;
  const output = /* scss */ `
    div { margin: 20px 15px; }
    @media (max-width: 800px) {
      div { margin: 20px 10px; }
    }
  `;
  tester.test(input, output, t);
});

test('complex nested condition', async (t) => {
  const input = /* scss */ `
    div {
      margin: 20px (15px @(print) 10px @(max-width: 800px) 7px) 5px 5px;
    }
  `;
  const output = /* scss */ `
    div { margin: 20px 15px 5px 5px; }
    @media print {
      div { margin: 20px 10px 5px 5px; }
    }
    @media (max-width: 800px) {
      div { margin: 20px 7px 5px 5px; }
    }
  `;
  tester.test(input, output, t);
});

test('complex nested condition with function node', async (t) => {
  const input = /* scss */ `
    div { margin: 20px (15px @(print) 10px) 7px func(8px); }
  `;
  const output = /* scss */ `
    div { margin: 20px 15px 7px func(8px); }
    @media print {
      div { margin: 20px 10px 7px func(8px); }
    }
  `;
  tester.test(input, output, t);
});

test('postcss-custom-media', async (t) => {
  const input = /* scss */ `
    @custom-media --small-viewport (max-width: 30em);
    div {
      margin: 20px @(--small-viewport) 10px;
    }
  `;
  const output = /* scss */ `
    div { margin: 20px; }
    @media (max-width: 30em) {
      div { margin: 10px; }
    }
  `;
  tester.test(input, output, t, {
    pluginsAfter: [postcssCustomMedia()],
  });
});

test('postcss-media-minmax', async (t) => {
  const input = /* scss */ `
    div { margin: 20px @(width >= 500px) 10px; }
  `;
  const output = /* scss */ `
    div { margin: 20px; }
    @media (min-width: 500px) {
      div { margin: 10px; }
    }
  `;
  tester.test(input, output, t, {
    pluginsAfter: [postcssMediaMinMax()],
  });
});

test('postcss-media-minmax many', async (t) => {
  const input = /* scss */ `
    div {
      margin: 20px @(screen and (width >= 500px) and (width <= 1200px)) 10px;
    }
  `;
  const output = /* scss */ `
    div { margin: 20px; }
    @media screen and (min-width: 500px) and (max-width: 1200px) {
      div { margin: 10px; }
    }
  `;
  tester.test(input, output, t, {
    pluginsAfter: [postcssMediaMinMax()],
  });
});

test('nested rules', async (t) => {
  const input = /* scss */ `
    div {
      margin: 20px @900 10px @600 5px;
      padding: 20px @900 10px;
      header {
        span { color: black @900 red; }
      }
    }
    span { color: black @800 red; }
  `;
  const output = /* scss */ `
    div {
      margin: 20px;
      padding: 20px;
      header {
        span { color: black; }
        @media (max-width: 900px) {
          span { color: red; }
        }
      }
    }
    span { color: black; }
    @media (max-width: 900px) {
      div {
        margin: 10px;
        padding: 10px;
      }
    }
    @media (max-width: 600px) {
      div { margin: 5px; }
    }
    @media (max-width: 800px) {
      span { color: red; }
    }
  `;
  tester.test(input, output, t);
});

test('nested pseudo element', async (t) => {
  const input = /* scss */ `
    div {
      margin: 20px @900 10px;
      padding: @600 10px;
      &::before {
        color: black @900 red;
      }
    }
  `;
  const output = /* scss */ `
    div {
      margin: 20px;
      &::before {
        color: black;
      }
      @media (max-width: 900px) {
        &::before {
          color: red;
        }
      }
    }
    @media (max-width: 900px) {
      div { margin: 10px; }
    }
    @media (max-width: 600px) {
      div { padding: 10px; }
    }
  `;
  tester.test(input, output, t);
});

test('nested unknown rule type', async (t) => {
  const input = /* scss */ `
    div {
      margin: 20px @900 10px;
      -something {
        color: black @900 red;
      }
    }
  `;
  const output = /* scss */ `
    div {
      margin: 20px;
      -something {
        color: black;
      }
      @media (max-width: 900px) {
        -something {
          color: red;
        }
      }
    }
    @media (max-width: 900px) {
      div {
        margin: 10px;
      }
    }
  `;
  tester.test(input, output, t);
});
