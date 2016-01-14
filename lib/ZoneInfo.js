/*global console*/
var Path = require('path'),
    fs = require('fs'),
    time = require('time'),
    difficultTimeZoneIdToEnglishDisplayName = {
        "Antarctica/DumontDUrville": "Dumont d'Urville",
        "America/St_Thomas": "St. Thomas",
        "America/St_Vincent": "St. Vincent",
        "America/St_Lucia": "St. Lucia",
        "America/St_Johns": "St. John's",
        "America/St_Kitts": "St. Kitts"
    },
    nextYear = new Date().getFullYear() + 1,
    nextJanuary1st = new time.Date(nextYear, 0, 1),
    nextJuly1st = new time.Date(nextYear, 6, 1);

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

        // Try instantiating a time.Date object with this time zone.
        // If this throws an exception, node-time's set of time zones is somehow different
        // from /usr/share/zoneinfo/zone.tab:
        new time.Date(nextJanuary1st.getTime(), timeZoneId);

        that.numTimeZonesByTerritoryId[territoryId] = (that.numTimeZonesByTerritoryId[territoryId] || 0) + 1;
        that.territoryIdByTimeZoneId[timeZoneId] = territoryId;
        that.timeZoneIds.push(timeZoneId);

        time.tzset(timeZoneId);
        var localtimeNextJanuary1st = time.localtime(nextJanuary1st.getTime() / 1000),
            localtimeNextJuly1st = time.localtime(nextJuly1st.getTime() / 1000),
            utcStandardOffsetSeconds;
        if (localtimeNextJanuary1st.isDaylightSavings) {
            utcStandardOffsetSeconds = localtimeNextJuly1st.gmtOffset;
        } else {
            utcStandardOffsetSeconds = localtimeNextJanuary1st.gmtOffset;
        }
        that.utcStandardOffsetSecondsByTimeZoneId[timeZoneId] = utcStandardOffsetSeconds;
    });
}

ZoneInfo.prototype.timeZoneIdToEnglishDisplayName = function (timeZoneId) {
    if (timeZoneId in difficultTimeZoneIdToEnglishDisplayName) {
        return difficultTimeZoneIdToEnglishDisplayName[timeZoneId];
    }
    return timeZoneId.split("/").pop().replace(/_/g, ' ');
};


module.exports = ZoneInfo;
