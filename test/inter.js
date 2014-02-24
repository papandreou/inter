var expect = require('unexpected');

describe('inter', function () {
    var inter = require('../build/en_us');

    describe('#renderDate()', function () {
        var d = new Date(2013, 11, 6, 10, 54, 10);

        it('should format a date according to the mediumDateTime format', function () {
            expect(inter.renderDate(d, 'mediumDateTime'), 'to equal', 'Dec 6, 2013, 10:54:10 am');
        });

        it('should use the fullDateTime format if the formatId parameter is omitted', function () {
            var timeZoneOffsetStr = d.toTimeString().match(/GMT([-+]\d\d\d\d)/)[1].replace(/(\d\d)$/, ':$1');
            expect(inter.renderDate(d), 'to equal', 'Friday, December 6, 2013 at 10:54:10 am ' + timeZoneOffsetStr);
        });
    });

    describe('#renderList()', function () {
        it('should should render a list according to the unitNarrow pattern', function () {
            expect(inter.renderList(['foo', 'bar', 'quux'], 'unitNarrow'), 'to equal', 'foo bar quux')
        });

        it('should use the default format when the type parameter is omitted', function () {
            expect(inter.renderList(['foo', 'bar', 'quux']), 'to equal', 'foo, bar, and quux')
        });
    });

    describe('#renderNumber', function () {
        it('should render a number in the Indian English locale (#11)', function () {
            expect(require('../build/en_in').renderNumber(10000000.23), 'to equal', '10,000,000.23');
        });
    });

    describe('#renderNumber', function () {
        it('should render a number in the Danish locale (#11)', function () {
            expect(require('../build/da').renderNumber(10000000.23), 'to equal', '10,000,000.23');
        });
    });
});
