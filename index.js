const glob = require('glob');
const postcss = require('postcss');
const valueParser = require('postcss-value-parser');

const parse = (nodes, opts) => {
  let base = '';
  let querys = [];
  let nestedQuery = false;

  for (let node of nodes) {
    if (node.type === 'function' && node.value === '') {
      const nested = parse(node.nodes, Object.assign({}, opts, { base: base }));

      for (let nestedQuery of nested.querys) {
        nestedQuery.value = base + nestedQuery.value;
        querys.push(nestedQuery);
      }

      base = base + nested.base;
      nestedQuery = true;
    }
    else if (node.type === 'function' && node.value === '@') {
      querys[querys.length] = {
        media: '(',
        value: ''
      };
      querys[querys.length - 1].media = '(';
      for (let item of node.nodes) {
        if (item.type === 'function') {
          querys[querys.length - 1].media += valueParser.stringify(item);
        }
        else {
          querys[querys.length - 1].media += ((item.before || '') + item.value + (item.after || ''));
        }
      }
      querys[querys.length - 1].media += ')';
    }
    else if (node.type === 'word' && /^@/gi.test(node.value)) {
      querys[querys.length] = {
        media: '(',
        value: ''
      };
      let media = node.value.replace(/^@/gi, '');
      if (Number.isNaN(parseInt(media))) {
        media = `$${media}`;
      }
      else {
        media = `(${opts.shorthand}: ${media}${opts.shorthandUnit})`;
      }
      querys[querys.length - 1].media = media;
    }
    else if (querys.length > 0) {
      if (nestedQuery) {
        for (let query of querys) {
          if (node.type === 'function') {
            query.value += valueParser.stringify(node);
          }
          else {
            query.value += node.value;
          }
        }
      }
      else {
        if (node.type === 'function') {
          querys[querys.length - 1].value += valueParser.stringify(node);
        }
        else {
          querys[querys.length - 1].value += node.value;
        }
      }
    }

    if (nestedQuery && ['word', 'space'].indexOf(node.type) !== -1) {
      base += node.value;
    }

    if (!nestedQuery && querys.length < 1) {
      if (node.type === 'function') {
        base += valueParser.stringify(node);
      }
      else {
        base += node.value;
      }
    }
  }

  return {
    base,
    querys
  };
}

module.exports = postcss.plugin('postcss-inline-media', function(opts={}) {
  return function (css, result) {
    css.walk(function(rule) {
      if (rule.type === 'decl') {
        const root = rule.root();
        const value = rule.value;

        if (/@/gi.test(value)) {
          const content = parse(valueParser(value).nodes, {
            shorthand: typeof opts.shorthand === 'string' ? opts.shorthand : 'max-width',
            shorthandUnit: typeof opts.shorthandUnit === 'string' ? opts.shorthandUnit : 'px'
          });

          if (content.base.replace(/ /gi, '') !== '') {
            rule.parent.insertBefore(rule, {
              prop: rule.prop,
              value: content.base.replace(/\s\s+|^ | $/g, ' ').replace(/^ | $/g, '')
            });
          }

          for (let query of content.querys) {
            let media = query.media;
            const special = media.indexOf(':') !== -1 || media.indexOf('--') !== -1 || media.indexOf('>') !== -1 || media.indexOf('<') !== -1;
            const parenthesis = media.replace(/^\(/gi, '').indexOf('(') !== -1;

            if ((special && parenthesis) || (!special && !parenthesis)) {
              media = media.replace(/^\(/gi, '').replace(/\)$/gi, '');
            }

            media = media.replace(/ or /gi, ',');

            const atRule = postcss.atRule({
              name: 'media',
              params: media
            });
            const mediaRule = postcss.rule({
              selector: rule.parent.selector,
            });
            mediaRule.append({
              prop: rule.prop,
              value: query.value.replace(/\s\s+|^ | $/g, ' ').replace(/^ | $/g, '')
            });
            atRule.append(mediaRule);
            root.append(atRule);
          }

          rule.remove();
        }
      }
    });
  };
});
