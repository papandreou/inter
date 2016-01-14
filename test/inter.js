/*global describe, it*/
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

        it('should accept a number (epoch milliseconds) instead of a Date instance', function () {
            expect(inter.renderDate(5000, 'shortDate'), 'to equal', '1/1/1970');
        });

        it('should accept a parsable date string instead of a Date instance', function () {
            expect(inter.renderDate('Nov 18 2014 18:00', 'shortDate'), 'to equal', '11/18/2014');
        });

        it('should use the regular month format when using the L format character', function () {
            expect(require('../build/fi').renderDateFormat(new Date('Nov 18 2014 18:00'), 'MMMM'), 'to equal', 'marraskuuta');
        });

        it('should use the standalone month format when using the L format character', function () {
            expect(require('../build/fi').renderDateFormat(new Date('Nov 18 2014 18:00'), 'LLLL'), 'to equal', 'marraskuu');
        });
    });

    describe('#renderList()', function () {
        it('should should render a list according to the unitNarrow pattern', function () {
            expect(inter.renderList(['foo', 'bar', 'quux'], 'unitNarrow'), 'to equal', 'foo bar quux');
        });

        it('should use the default format when the type parameter is omitted', function () {
            expect(inter.renderList(['foo', 'bar', 'quux']), 'to equal', 'foo, bar, and quux');
        });
    });

    describe('#renderNumber', function () {
        it('should render a number in the Indian English locale (#11)', function () {
            expect(require('../build/en_in').renderNumber(10000000.23), 'to equal', '10,000,000.23');
        });

        it('should render a number in the Danish locale (#11)', function () {
            expect(require('../build/da').renderNumber(10000000.23), 'to equal', '10.000.000,23');
        });
    });

    describe('#renderPercentage', function () {
        it('should accept the number of decimals as the second parameter', function () {
            expect(require('../build/da').renderPercentage(12.345678, 2), 'to equal', '1.234,57\xa0%');
        });

        it('should accept the number system as the third parameter', function () {
            expect(require('../build/da').renderPercentage(12.345678, 2, 'mlym'), 'to equal', '൧.൨൩൪,൫൭\xa0%');
        });
    });

    describe('#renderUnit', function () {
        it('should render a singular number of units', function () {
            expect(inter.renderUnit(1, 'durationWeek'), 'to equal', '1 week');
        });

        it('should render a plural number of units', function () {
            expect(inter.renderUnit(2, 'durationWeek'), 'to equal', '2 weeks');
        });

        it('should render in the narrow format', function () {
            expect(inter.renderUnit(1, 'durationWeek', 'narrow'), 'to equal', '1w');
        });
    });

    describe('#renderCurrencyShort', function () {
        it('should render a float with a currency', function () {
            expect(inter.renderCurrencyShort(134.40, 'USD'), 'to equal', '$134.40');
        });

        it('should render a float with a currency, with a different amount of decimals', function () {
            expect(inter.renderCurrencyShort(134.40, 'USD', 'latn', 1), 'to equal', '$134.4');
        });

        it('should render a number in the Dutch locale', function () {
            expect(require('../build/nl').renderCurrencyShort(134.40, 'EUR'), 'to equal', '€ 134,40');
        });
    });

    describe('#renderCurrencyLong', function () {
        it('should render a float with a currency', function () {
            expect(inter.renderCurrencyLong(134.40, 'USD'), 'to equal', 'USD 134.40');
        });

        it('should render a float with a currency, with a different amount of decimals', function () {
            expect(inter.renderCurrencyLong(134.40, 'USD', 'latn', 1), 'to equal', 'USD 134.4');
        });

        it('should render a number in the Dutch locale', function () {
            expect(require('../build/nl').renderCurrencyLong(134.40, 'EUR'), 'to equal', 'EUR 134,40');
        });
    });

    describe('#makeUnitRenderer', function () {
        it('should render in the narrow format', function () {
            expect(inter.makeUnitRenderer('durationWeek', 'narrow')(1), 'to equal', '1w');
        });
    });

    describe('#adaptICUFormat', function () {
        it('should adapt a pattern that uses L correctly when the format id uses M', function () {
            expect(require('../build/fi').adaptICUFormat('LLL', 'MMMM'), 'to equal', 'LLLL');
        });
    });

    it('it should ', function () {
        expect(require('../build/fi').renderDate(new Date(2015, 10, 1), 'MMMM'), 'to equal', 'marraskuu');
    });
});
