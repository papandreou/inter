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
});
