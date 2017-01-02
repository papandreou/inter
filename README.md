inter
=====

[![NPM version](https://badge.fury.io/js/inter.svg)](http://badge.fury.io/js/inter)
[![Build Status](https://travis-ci.org/papandreou/inter.svg?branch=master)](https://travis-ci.org/papandreou/inter)
[![Coverage Status](https://coveralls.io/repos/papandreou/inter/badge.svg)](https://coveralls.io/r/papandreou/inter)
[![Dependency Status](https://david-dm.org/papandreou/inter.svg)](https://david-dm.org/papandreou/inter)

A JavaScript locale library that can be used to render dates, date and
date-time intervals, numbers, lists, and more. Also contains localized
display names for countries, regions, languages, time zones, and
currencies. Most of the informations comes from the <a
href="http://cldr.unicode.org/">Unicode CLDR</a> (Common Localization
Data Repository) and is extracted using the <a
href="https://github.com/papandreou/node-cldr">cldr module</a>.

Installation
============

Make sure you have <a href="http://nodejs.org/">node.js</a> and <a
href="http://npmjs.org/">npm</a> installed, then run:

```
$ npm install -g inter
```

Usage
=====

To use inter in node.js, just require the library and use the `load`
method to get an `inter` object with information about a specific
locale:

```javascript
var localeId = 'en_US',
    inter = require('inter').load(localeId);
```

In the browser you'll most likely want to build a version with only
the specific features and locales you need. There's a `buildInter`
script in the package that's useful for that. You can build one
completely self-contained file per locale by specifying `--type
browser`.

You can also build a single file with the data for all locales using
`--type bundle`. The active locale will be determined by the value of
the `LOCALEID` variable when the bundle is loaded into the
browser. This is tailored especially for <a
href="https://github.com/One-com/assetgraph-builder">assetgraph-builder</a>
with the `--locales` switch. Working with a single file is convenient
during development. When doing a production build UglifyJS' dead code
elimination will be used to strip the library down after
`buildProduction` has created separate versions of your JavaScript
for each locale.

Reference
=========

#### inter.countries

An array of objects representing country display names. The array is
ordered by display name and contains some additional properties:

```javascript
require('inter').load('da').countries[0];
{ id: 'AF',
  displayName: 'Afghanistan',
  regionId: '034',
  hasTimeZones: true }
```

#### inter.getCountry(countryId)


Get info about a specific country (queried by ID):

```javascript
require('inter').load('sv').getCountry('SE');
{ id: 'SE',
  displayName: 'Sverige',
  regionId: '154',
  hasTimeZones: true }
```

#### inter.regions


An array of objects with region display names and some additional info. The array is
ordered by display name. Superset of `inter.countries` and
`inter.regions`.

```javascript
require('inter').load('en_US').regions;
[ { id: '002',
    displayName: 'Africa',
    hasTimeZones: false },
  { id: '019',
    displayName: 'Americas',
    hasTimeZones: false },
  [...]
  { id: '001',
    displayName: 'World',
    hasTimeZones: false } ]
```

#### inter.getRegion(regionId)

Get info about a specific region, queried by ID:

```javascript
require('inter').load('en_US').getRegion('018');
{ id: '018',
  displayName: 'Southern Africa',
  hasTimeZones: false }
```

#### inter.territories

An array of objects with territory display names and some additional info. The array is
ordered by display name and contains some additional
properties. Superset of `inter.countries` and `inter.regions`.

```javascript
require('inter').load('en_US').territories;
[ { id: 'AF',
    displayName: 'Afghanistan',
    regionId: '034',
    hasTimeZones: true },
  { id: '002',
    displayName: 'Africa',
    hasTimeZones: false },
  [...]
  { id: 'AX',
    displayName: 'Åland Islands',
    regionId: '154',
    hasTimeZones: true } ]
```

#### inter.getTerritory(territoryId)

Get info about a specific territory, queried by ID (can be either a
region or a country):

```javascript
require('inter').load('en_US').getTerritory('US');
{ id: 'US',
  displayName: 'United States',
  regionId: '021',
  hasTimeZones: true }
```

#### inter.timeZones

An array of objects representing all available time zone display names
plus some additional info (Olson/tzdata ID, UTC offset, and the ID of
the country it belongs to). The array is ordered by UTC offset and
secondarily by display name:

```javascript
require('inter').load('da').timeZones;
[ { id: 'Pacific/Midway',
    utcStandardOffsetSeconds: -39600,
    displayName: 'Midway',
    countryId: 'UM' },
  [...]
  { id: 'Pacific/Kiritimati',
    regionId: '057',
    utcStandardOffsetSeconds: 50400,
    displayName: 'Kiritimati',
    countryId: 'KI' } ]
```

#### inter.getTimeZone(timeZoneId)

Get info about a specific time zone (queried by its Olson/tzdata ID):

```javascript
require('inter').load('da').getTimeZone('Europe/Copenhagen');
{ id: 'Europe/Copenhagen',
  regionId: '154',
  utcStandardOffsetSeconds: 3600,
  displayName: 'København',
  countryId: 'DK' }
```

#### inter.languages

An array of objects representing all available language display names
plus some additional info. The array is ordered by display name:

```javascript
require('inter').load('en_US').languages;
[ { id: 'aa',
    displayName: 'Afar',
    nativeDisplayName: 'Qafar' },
  { id: 'ab', displayName: 'Abkhazian' },
  { id: 'ace', displayName: 'Achinese' },
  [...]
  { id: 'zxx',
    displayName: 'No linguistic content' },
  { id: 'zza', displayName: 'Zaza' } ]
```

#### inter.getLanguage(languageId)

Get info about a specific language, queried by its ID:

```javascript
require('inter').load('en_US').getLanguage('zh_hans');
{ id: 'zh_hans',
  displayName: 'Simplified Chinese',
  nativeDisplayName: '简体中文' }
```

#### inter.currencies

An array of objects with all available currency display names,
including ids and symbols and instructions for displaying different
quantities:

```javascript
require('inter').load('sv').currencies;
[ { id: 'AWG',
    displayName: 'Aruba-gulden',
    one: 'Aruba-florin',
    other: 'Aruba-floriner' },
  { id: 'BSD',
    displayName: 'Bahamas-dollar',
    symbol: 'BS$',
    one: 'Bahamas-dollar',
    other: 'Bahamas-dollar' },
  [...]
  { id: 'DDM',
    displayName: 'östtysk mark',
    one: 'östtysk mark',
    other: 'östtyska mark' } ]
```

#### inter.getCurrency(currencyId)

Get info about a specific currency, queried by its ID:

```javascript
require('inter').load('ar').getCurrency('ZRN');
{ id: 'ZRN',
  displayName: 'زائير زائيري جديد',
  symbol: undefined,
  zero: 'زائير زائيري جديد',
  one: 'زائير زائيري جديد',
  two: 'زائير زائيري جديد',
  few: 'زائير زائيري جديد',
  many: 'زائير زائيري جديد',
  other: 'زائير زائيري جديد' }
```

#### inter.scripts

An array of objects with all available script display names, including
IDs:

```javascript
require('inter').load('en_US').scripts;
[ { id: 'Afak', displayName: 'Afaka' },
  { id: 'Hluw',
    displayName: 'Anatolian Hieroglyphs' },
  [...]
  { id: 'Wole', displayName: 'Woleai' },
  { id: 'Yiii', displayName: 'Yi' } ]
```

#### inter.getScript(scriptId)

Get info about a specific script, queried by its ID:

```javascript
require('inter').load('en_US').getScript('Sgnw');
{ id: 'Sgnw', displayName: 'SignWriting' }
```

#### inter.renderSpelloutNumbering(number)

```javascript
require('inter').load('en_US').renderSpelloutNumbering(53723);
'fifty-three thousand seven hundred twenty-three'
```

The library must be built with the `--rbnf` switch.

#### inter.renderDigitsOrdinal(number)

```javascript
require('inter').load('en_US').renderDigitsOrdinal(42);
'42nd'
```

The library must be built with the `--rbnf` switch.

#### inter.pluralRule(number)

Determine the locale's plural form for a given number, eg. `"one"`,
`"two"`, `"few"`, `"zero"`, `"many"`, or `"other"`.

See the <a
href="http://unicode.org/repos/cldr/trunk/specs/ldml/tr35.html#Language_Plural_Rules">LDML
spec</a> for more information.

The library must be built with the `--pluralrules` switch.

#### inter.renderList(itemArray[, 'unit'|'unitShort'|'unitNarrow'|'default'])

Render a list of items using the list patterns. The locale library must be built with the `--listpatterns` switch.

Example:

```javascript
inter.renderList(['foo', 'bar', 'quux']); // "foo, bar, and quux" (en_US).
```

#### inter.renderUnit(number, 'durationWeek'|'energyJoule'|'frequencyMegahertz'|...)

#### inter.getUnitRenderer('durationWeek'|'energyJoule'|'frequencyMegahertz'|...)

Render (or get a renderer function for) a specific unit. The
locale library must be built with the `--unitpatterns` switch.

Example:

```javascript
inter.getUnitRenderer('durationWeek')(1); // '1 week' (en_US)
inter.getUnitRenderer('durationMonth')(5); // '5 months' (en_US)
inter.renderUnit(1, 'durationWeek'); // '1 week' (en_US)
```

#### inter.renderNumber(number[, numberFormat[, numberSystemId]])

#### inter.getNumberRenderer([numberFormat[, numberSystemId]])

Render (or get a renderer function for) a number according to the
specified <a
href="http://www.unicode.org/reports/tr35/tr35-29.html#Number_Format_Patterns">ICU
DecimalFormat</a> (defaults to the locale standard number format for
the locale).

#### inter.renderPercentage(number[, numDecimals[, numberSystemId]])

#### inter.getPercentageRenderer([numDecimals[, numberSystemId]])

Render (or get a renderer function for) a percentage according to the
number format and percent char of the locale. The library must be
built with the `--numberformats` switch.

Example:

```javascript
inter.getPercentageRenderer(1)(1.0056); // '105.6 %' (en_US)
inter.renderPercentage(1.0056, 1); // '105.6 %' (en_US)
```

#### inter.renderFileSize(number[, numDecimals])

#### inter.getFileSizeRenderer([numDecimals])

Render (or get a renderer function for) a number of bytes according to
the number format of the locale. The units themselves (bytes, KB, MB,
etc.) aren't localized yet, sorry. The library must be built with the
`--numberformats` switch.

Example:

```javascript
inter.getFileSizeRenderer(1)(100000); // '97.7 KB' (en_US)
inter.renderFileSize(100000, 1); // '97.7 KB' (en_US)
```

#### inter.renderDate(date, dateFormatId)

#### inter.getDateRenderer(dateFormatId)

Render (or get a renderer function for) one of the locale's standard
full/long/medium/short time or date formats, or a locale-specifc
format specified by a <a
href='http://unicode.org/reports/tr35/#dateFormats'>CLDR
`dateFormatItem` id</a>. The library must be built with the
`--dateformats` switch.

Examples:

```javascript
var aprilFourth = new Date(2010, 3, 4);
inter.getDateRenderer('mediumTime')(new Date(2010, 5, 7, 22, 30); // '10:30:00 pm' (en_US)
inter.getDateRenderer('longDate')(new Date(2010, 5, 7, 22, 30); // 'June 7, 2010' (en_US)
inter.renderDate(aprilFourth, 'fullDate'); // "Sunday, April 4, 2010" (en_US)
inter.renderDate(aprilFourth, 'shortTime'); // "12:00 am" (en_US)
inter.renderDate(aprilFourth, 'MMMMEd'); // "Sun, April 4" (en_US)
```

#### inter.renderDateInterval(dateInterval, dateFormatId)

#### inter.getDateIntervalRenderer(dateFormatId)

Render (or get a renderer function for) a date or date-time interval
that uses one of the locale's standard full/long/medium/short time or
date formats, or a locale-specific format specified by a CLDR
`dateFormatItem` id (<a
href='http://unicode.org/reports/tr35/#timeFormats'>see some
examples</a>). The library must be built with the
`--dateintervalformats` switch.

Examples:

```javascript
var dateIntervalRenderer = inter.getDateIntervalRenderer("yMMMM"),
    januaryThroughApril = {start: new Date(2010, 0, 1), end: new Date(2010, 4, 0)};
dateIntervalRenderer(januaryThroughApril); // "January-April 2010" (en_US)

inter.renderDateInterval({
    start: new Date(2012, 9, 7, 9, 30),
    end: new Date(2012, 9, 7, 11, 30)
}, 'hm'); // "9:30–11:30 am" (en_US)
```

Additional helper methods
=========================

#### inter.tokenizePattern(patternString)

Helper function for tokenizing an ICU pattern with placeholders.

Example:

```javascript
inter.tokenizePattern('My name is {0}'); // [{type: 'text', value: 'My name is '}, {type: 'placeHolder', value: 0}]
```

#### inter.getPatternRenderer(patternString)

Get an optimized function for rendering a specific pattern. The
function accepts the placeholder values as arguments.

Example:

```javascript
inter.getPatternRenderer('My name is {0}')('George'); // 'My name is George'
```

#### inter.tokenizeDateFormat(icuDateFormat)

Helper function for parse a date format into `text` and `field` tokens. The locale library must be built with the `--dateformats` switch.

Example:

```javascript
inter.tokenizeDateFormat('dddd-m')); // [{type: 'field', value: 'dddd'}, {type: 'text', value: '-'}, {type: 'field', value: 'm'}]
```

#### inter.getDateFormat(formatId)

Get one of the locale's standard full/long/medium/short time or date
formats, or a locale-specific format specified by a CLDR
`dateFormatItem` id (see <a
href='http://unicode.org/reports/tr35/#dateFormats'>see some
examples</a>). The locale library must be built with the
`--dateformats` switch.

Examples:

```javascript
inter.getDateFormat('fullDate'); // 'l, F j, Y' (en_US)
inter.getDateFormat('yMMdd'); // 'MM/dd/y' (en_US)
inter.getDateFormat('mediumTime'); // 'h:mm:ss a' (en_US)
```


License
-------

inter is licensed under a standard 3-clause BSD license -- see the
`LICENSE`-file for details.
