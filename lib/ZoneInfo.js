/*global console*/
var Path = require('path'),
    fs = require('fs'),
    moment = require('moment-timezone'),
    difficultTimeZoneIdToEnglishDisplayName = {
        "Antarctica/DumontDUrville": "Dumont d'Urville",
        "America/St_Thomas": "St. Thomas",
        "America/St_Vincent": "St. Vincent",
        "America/St_Lucia": "St. Lucia",
        "America/St_Johns": "St. John's",
        "America/St_Kitts": "St. Kitts"
    },
    nextYear = new Date().getFullYear() + 1,
    nextJanuary1st = new Date(nextYear, 0, 1),
    nextJuly1st = new Date(nextYear, 6, 1);

function ZoneInfo(zoneInfoPath) {
    var that = this;
    that.territoryIdByTimeZoneId = {};
    that.numTimeZonesByTerritoryId = {};
    that.utcStandardOffsetSecondsByTimeZoneId = {};
    that.timeZoneIds = [];
    fs.readFileSync(Path.resolve(zoneInfoPath, 'zone.tab'), 'ascii').split(/\r\n?|\n\r?/).forEach(function (line) {
        if (/^#|^\s*$/.test(line)) {
            return;
        }
        var fields = line.split("\t");
        if (fields.length < 3) {
            console.warn('Skipping ' + line, fields);
        }
        var territoryId = fields[0],
            timeZoneId = fields[2];

        // Try instantiating a moment-date in the timezone. moment-timezone carries
        // a stringified timezone-db which is instantiated as objects after they are
        // used the first time. After having attempted to use a timezone, we can
        // check if there's an instantiated version in it's internal object. We have
        // to do this, as it will fallback to UTC for an unknown timezone, and just
        // `console.log()` a warning.
        moment().tz(timeZoneId);
        var val = Object.values(moment.tz._zones).some(function (x) { return typeof x !== 'string' && x.name === timeZoneId ;});
        if (!val) {
            // If this throws an exception, moment-timezone's set of time zones is somehow different
            // from /usr/share/zoneinfo/zone.tab:
            throw new Error('Timezone ' + timeZoneId + ' not found in moment-timezone.');
        }

        that.numTimeZonesByTerritoryId[territoryId] = (that.numTimeZonesByTerritoryId[territoryId] || 0) + 1;
        that.territoryIdByTimeZoneId[timeZoneId] = territoryId;
        that.timeZoneIds.push(timeZoneId);

        var localtimeNextJanuary1st = moment.tz(nextJanuary1st.getTime(), timeZoneId),
            localtimeNextJuly1st = moment.tz(nextJuly1st.getTime(), timeZoneId),
            utcStandardOffsetMinutes;

        if (localtimeNextJanuary1st.isDST()) {
            utcStandardOffsetMinutes = localtimeNextJuly1st.utcOffset();
        } else {
            utcStandardOffsetMinutes = localtimeNextJanuary1st.utcOffset();
        }
        that.utcStandardOffsetSecondsByTimeZoneId[timeZoneId] = utcStandardOffsetMinutes * 60;
    });
}

ZoneInfo.prototype.timeZoneIdToEnglishDisplayName = function (timeZoneId) {
    if (timeZoneId in difficultTimeZoneIdToEnglishDisplayName) {
        return difficultTimeZoneIdToEnglishDisplayName[timeZoneId];
    }
    return timeZoneId.split("/").pop().replace(/_/g, ' ');
};


module.exports = ZoneInfo;
