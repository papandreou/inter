buildlocale
===========

A module that extracts a bunch of information from the CLDR database
and builds a JavaScript object that can be used to render dates,
date intervals, numbers, lists, and more.

Intended for use with `buildProduction --locale` (see <a
href="https://github.com/One-com/assetgraph-builder">AssetGraph-builder</a>),
but can also be used on its own.

Installation and building
=========================

Make sure you have <a href="http://nodejs.org/">node.js</a> and <a
href="http://npmjs.org/">npm</a> installed, then run:

    $ npm install -g buildlocale

You now have the `buildLocale` binary in your $PATH.

Next up you need to download a <a
href="http://cldr.unicode.org/index/downloads">CLDR release</a> or
checkout the <a href="http://unicode.org/repos/cldr/">Subversion
repo</a>.

Next up, build your custom library by running `buildLocale` and tell
it where to find your CLDR files and which locales and features you
want:

```
buildLocale --cldrpath /path/to/cldr/root/dir -o myLocaleLib.js --locale en,da,fr --localeidvar LOCALEID --dateformats --numberformats ...
```

This produces a single (large) JavaScript file containing all the
features for all the locales. The value of the JavaScript variable
`theLocaleId` will determine which locale will become active. Set it
before `myLocaleLib.js` is loaded.

To cut down the size of the locale library for production use I
recommend using assetgraph-builder (`buildProduction --locale ...`) or
`uglifyjs myLocaleLib.js --define LOCALEID=\"fr\"` etc. to produce an
optimized version for each locale (I've been told that Closure
compiler has a similar feature).

Further `buildLocale` options:

<dl>
<dt>`--dateformats`</dt><dd>Include date and time formats (adds `one.locale.dateFormats` and a bunch of methods, see below)</dd>
<dt>`--intervalformats`</dt><dd>Include date and time interval formats (adds `one.locale.intervalFormats` and a bunch of methods). NOT YET FULLY OPERATIONAL, relies on some DateInterval classes that haven't been open sourced (yet) -- sorry!</dd>
<dt>`--numberformats`</dt><dd>Include number formats (adds `one.locale.numberSymbols`, `one.locale.getNumberRenderer`, `one.locale.getFileSizeRenderer`, and `one.locale.getPercentageRenderer`)</dd>
<dt>`--delimiters`</dt><dd>Include quotation delimiters (adds `one.locale.delimiters`)</dd>
<dt>`--listpatterns`</dt><dd>Include list formats (`one.locale.listPatterns` and `one.locale.renderList`)</dd>
<dt>`--unitpatterns`</dt><dd>Include unit patterns (`one.locale.unitPatterns` and `one.locale.getUnitRenderer`)</dd>
<dt>`--timezoneinfo`</dt><dd>Include time zone info and display names (`one.locale.timeZoneInfo`)</dd>
<dt>`--countryinfo`</dt><dd>Include country info and display names (`one.locale.countryInfo`)</dd>
<dt>`--regioninfo`</dt><dd>Include region info and display names (`one.locale.regionInfo`)</dd>
<dt>`--localeinfo`</dt><dd>Include locale info and display names (`one.locale.localeInfo`). Only includes information about the locales included in the build</dd>
<dt>`--pluralrules`</dt><dd>Include plural rules (`one.locale.getQuantity`)</dd>
<dt>`--exemplarcharacters`</dt><dd>Include exemplar characters (`one.locale.exemplarCharacters`)</dd>
</dl>

Usage
=====


one.locale.renderList(<itemArray>)
----------------------------------

Render a list of items using the list patterns. The locale library must be built with the `--listpatterns` switch.

Example:

```javascript
one.locale.renderList(['foo', 'bar', 'quux']); // "foo, bar, and quux" (en_US).
```

one.locale.tokenizePattern(<patternString>)
-------------------------------------------

Helper function for tokenizing an ICU pattern with placeholders.

Example:

