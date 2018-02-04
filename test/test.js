var postcss = require('postcss');
var expect  = require('chai').expect;

var postcssInlineMedia = require('../');
var postcssSimpleVars = require('postcss-simple-vars');

var test = function (input, output, opts, done) {
    var plugins = [ postcssInlineMedia() ];
    if (opts.variable) {
        plugins.push(postcssSimpleVars());
    }
    postcss(plugins).process(input).then(function(result) {
        expect(result.css.replace(/\n|\r/g, ' ')).to.eql(output);
        expect(result.warnings()).to.be.empty;
        done();
    }).catch(function (error) {
        done(error);
    });
};

describe('postcss-inline-media', function () {

    describe('@(max-width: 800px)', function () {

        it('create media queries', function(done) {
            var input = 'div { margin: 20px @(max-width: 800px) 10px; }';
            var output = [
                'div { margin: 20px; }',
                '@media (max-width:800px) {',
                ' div { margin: 10px; } }'
            ].join(' ');
            test(input, output, {}, done);
        });

    });

    describe('@800', function () {

        it('create media queries', function(done) {
            var input = 'div { margin: 20px @800 10px; }';
            var output = [
                'div { margin: 20px; }',
                '@media (max-width: 800px) {',
                ' div { margin: 10px; } }'
            ].join(' ');
            test(input, output, {}, done);
        });

    });

    describe('multiples conditions', function () {

        it('create media queries', function(done) {
            var input = 'div { margin: 20px @800 10px @600 5px; }';
            var output = [
                'div { margin: 20px; }',
                '@media (max-width: 800px) {',
                ' div { margin: 10px; } }',
                '@media (max-width: 600px) {',
                ' div { margin: 5px; } }'
            ].join(' ');
            test(input, output, {}, done);
        });

    });

    describe('postcss simple variable', function () {

        it('create media queries', function(done) {
            var input = '$media: (print); div { margin: 20px @media 10px; }';
            var output = [
                'div { margin: 20px; }',
                '@media (print) {',
                'div { margin: 10px; } }'
            ].join(' ');
            test(input, output, {
                variable: true
            }, done);
        });

    });

});
