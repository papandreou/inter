/*global describe, it, beforeEach, afterEach*/
var expect = require('unexpected');
var icalJs = require('ical.js');

describe('inter', function () {
    var inter = require('../build/en_us');

    describe('#renderDate()', function () {
        var d = new Date(2013, 11, 6, 10, 54, 10);

        it('should format a date according to the mediumDateTime format', function () {
            expect(inter.renderDate(d, 'mediumDateTime'), 'to equal', 'Dec 6, 2013, 10:54:10 am');
        });

        it('should use the fullDateTime format if the formatId parameter is omitted', function () {
            expect(inter.renderDate(d), 'to match', /^Friday, December 6, 2013 at 10:54:10 am [+-]/);
        });

        describe('with a negative time zone offset (GMT-02:00)', function () {
            var originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
            beforeEach(function () {
                Date.prototype.getTimezoneOffset = function () {
                    return 120; // This is a bit of a wtf, I would expect it to return -120, but it doesn't
                };
            });
            afterEach(function () {
                Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
            });

            it('should render the time zone offset correctly', function () {
                expect(inter.renderDate(new Date(2016, 0, 15, 11, 30), 'fullDateTime'), 'to equal', 'Friday, January 15, 2016 at 11:30:00 am -02:00');
            });
        });

        describe('with a positive time zone offset (GMT+02:00)', function () {
            var originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
            beforeEach(function () {
                Date.prototype.getTimezoneOffset = function () {
                    return -120; // This is a bit of a wtf, I would expect it to return 120, but it doesn't
                };
            });
            afterEach(function () {
                Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
            });

            it('should render the time zone offset correctly', function () {
                expect(inter.renderDate(new Date(2016, 0, 15, 11, 30), 'fullDateTime'), 'to equal', 'Friday, January 15, 2016 at 11:30:00 am +02:00');
            });
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

        describe('with an ical.js-ish object passed instead of a Date instance', function () {
            it('should render the basic fields correctly', function () {
                expect(inter.renderDate(new icalJs.Time({
                    year: 2016,
                    month: 1,
                    day: 14,
                    hour: 17,
                    minute: 48,
                    second: 4
                }), 'mediumDateTime'), 'to equal', 'Jan 14, 2016, 5:48:04 pm');
            });

            describe('to #renderDateFormat', function () {
                it('should render a date in the MMMM y format', function () {
                    var date = new icalJs.Time({ year: 2016, month: 1 });
                    expect(
                        inter.renderDateFormat(date, 'MMMM y'),
                        'to equal',
                        'January 2016'
                    );
                });
            });

            describe('to #renderDateInterval', function () {
                it('should render a date in the MMMM y format (greatestDifferences)', function () {
                    var dateInterval = {
                        start: new icalJs.Time({ year: 2016, month: 1 }),
                        end: new icalJs.Time({ year: 2016, month: 4 })
                    };
                    expect(
                        inter.renderDateInterval(dateInterval, 'MMMMd'),
                        'to equal',
                        'January 1 – April 1'
                    );
                });

                it('should render a date in the dateTime format', function () {
                    var dateInterval = {
                        start: new icalJs.Time({ year: 2016, month: 1, date: 12, hour: 10, minute: 4 }),
                        end: new icalJs.Time({ year: 2016, month: 4, date: 12, hour: 10, minute: 4 })
                    };
                    expect(
                        inter.renderDateInterval(dateInterval, 'yMM'),
                        'to equal',
                        '01/2016 – 04/2016'
                    );
                });
            });

            it('should render the time zone', function () {
                var component = new icalJs.Component(icalJs.parse(
                    "BEGIN:VCALENDAR\n" +
                    "CALSCALE:GREGORIAN\n" +
                    "METHOD:REQUEST\n" +
                    "PRODID:-//Apple Inc.//iPhone 3.0//EN\n" +
                    "VERSION:2.0\n" +
                    "BEGIN:VTIMEZONE\n" +
                    "TZID:Europe/Berlin\n" +
                    "BEGIN:STANDARD\n" +
                    "DTSTART:20151025T030000\n" +
                    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\n" +
                    "TZNAME:CET\n" +
                    "TZOFFSETFROM:+0200\n" +
                    "TZOFFSETTO:+0100\n" +
                    "END:STANDARD\n" +
                    "BEGIN:DAYLIGHT\n" +
                    "DTSTART:20160327T020000\n" +
                    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\n" +
                    "TZNAME:CEST\n" +
                    "TZOFFSETFROM:+0100\n" +
                    "TZOFFSETTO:+0200\n" +
                    "END:DAYLIGHT\n" +
                    "END:VTIMEZONE\n" +
                    "BEGIN:VEVENT\n" +
                    "CLASS:PUBLIC\n" +
                    "CREATED:20160121T221129Z\n" +
                    "DTEND;TZID=Europe/Berlin:20160122T114500\n" +
                    "DTSTAMP:20160121T221129Z\n" +
                    "DTSTART;TZID=Europe/Berlin:20160122T113000\n" +
                    "LAST-MODIFIED:20160121T221129Z\n" +
                    "RECURRENCE-ID;TZID=Europe/Berlin:20160122T114500\n" +
                    "SEQUENCE:0\n" +
                    "SUMMARY:Test\n" +
                    "TRANSP:OPAQUE\n" +
                    "UID:07339337-06E2-47AA-92A6-33B4AA3D3046\n" +
                    "END:VEVENT\n" +
                    "END:VCALENDAR\n"
                ));

                component.getAllSubcomponents('vtimezone').forEach(function (vtimezone) {
                    if (!(icalJs.TimezoneService.has(vtimezone.getFirstPropertyValue('tzid')))) {
                        icalJs.TimezoneService.register(vtimezone);
                    }
                });

                var vevent = new icalJs.Event(component.getFirstSubcomponent('vevent'));
                expect(inter.renderDate(vevent.startDate, 'fullDateTime'), 'to equal', 'Friday, January 22, 2016 at 11:30:00 am +01:00');
            });
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
            expect(inter.renderCurrencyLong(134.40, 'USD'), 'to equal', 'USD\xa0134.40');
        });

        it('should render a float with a currency, with a different amount of decimals', function () {
            expect(inter.renderCurrencyLong(134.40, 'USD', 'latn', 1), 'to equal', 'USD\xa0134.4');
        });

        it('should render a number in the Dutch locale', function () {
            expect(require('../build/nl').renderCurrencyLong(134.40, 'EUR'), 'to equal', 'EUR\xa0134,40');
        });
    });

    var basicInter = require('../lib/inter');
    describe('#makePatternRenderer', function () {
        it('should return a function that renders the given pattern', function () {
            expect(basicInter.makePatternRenderer('{1} the {0} is even...')(['foo', 'what']), 'to equal', 'what the foo is even...');
        });

        it('should support predefined placeholder values', function () {
            expect(basicInter.makePatternRenderer('{1} the {0} is even...', 'blah', 'yadda')(['foo', 'what']), 'to equal', 'yadda the blah is even...');
        });

        it('should support a predefined placeholder value combined with one provided to the renderer', function () {
            expect(basicInter.makePatternRenderer('{1} the {0} is even...', 'blah')(['foo', 'what']), 'to equal', 'what the blah is even...');
        });
    });

    describe('#makeFileSizeRenderer', function () {
        it('should return a function that renders a file size < 1 KB', function () {
            expect(inter.makeFileSizeRenderer()(959), 'to equal', '959 bytes');
        });

        it('should return a function that renders a KB value', function () {
            expect(inter.makeFileSizeRenderer()(10000), 'to equal', '10 KB');
        });

        it('should return a function that renders a KB value with one decimal', function () {
            expect(inter.makeFileSizeRenderer(1)(10000), 'to equal', '9.8 KB');
        });

        it('should return a function that renders a MB value', function () {
            expect(inter.makeFileSizeRenderer()(10000000), 'to equal', '10 MB');
        });

        it('should return a function that renders a MB value with one decimal', function () {
            expect(inter.makeFileSizeRenderer(1)(10000000), 'to equal', '9.5 MB');
        });

        it('should return a function that renders a GB value', function () {
            expect(inter.makeFileSizeRenderer()(10000000000), 'to equal', '9 GB');
        });

        it('should return a function that renders a GB value with one decimal', function () {
            expect(inter.makeFileSizeRenderer(1)(10000000000), 'to equal', '9.3 GB');
        });

        it('should return a function that renders a TB value', function () {
            expect(inter.makeFileSizeRenderer()(10000000000000), 'to equal', '9 TB');
        });

        it('should return a function that renders a TB value with one decimal', function () {
            expect(inter.makeFileSizeRenderer(1)(10000000000000), 'to equal', '9.1 TB');
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
});
