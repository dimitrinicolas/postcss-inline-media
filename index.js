const postcss = require('postcss');
const valueParser = require('postcss-value-parser');

/**
 * get string value of a node
 * @param {Node} node
 * @returns {string} node value
 */
const getValue = (node) => {
  if (node.type === 'function') {
    return valueParser.stringify(node);
  }
  return node.value;
};

/**
 * Remove extra spaces from strings
 * @param {string} str
 */
const cleanString = (str) => {
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
        value: '',
      };
      queries[queries.length - 1].media = '(';
      for (const item of node.nodes) {
        if (item.type === 'function') {
          queries[queries.length - 1].media += valueParser.stringify(item);
        } else {
          queries[queries.length - 1].media +=
            (item.before || '') + item.value + (item.after || '');
        }
      }
      queries[queries.length - 1].media += ')';
    } else if (node.type === 'word' && /^@/gi.test(node.value)) {
      queries[queries.length] = {
        media: '(',
        value: '',
      };
      let media = node.value.replace(/^@/gi, '');
      if (Number.isNaN(parseInt(media, 10))) {
        media = `$${media}`;
      } else {
        media = `(${opts.shorthand}: ${
          parseInt(media, 10) + opts.shorthandValueAddition
        }${opts.shorthandUnit})`;
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
        node.type === 'function' &&
        ['', '@'].indexOf(node.value) === -1
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
        value: cleanString(value),
      };
    }),
  };
};

/**
 * Query class
 * @param {string} selector
 * @param {string} prop
 * @param {object} source
 * @param {object} content
 */
class Query {
  constructor(selector, prop, source, content) {
    this.selector = cleanString(selector);
    this.prop = cleanString(prop);
    this.source = source;

    const queries = content.queries.map(({ media, value }) => {
      const special =
        media.indexOf(':') !== -1 ||
        media.indexOf('--') !== -1 ||
        media.indexOf('>') !== -1 ||
        media.indexOf('<') !== -1;
      const parenthesis = media.replace(/^\(/gi, '').indexOf('(') !== -1;
      if ((special && parenthesis) || (!special && !parenthesis)) {
        media = media.replace(/^\(/gi, '').replace(/\)$/gi, '');
      }
      media = media.replace(/ or /gi, ',');

      return {
        media,
        value: cleanString(value),
      };
    });

    this.content = {
      base: content.base,
      queries,
    };
  }
}

/**
 * RulePack class
 * @param {string} rule
 * @param {string} selector
 */
class RulePack {
  constructor(rule, selector) {
    this.rules = [rule];
    this.parent = rule.parent;
    this.selector = selector;
    this.queries = [];
  }

  addQuery(rule, { prop, content }) {
    this.rules.push(rule);
    content.queries.forEach(({ media, value }) => {
      let foundMedia = false;
      this.queries.forEach((item) => {
        if (item.media === media && !foundMedia) {
          foundMedia = true;
          item.queries.push({
            prop,
            value,
          });
        }
      });
      if (!foundMedia) {
        this.queries.push({
          media,
          queries: [
            {
              prop,
              value,
            },
          ],
        });
      }
    });
  }
}

module.exports = (opts = {}) => {
  const inlineMedia = (root) => {
    const mediaQueries = [];

    root.walk((rule) => {
      if (rule.type !== 'decl') return;
      const value = rule.value;
      if (/@/gi.test(value)) {
        const content = parse(valueParser(value).nodes, {
          shorthand:
            typeof opts.shorthand === 'string' ? opts.shorthand : 'max-width',
          shorthandUnit:
            typeof opts.shorthandUnit === 'string' ? opts.shorthandUnit : 'px',
          shorthandValueAddition:
            typeof opts.shorthandValueAddition === 'number' &&
            !isNaN(opts.shorthandValueAddition)
              ? opts.shorthandValueAddition
              : 0,
        });

        const query = new Query(
          rule.parent.selector,
          rule.prop,
          rule.source,
          content,
        );
        if (
          mediaQueries.length &&
          mediaQueries[mediaQueries.length - 1].parent === rule.parent &&
          mediaQueries[mediaQueries.length - 1].selector === query.selector
        ) {
          mediaQueries[mediaQueries.length - 1].addQuery(rule, query);
        } else {
          const pack = new RulePack(rule, query.selector);
          pack.addQuery(rule, query);
          mediaQueries.push(pack);
        }

        if (content.base !== '') {
          rule.parent.insertBefore(rule, {
            prop: rule.prop,
            value: content.base,
          });
        }
      }
    });

    mediaQueries.forEach((mq) => {
      const nodeRoot = mq.parent.parent;

      mq.queries.forEach(({ media, queries, source }) => {
        const atRule = postcss.atRule({
          name: 'media',
          params: media,
        });

        const mediaRule = postcss.rule({
          selector: mq.selector,
        });
        queries.forEach(({ prop, value }) => {
          mediaRule.append({
            prop,
            value,
          });
        });
        atRule.append(mediaRule);
        atRule.source = source;

        nodeRoot.append(atRule);
      });

      mq.rules.forEach((rule) => {
        rule.remove();
      });
    });
  };

  return {
    postcssPlugin: 'postcss-inline-media',
    Once: inlineMedia,
  };
};

module.exports.postcss = true;