```javascript
one.locale.tokenizePattern('My name is {0}'); // [{type: 'text', value: 'My name is '}, {type: 'placeHolder', value: 0}]
```

one.locale.getPatternRenderer(<patternString>)
----------------------------------------------

Get an optimized function for rendering a specific pattern. The
function accepts the placeholder values as arguments.

Example:

```javascript
one.locale.getPatternRenderer('My name is {0}')('George'); // 'My name is George'
```

one.locale.tokenizeDateFormat(<icuDateFormat>)
----------------------------------------------

Helper function for parse a date format into `text` and `field` tokens. The locale library must be built with the `--dateformats` switch.

Example:

```javascript
one.locale.tokenizeDateFormat('dddd-m')); // [{type: 'field', value: 'dddd'}, {type: 'text', value: '-'}, {type: 'field', value: 'm'}]
```

one.locale.getDateFormat(<formatId>)
------------------------------------

Get one of the locale's standard full/long/medium/short time or date
formats, or a locale-specific format specified by a CLDR
`dateFormatItem` id (see <a
href='http://unicode.org/reports/tr35/#dateFormats'>see some
examples</a>). The locale library must be built with the
`--dateformats` switch.

Examples:

```javascript
one.locale.getDateFormat('fullDate'); // 'l, F j, Y' (en_US)
one.locale.getDateFormat('yMMdd'); // 'MM/dd/y' (en_US)
one.locale.getDateFormat('mediumTime'); // 'h:mm:ss a' (en_US)
```

one.locale.getUnitRenderer('year'|'month'|'week'|'day'|'hour'|'minute')
-----------------------------------------------------------------------

Get a renderer function for a specific unit of time. The locale
library must be built with the `--dateformats` switch.

Example:

```javascript
one.locale.getUnitRenderer('week')(1); // '1 week' (en_US)
one.locale.getUnitRenderer('month')(5); // '5 months' (en_US)
one.locale.renderUnit(1, 'week'); // '1 week' (en_US)
```

one.locale.getPercentageRenderer(<numDecimals>)
-----------------------------------------------

Get a renderer function for a rendering a percentage according to the
number format and percent char of the locale. The library must be
built with the `--numberformats` switch.

Example:

```javascript
one.locale.getPercentageRenderer(1)(1.0056); // '105.6 %' (en_US)
one.locale.renderPercentage(1.0056, 1); // '105.6 %' (en_US)
```

one.locale.getFileSizeRenderer(<numDecimals>)
---------------------------------------------

Get a renderer function for a rendering a number of bytes according to
the number format of the locale. The units themselves (bytes, KB, MB,
etc.) aren't localized yet, sorry. The library must be
built with the `--numberformats` switch.

Example:

```javascript
one.locale.getFileSizeRenderer(1)(100000); // '97.7 KB' (en_US)
one.locale.renderFileSize(100000, 1); // '97.7 KB' (en_US)
```

one.locale.getDateRenderer(<dateFormatId>)
------------------------------------------

Get a renderer for one of the locale's standard full/long/medium/short
time or date formats, or a locale-specifc format specified by a <a
href='http://unicode.org/reports/tr35/#dateFormats'>CLDR
`dateFormatItem` id</a>. The library must be built with the
`--dateformats` switch.

Examples:

```javascript
var aprilFourth = new Date(2010, 3, 4);
one.locale.getDateRenderer('mediumTime')(new Date(2010, 5, 7, 22, 30); // '10:30:00 pm' (en_US)
one.locale.getDateRenderer('longDate')(new Date(2010, 5, 7, 22, 30); // 'June 7, 2010' (en_US)
one.locale.renderDate(aprilFourth, 'fullDate'); // "Sunday, April 4, 2010" (en_US)
one.locale.renderDate(aprilFourth, 'shortTime'); // "12:00 am" (en_US)
one.locale.renderDate(aprilFourth, 'MMMMEd'); // "Sun, April 4" (en_US)
```

License
-------

buildlocale is licensed under a standard 3-clause BSD license -- see the
``LICENSE``-file for details.
