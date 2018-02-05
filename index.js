var postcss = require('postcss');
var glob = require('glob');
var valueParser = require('postcss-value-parser');


function parse(nodes, opts) {

    var base = '';
    var querys = [];

    var nestedQuery = false;

    for (var i = 0; i < nodes.length; i++) {

        var node = nodes[i];

        if (node.type == 'function' && node.value === '') {
            var nested = parse(node.nodes, { base: base });
            for (var j = 0; j < nested.querys.length; j++) {
                nested.querys[j].value = base + nested.querys[j].value;
                querys.push(nested.querys[j]);
            }
            base = base + nested.base;
            nestedQuery = true;
        }
        else if (node.type == 'function' && node.value === '@') {
            querys[querys.length] = {
                media: '(',
                value: ''
            };
            querys[querys.length - 1].media = '(';
            for (var j = 0; j < node.nodes.length; j++) {
                var item = node.nodes[j];
                if (item.type == 'function') {
                    querys[querys.length - 1].media += valueParser.stringify(item);
                } else {
                    querys[querys.length - 1].media += ((item.before || '') + item.value + (item.after || ''));
                }
            }
            querys[querys.length - 1].media += ')';
        }
        else if (node.type == 'word' && /^@/gi.test(node.value)) {
            querys[querys.length] = {
                media: '(',
                value: ''
            };
            var media = node.value.replace(/^@/gi, '');
            if (parseInt(media) != media) {
                media = '$' + media;
            }
            else {
                media = '(max-width: ' + media + 'px)';
            }
            querys[querys.length - 1].media = media;
        }
        else if (querys.length > 0) {
            if (nestedQuery) {
                for (var j = 0; j < querys.length; j++) {
                    if (node.type == 'function') {
                        querys[j].value += valueParser.stringify(node);
                    } else {
                        querys[j].value += node.value;
                    }
                }
            }
            else {
                if (node.type == 'function') {
                    querys[querys.length - 1].value += valueParser.stringify(node);
                } else {
                    querys[querys.length - 1].value += node.value;
                }
            }
        }

        if (nestedQuery && ['word', 'space'].indexOf(node.type) > -1) {
            base += node.value;
        }

        if (!nestedQuery && querys.length < 1) {
            if (node.type == 'function') {
                base += valueParser.stringify(node);
            } else {
                base += node.value;
            }
        }

    }

    return {
        base: base,
        querys: querys
    };

}

module.exports = postcss.plugin('responsive', function() {
    return function (css, result) {

        css.walk(function(rule) {
            if (rule.type == 'decl') {

                var root = rule.root(),
                    value = rule.value;

                if (/@/gi.test(value)) {

                    var parsed = valueParser(value);

                    var content = parse(parsed.nodes);

                    if (content.base.replace(/ /gi, '') !== '') {
                        rule.parent.insertBefore(rule, {
                            prop: rule.prop,
                            value: content.base.replace(/\s\s+|^ | $/g, ' ').replace(/^ | $/g, '')
                        });
                    }

                    for (var i = 0; i < content.querys.length; i++) {

                        var q = content.querys[i];
                        var media = q.media;

                        var color = media.indexOf(':') > -1;
                        var parenthesis = media.replace(/^\(/gi, '').indexOf('(') > -1;

                        if ((color && parenthesis) || (!color && !parenthesis)) {
                            media = media.replace(/^\(/gi, '').replace(/\)$/gi, '');
                        }

                        media = media.replace(/ or /gi, ',');

                        var atRule = postcss.atRule({
                            name: 'media',
                            params: media
                        });
                        var mediaRule = postcss.rule({
                            selector: rule.parent.selector,
                        });
                        mediaRule.append({
                            prop: rule.prop,
                            value: q.value.replace(/\s\s+|^ | $/g, ' ').replace(/^ | $/g, '')
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
