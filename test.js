import test from 'ava';
import postcss from 'postcss';
import postcssInlineMedia from './';
import postcssSimpleVars from 'postcss-simple-vars';
import postcssCustomMedia from 'postcss-custom-media';
import postcssMediaMinMax from 'postcss-media-minmax';

const testPostcss = (input, output, t, opts={}) => {
  const plugins = [];
  for (let plugin of opts.pluginsBefore || []) {
    plugins.push(plugin);
  }
  plugins.push(opts.plugin || postcssInlineMedia());
  for (let plugin of opts.pluginsAfter || []) {
    plugins.push(plugin);
  }
  postcss(plugins).process(input, { from: '' }).then((result) => {
    t.is(result.css.replace(/\n|\r/g, ' '), output);
    t.is(result.warnings().length, 0);
    t.pass();
  }).catch(() => {
    t.fail();
  });
};

test('@(max-width: 800px)', async t => {
  const input = 'div { margin: 20px @(max-width: 800px) 10px; }';
  const output = [
    'div { margin: 20px; }',
    '@media (max-width: 800px) {',
    ' div { margin: 10px; } }'
  ].join(' ');
  testPostcss(input, output, t);
});

test('or operator replacement', async t => {
  const input = 'div { margin: 20px @(print or tv) 10px; }';
  const output = [
    'div { margin: 20px; }',
    '@media print,tv {',
    ' div { margin: 10px; } }'
  ].join(' ');
  testPostcss(input, output, t);
});

test('@Number shorthand', async t => {
  const input = 'div { margin: 20px @800 10px; }';
  const output = [
    'div { margin: 20px; }',
    '@media (max-width: 800px) {',
    ' div { margin: 10px; } }'
  ].join(' ');
  testPostcss(input, output, t);
});

test('Custom shorthand option', async t => {
  const input = 'div { margin: 20px @800 10px; }';
  const output = [
    'div { margin: 20px; }',
    '@media (min-width: 800px) {',
    ' div { margin: 10px; } }'
  ].join(' ');
  testPostcss(input, output, t, {
    plugin: postcssInlineMedia({ shorthand: 'min-width' })
  });
});

test('Custom shorthandUnit option', async t => {
  const input = 'div { margin: 20px @30 10px; }';
  const output = [
    'div { margin: 20px; }',
    '@media (max-width: 30em) {',
    ' div { margin: 10px; } }'
  ].join(' ');
  testPostcss(input, output, t, {
    plugin: postcssInlineMedia({ shorthandUnit: 'em' })
  });
});

test('multiples conditions', async t => {
  const input = 'div { margin: 20px @800 10px @600 5px; }';
  const output = [
    'div { margin: 20px; }',
    '@media (max-width: 800px) {',
    ' div { margin: 10px; } }',
    '@media (max-width: 600px) {',
    ' div { margin: 5px; } }'
  ].join(' ');
  testPostcss(input, output, t);
});

test('postcss-simple-vars', async t => {
  const input = '$media: (print); div { margin: 20px @media 10px; }';
  const output = [
    'div { margin: 20px; }',
    '@media (print) {',
    'div { margin: 10px; } }'
  ].join(' ');
  testPostcss(input, output, t, {
    pluginsAfter: [ postcssSimpleVars() ]
  });
});

test('simple nested condition', async t => {
  const input = 'div { margin: 20px (15px @800 10px); }';
  const output = [
    'div { margin: 20px 15px; }',
    '@media (max-width: 800px) {',
    ' div { margin: 20px 10px; } }'
  ].join(' ');
  testPostcss(input, output, t);
});

test('complex nested condition', async t => {
  console.log('———');
  const input = 'div { margin: 20px (15px @(print) 10px @(max-width: 800px) 7px) 5px 5px; }';
  const output = [
    'div { margin: 20px 15px 5px 5px; }',
    '@media print {',
    ' div { margin: 20px 10px 5px 5px; } }',
    '@media (max-width: 800px) {',
    ' div { margin: 20px 7px 5px 5px; } }'
  ].join(' ');
  testPostcss(input, output, t);
});

test('complex nested condition with function node', async t => {
  console.log('———');
  const input = 'div { margin: 20px (15px @(print) 10px) 7px func(8px); }';
  const output = [
    'div { margin: 20px 15px 7px func(8px); }',
    '@media print {',
    ' div { margin: 20px 10px 7px func(8px); } }'
  ].join(' ');
  testPostcss(input, output, t);
  console.log('—————————');
});

test('postcss-custom-media', async t => {
  const input = '@custom-media --small-viewport (max-width: 30em); div { margin: 20px @(--small-viewport) 10px; }';
  const output = [
    'div { margin: 20px; }',
    '@media (max-width: 30em) {',
    'div { margin: 10px; } }'
  ].join(' ');
  testPostcss(input, output, t, {
    pluginsAfter: [ postcssCustomMedia() ]
  });
});

test('postcss-media-minmax', async t => {
  const input = 'div { margin: 20px @(width >= 500px) 10px; }';
  const output = [
    'div { margin: 20px; }',
    '@media (min-width: 500px) {',
    ' div { margin: 10px; } }'
  ].join(' ');
  testPostcss(input, output, t, {
    pluginsAfter: [ postcssMediaMinMax() ]
  });
});

test('postcss-media-minmax many', async t => {
  const input = 'div { margin: 20px @(screen and (width >= 500px) and (width <= 1200px)) 10px; }';
  const output = [
    'div { margin: 20px; }',
    '@media screen and (min-width: 500px) and (max-width: 1200px) {',
    ' div { margin: 10px; } }'
  ].join(' ');
  testPostcss(input, output, t, {
    pluginsAfter: [ postcssMediaMinMax() ]
  });
});
