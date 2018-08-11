const postcss = require('postcss');
const valueParser = require('postcss-value-parser');

/**
 * get string value of a node
 * @param {Node} node
 * @returns {string} node value
 */
const getValue = node => {
  if (node.type === 'function') {
    return valueParser.stringify(node);
  }
  return node.value;
};

/**
 * Remove extra spaces from strings
 * @param {string} str
 */
const cleanString = str => {
  return str.replace(/\s\s+|^ | $/g, ' ').replace(/^ | $/g, '');
};

/**
 * parse nodes
 * @param {Node[]} nodes
 * @param {object} opts
 * @returns {{ base: {string}, queries: {MediaQuery[]} }}
 */
const parse = (nodes, opts) => {
  let base = '';
  const queries = [];
  let nestedQuery = false;

  for (const node of nodes) {
    if (node.type === 'function' && node.value === '') {
      const nested = parse(node.nodes, Object.assign({}, opts, { base }));

      for (const query of nested.queries) {
        query.value = base + query.value;
        queries.push(query);
      }

      base += nested.base;
      nestedQuery = true;
    } else if (node.type === 'function' && node.value === '@') {
      queries[queries.length] = {
        media: '(',
        value: ''
      };
      queries[queries.length - 1].media = '(';
      for (const item of node.nodes) {
        if (item.type === 'function') {
          queries[queries.length - 1].media += valueParser.stringify(item);
        } else {
          queries[queries.length - 1].media += ((item.before || '') + item.value + (item.after || ''));
        }
      }
      queries[queries.length - 1].media += ')';
    } else if (node.type === 'word' && /^@/gi.test(node.value)) {
      queries[queries.length] = {
        media: '(',
        value: ''
      };
      let media = node.value.replace(/^@/gi, '');
      if (Number.isNaN(parseInt(media, 10))) {
        media = `$${media}`;
      } else {
        media = `(${opts.shorthand}: ${media}${opts.shorthandUnit})`;
      }
      queries[queries.length - 1].media = media;
    } else if (queries.length > 0) {
      if (nestedQuery) {
        for (const query of queries) {
          query.value += getValue(node);
        }
      } else {
        queries[queries.length - 1].value += getValue(node);
      }
    }

    if (nestedQuery) {
      if (['word', 'space'].indexOf(node.type) !== -1) {
        base += getValue(node);
      } else if (
        node.type === 'function' && ['', '@'].indexOf(node.value) === -1
      ) {
        base += getValue(node);
      }
    }

    if (!nestedQuery && queries.length < 1) {
      base += getValue(node);
    }
  }

  return {
    base: cleanString(base),
    queries: queries.map(({ media, value }) => {
      return {
        media,
        value: cleanString(value)
      };
    })
  };
};

/**
 * Return the css rule parent of depth 1
 * @param {rule} rule
 */
const deepParent = rule => {
  if (rule.parent.type === 'rule') {
    return deepParent(rule.parent);
  }
  return rule;
};

/**
 * Return nested selector
 * @param {rule} rule
 * @param {string} [suffix='']
 */
const deepParentSelector = (rule, suffix = '') => {
  if (rule.parent.type === 'rule') {
    return deepParentSelector(rule.parent, `${rule.parent.selector} ${suffix}`);
  }
  return suffix;
};

/**
 * Query class
 * @param {string} selector
 * @param {string} prop
 * @param {object} content
 */
class Query {
  constructor(selector, prop, content) {
    this.selector = cleanString(selector);
    this.prop = cleanString(prop);

    const queries = content.queries.map(({ media, value }) => {
      const special = media.indexOf(':') !== -1
        || media.indexOf('--') !== -1
        || media.indexOf('>') !== -1
        || media.indexOf('<') !== -1;
      const parenthesis = media.replace(/^\(/gi, '').indexOf('(') !== -1;
      if ((special && parenthesis) || (!special && !parenthesis)) {
        media = media.replace(/^\(/gi, '').replace(/\)$/gi, '');
      }
      media = media.replace(/ or /gi, ',');

      return {
        media,
        value: cleanString(value)
      };
    });

    this.content = {
      base: content.base,
      queries
    };
  }
}

/**
 * RulePack class
 * @param {string} parent
 */
class RulePack {
  constructor(parent) {
    this.parent = parent;
    this.queries = [];
  }

  addQuery({ selector, prop, content }) {
    content.queries.forEach(({ media, value }) => {
      let foundMedia = false;
      this.queries.forEach(item => {
        if (item.media === media && !foundMedia) {
          foundMedia = true;

          let foundSelector = false;
          item.selectors.forEach(selectorPack => {
            if (selectorPack.selector === selector && !foundSelector) {
              foundSelector = true;

              selectorPack.queries.push({
                prop,
                value
              });
            }
          });
          if (!foundSelector) {
            item.selectors.push({
              selector,
              queries: [
                {
                  prop,
                  value
                }
              ]
            });
          }
        }
      });
      if (!foundMedia) {
        this.queries.push({
          media,
          selectors: [
            {
              selector,
              queries: [
                {
                  prop,
                  value
                }
              ]
            }
          ]
        });
      }
    });
  }
}

module.exports = postcss.plugin('postcss-inline-media', (opts = {}) => {
  return css => {
    const mediaQueries = [];

    css.walk(rule => {
      if (rule.type !== 'decl') return;
      const value = rule.value;
      if (/@/gi.test(value)) {
        const content = parse(valueParser(value).nodes, {
          shorthand: typeof opts.shorthand === 'string'
            ? opts.shorthand : 'max-width',
          shorthandUnit: typeof opts.shorthandUnit === 'string'
            ? opts.shorthandUnit : 'px'
        });
        const parent = deepParent(rule);

        const query = new Query(deepParentSelector(rule), rule.prop, content);
        if (
          mediaQueries.length
          && mediaQueries[mediaQueries.length - 1].parent === parent
        ) {
          mediaQueries[mediaQueries.length - 1].addQuery(query);
        } else {
          const pack = new RulePack(parent);
          pack.addQuery(query);
          mediaQueries.push(pack);
        }

        if (content.base !== '') {
          rule.parent.insertBefore(rule, {
            prop: rule.prop,
            value: content.base
          });
        }

        rule.remove();
      }
    });

    mediaQueries.forEach(mq => {
      const root = mq.parent.root();

      mq.queries.forEach(({ media, selectors }) => {
        const atRule = postcss.atRule({
          name: 'media',
          params: media
        });

        selectors.forEach(({ selector, queries }) => {
          const mediaRule = postcss.rule({
            selector
          });
          queries.forEach(({ prop, value }) => {
            mediaRule.append({
              prop,
              value
            });
          });
          atRule.append(mediaRule);
        });

        root.append(atRule);
      });
    });
  };
});
