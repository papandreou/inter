/*jslint evil:true*/
(function (root, factory) {
    if (typeof module !== "undefined") {
        module.exports = factory();
    } else if (typeof root.define === 'function' && define.amd) {
        define(factory);
    } else {
        root.inter = factory();
    }
}(this, function () {
    var inter = {
        renderers: {},

        trQuantity: function (patternByQuantity, number) { // ...
            return this.getPatternRenderer(patternByQuantity[this.getQuantity(number)]).call(this, Array.prototype.slice.call(arguments, 1));
        },

        /**
         * Render a list of items as dictated by the locale. The formats
         * are extracted from CLDR (<a
         * href='http://cldr.unicode.org/development/design-proposals/list-formatting'>see
         * some examples</a>).
         *
         * Example invocation:
         * <pre><code>
         *   inter.renderList(["foo", "bar", "quux"]); // "foo, bar, and quux" (en_US).
         * </code></pre>
         * @param {String[]} list The list items.
         * @return {String} The rendered list.
         */
        renderList: function (list) {
            switch (list.length) {
            case 0:
                return "";
            case 1:
                return list[0];
            case 2:
                if ('2' in this.listPatterns) {
                    return this.renderPattern(list, this.listPatterns['2']);
                }
                /* falls through */
            default:
                var str = this.renderPattern(list.slice(-2), this.listPatterns.end || "{0}, {1}");
                for (var i = list.length - 3; i >= 0; i -= 1) {
                    str = this.renderPattern([list[i], str], (!i && this.listPatterns.start) || this.listPatterns.middle || "{0}, {1}");
                }
                return str;
            }
        },

        /**
         * Tokenize a pattern with placeholders for mapping.
         * @param (String) pattern The pattern to tokenize.
         * @return {Array} An array of text and placeholder objects
         * @static
         */
        tokenizePattern: function (pattern) {
            var tokens = [];
            // Split pattern into tokens (return value of replace isn't used):
            pattern.replace(/\{(\d+)\}|([^\{]+)/g, function ($0, placeHolderNumber, text) {
                if (text) {
                    tokens.push({
                        type: 'text',
                        value: text
                    });
                } else {
                    tokens.push({
                        type: 'placeHolder',
                        value: parseInt(placeHolderNumber, 10)
                    });
                }
            });
            return tokens;
        },

        /**
         * Get a renderer function for a pattern. Default values for the
         * placeholders can be provided as further arguments (JavaScript
         * code fragments).
         * @param {String} pattern The pattern, e.g. <tt>"I like {0}
         * music"</tt>.
         * @param {String} placeHolderValue1 (optional) The value to
         * insert into the first placeholder.
         * @param {String} placeHolderValue2 (optional) The value to
         * insert into the second placeholder, and so on.
         * @return {Function} The renderer function (String[] => String).
         * @private (use renderPattern or getPatternRenderer)
         */
        makePatternRenderer: function (pattern) { // ...
            if (pattern) {
                var predefinedCodeFragments = [].slice.call(arguments, 1);
                return new Function("values", "return " + this.tokenizePattern(pattern).map(function (token) {
                    if (token.type === 'placeHolder') {
                        return predefinedCodeFragments[token.value] || "values[" + token.value + "]";
                    } else {
                        return "\"" + token.value.replace(/\"/g, "\\\"").replace(/\n/g, "\\n") + "\"";
                    }
                }).join("+") + ";");
            } else {
                // Fail somewhat gracefully if no pattern was provided:
                return function () {
                    return "[! makePatternRenderer: No pattern provided !]";
                };
            }
        },

        /**
         * Get a renderer function for a number with unit.
         * @param {String} unit The unit. Supported values: 'year',
         * 'week', 'month', 'day', 'hour', 'minute'.
         * @return {Function} The renderer function (String[] => String).
         * @private (use renderUnit or getUnitRenderer)
         */
        makeUnitRenderer: function (unit) {
            var quantityRenderers = {};
            for (var quantity in this.unitPatterns[unit]) {
                if (this.unitPatterns[unit].hasOwnProperty(quantity)) {
                    quantityRenderers[quantity] = this.makePatternRenderer(pattern);
                }
            }
            return function (n) {
                return quantityRenderers[inter.getQuantity(n)]([n]);
            };
        },

        /**
         * Get a locale-specific renderer function for numbers. The
         * renderer outputs a fixed number of decimals. Thousands
         * separators are not supported yet.
         * @param {Number} numDecimals (optional) The fixed number of
         * decimals, defaults to <tt>0</tt>.
         * @param {Number} factor (optional) Factor to multiply all
         * numbers by (useful for rendering percentages and the likes).
         * @param {String} prefix (optional) String to prefix all
         * renderered numbers with (e.g. <tt>"$"</tt> or <tt>"DKK "</tt>).
         * @param {String} suffix (optional) String to suffix all
         * renderered numbers with (e.g. <tt>"%"</tt> or <tt>" m/s"</tt>).
         * @return {Function} The renderer function (Number => String).
         * @private (use renderNumber or getNumberRenderer)
         */
        makeNumberRenderer: function (numDecimals, factor, prefix, suffix, numberSystem) {
            return new Function("num",
                                "return " +
                                    this.makeNumberRendererSource((typeof factor === 'undefined' ? '' : "" + factor + "*") + "num", numDecimals, prefix, suffix, numberSystem) + ";");
        },

        /**
         * Make a percentage renderer, honoring the locale's preferred
         * percent sign and number format. The renderer outputs a fixed
         * number of decimals.
         * @param {Number} numDecimals (optional) The fixed number of
         * decimals, defaults to <tt>0</tt>.
         * @returns {Function} The renderer function (Number => String).
         * @private (use renderPercentage or getPercentageRenderer)
         */
        makePercentageRenderer: function (numDecimals, numberSystem) {
            return new Function("num", "return " + this.makeNumberRendererSource("100*num", numDecimals, "", " " + this.numbers[numberSystem || this.defaultNumberSystem].symbols.percentSign) + ";");
        },

        /**
         * Make a function for rendering a file size, ie. a number of
         * bytes. The renderer works like {@link
         * Ext.util.Format#fileSize}, but respects the locale's decimal
         * separator. Note: The strings <tt>bytes</tt>, <tt>KB</tt>,
         * <tt>MB</tt>, and <tt>GB</tt> are not localized yet, sorry!
         * @param {Number} numDecimals (optional) The fixed number of
         * decimals, defaults to <tt>0</tt>. Won't be used when the number
         * of bytes is less than or equal to 1000.
         * @return {Function} The file size renderer (Number => String).
         * @private (use renderFileSize or getFileSizeRenderer)
         */
        makeFileSizeRenderer: function (numDecimals, numberSystem) {
            return new Function("size",
                                "if (size < 1000) {" +
                                    "return " + this.makeNumberRendererSource("size", 0, "", " bytes", numberSystem) + ";" +
                                "} else if (size < 1000000) {" +
                                    "return " + this.makeNumberRendererSource("size/1024", numDecimals, "", " KB", numberSystem) + ";" +
                                "} else if (size < 1000000000) {" +
                                    "return " + this.makeNumberRendererSource("size/1048576", numDecimals, "", " MB", numberSystem) + ";" +
                                "} else if (size < 1000000000000) {" +
                                    "return " + this.makeNumberRendererSource("size/1073741824", numDecimals, "", " GB", numberSystem) + ";" +
                                "} else {" +
                                    "return " + this.makeNumberRendererSource("size/1099511627776", numDecimals, "", " TB", numberSystem) + ";" +
                                "}");
        },

        /**
         * Make a JavaScript code fragment for rendering a number in the
         * locale's number format with a fixed number of decimals. Useful
         * in a <tt>new Function("...")</tt> construct.
         * @param {String} sourceVariableNameOrExpression JavaScript
         * expression representing the number to render, a variable name
         * in the simple case.
         * @return {String} The JavaScript code fragment.
         * @private
         */
        makeNumberRendererSource: function (sourceVariableNameOrExpression, numDecimals, prefix, suffix, numberSystem) {
            var numberSymbols = this.numbers[numberSystem || this.defaultNumberSystem].symbols;
            return (prefix ? "'" + prefix.replace(/\'/g, "\\'") + "'+" : "") +
                "(" + sourceVariableNameOrExpression + ")" +
                ".toFixed(" + (numDecimals || 0) + ")" +
                (numberSymbols.decimalPoint === '.' ? "" : ".replace('.', '" + numberSymbols.decimal.replace(/\'/g, "\\'") + "')") +
                (suffix ? "+'" + suffix.replace(/\'/g, "\\'") + "'" : "");
        },

        tokenizeDateFormat: function (format) {
            var tokens = [];
            format.replace(/([^a-z']+)|'(')|'((?:[^']|'')+)'|(([a-z])\5*)/gi, function ($0, unescapedText, escapedSingleQuote, escapedText, fieldToken) {
                if (fieldToken) {
                    tokens.push({type: 'field', value: fieldToken});
                } else {
                    if (escapedText) {
                        escapedText = escapedText.replace(/''/g, "'");
                    }
                    tokens.push({type: 'text', value: (unescapedText || escapedSingleQuote || escapedText || $0).replace(/"/g, '\\"')});
                }
            });
            return tokens;
        },

        getCodeFragmentForDateField: (function () {
            var codeFragmentsByFormatChar = {
                G: ['{eraNames.abbreviated}[{date}.getFullYear() > 0 ? 1 : 0]'], // Era designator
                y: ['"0000".slice(String({date}.getFullYear()).length) + {date}.getFullYear()'],
                //Y: [], // Week of Year
                //u: [], // Extended year
                //U: [], // Cyclic year name, as in Chinese lunar calendar
                Q: ['"0" + ({date}.getMonth()/4)', '*', '{quarterNames.format.abbreviated}[Math.floor({date}.getMonth()/4)]', '{quarterNames.format.wide}[Math.floor({date}.getMonth()/4)]'], // Quarter
                //q: [], // Stand alone quarter
                M: ['({date}.getMonth() + 1)', '({date}.getMonth() < 9 ? "0" : "") + ({date}.getMonth() + 1)', '{monthNames.format.abbreviated}[{date}.getMonth()]', '{monthNames.format.wide}[{date}.getMonth()]'],
                L: ['({date}.getMonth() + 1)', '({date}.getMonth() < 9 ? "0" : "") + ({date}.getMonth() + 1)', '{monthNames.format.abbreviated}[{date}.getMonth())', '{monthNames.format.wide}[{date}.getMonth()]'],
                //w: [], // Week of year
                //W: [], // Week of month
                d: ['{date}.getDate()', '({date}.getDate() < 10 ? "0" : "") + {date}.getDate()'],
                D: ['(1 + Math.floor(({date}.getTime() - new Date({date}.getFullYear(), 0, 1).getTime()) / 86400000))'], // Day of year
                F: ['(1 + Math.floor((date.getDate() - 1) / 7))'], // Day of week in month
                //g: [], // Modified Julian day
                E: ['{dayNames.format.abbreviated}[{date}.getDay()]', '*', '*', '{dayNames.format.wide}[{date}.getDay()]'],
                //e: [], // Local day of week
                //c: [], // Stand alone day of week
                a: ['({date}.getHours() < 12 ? "am" : "pm")'],
                h: ['(({date}.getHours() % 12) ? {date}.getHours() % 12 : 12)'],
                H: ['({date}.getHours() < 10 ? "0" : "") + {date}.getHours()'],
                //k: [], // Hour in day (1-24)
                //K: [], // Hour in am/pm (0-11)
                m: ['({date}.getMinutes() < 10 ? "0" : "") + {date}.getMinutes()'],
                s: ['({date}.getSeconds() < 10 ? "0" : "") + {date}.getSeconds()']
                //S: [], // Millisecond
                //A: [], // Milliseconds in day
                //z: [], // Time zone: Specific non-location
                //Z: [], // Time zone: RFC 822/localized GMT
                //V: [], // Time zone: Generic (non-)location
                //W: [], // Week in month
            };

            return function (fieldToken, sourceVariableNameOrExpression, calendarId) {
                calendarId = calendarId || 'gregorian';
                var codeFragments = codeFragmentsByFormatChar[fieldToken[0]];
                if (codeFragments) {
                    var codeFragmentNumber = Math.min(fieldToken.length, codeFragments.length) - 1;
                    while (codeFragments[codeFragmentNumber] === '*') {
                        codeFragmentNumber -= 1;
                    }
                    var that = this;
                    return codeFragments[codeFragmentNumber].replace(/\{([^\}]+)\}/g, function ($0, varName) {
                        if (varName === 'date') {
                            return '(' + sourceVariableNameOrExpression + ')';
                        } else {
                            var fragments = varName.split('.'),
                                obj = that.calendars[calendarId];
                            for (var i = 0 ; i < fragments.length ; i += 1) {
                                obj = obj[fragments[i]];
                            }
                            return JSON.stringify(obj);
                        }
                    });
                }
            };
        }()),

        makeDateRendererSource: function (sourceVariableNameOrExpression, format, calendarId) {
            calendarId = calendarId || 'gregorian';
            var expressions = [];
            this.tokenizeDateFormat(format).forEach(function (token) {
                if (token.type === 'text') {
                    expressions.push('"' + token.value.replace(/"/g, '\\"') + '"');
                } else {
                    // token.type === 'field'
                    var codeFragment = this.getCodeFragmentForDateField(token.value, sourceVariableNameOrExpression, calendarId);
                    if (codeFragment) {
                        expressions.push(codeFragment);
                    }
                }
            }, this);
            return expressions.join('+');
        },

        /**
         * Make a locale-specific date renderer using one of the locale's
         * standard full/long/medium/short time or date formats, or given
         * by a CLDR <tt>dateFormatItem</tt> id (<a
         * href='http://unicode.org/reports/tr35/#dateFormats'>see some
         * examples</a>).
         * @param {String} formatId The CLDR id of the date format, or
         * <tt>"fullDate"</tt>, <tt>"fullTime"</tt>, <tt>"fullDateTime"</tt>,
         * <tt>"longDate"</tt>, <tt>"longTime"</tt>, <tt>"longDateTime"</tt>,
         * <tt>"mediumDate"</tt>, <tt>"mediumTime"</tt>, <tt>"mediumDateTime"</tt>,
         * <tt>"shortDate"</tt>, <tt>"shortTime"</tt>, or <tt>"shortDateTime"</tt>.
         * @return {Function} The date renderer.
         * @private (use renderDate or getDateRenderer)
         */
        makeDateRenderer: function (formatId, calendarId) {
            calendarId = calendarId || 'gregorian';
            return new Function('d', 'return ' + this.makeDateRendererSource('d', this.getDateFormat(formatId, calendarId), calendarId) + ';');
        },

        /**
         * Make a locale-specific date or date-time interval renderer
         * using one of the locale's standard full/long/medium/short time
         * or date formats, or specified by a CLDR <tt>dateFormatItem</tt>
         * id (<a href='http://unicode.org/reports/tr35/#timeFormats'>see
         * some examples</a>).
         * @param {String} formatId The CLDR id of the date format, or
         * <tt>"fullDate"</tt>, <tt>"fullTime"</tt>, <tt>"fullDateTime"</tt>,
         * <tt>"longDate"</tt>, <tt>"longTime"</tt>, <tt>"longDateTime"</tt>,
         * <tt>"mediumDate"</tt>, <tt>"mediumTime"</tt>, <tt>"mediumDateTime"</tt>,
         * <tt>"shortDate"</tt>, <tt>"shortTime"</tt>, or <tt>"shortDateTime"</tt>.
         * @param {Boolean} datePartOnly Only render the date part when
         * using a fallback format (defaults to false).
         * @return {Function} The date or date-time interval renderer
         * (Object{start: Date, end: Date} => String).
         * @private (use renderDateInterval or getDateIntervalRenderer)
         */
        makeDateIntervalRenderer: function (formatId, datePartOnly, calendarId) {
            calendarId = calendarId || 'gregorian';
            var greatestDifferences = this.calendars[calendarId].dateIntervalFormats[formatId];
            if (!greatestDifferences) {
                var bestMatchingDateIntervalFormatId = this.getBestICUFormatId(formatId, this.calendars[calendarId].dateIntervalFormats, calendarId);
                if (bestMatchingDateIntervalFormatId) {
                    // Clone the best match, then adapt it:
                    greatestDifferences = {};
                    for (var key in this.calendars[calendarId].dateIntervalFormats[bestMatchingDateIntervalFormatId]) {
                        greatestDifferences[key] = this.adaptICUFormat(this.calendars[calendarId].dateIntervalFormats[bestMatchingDateIntervalFormatId][key], formatId);
                    }
                }
            }
            if (greatestDifferences) {
                return this.makeDateIntervalRendererFromGreatestDifferences(greatestDifferences, calendarId);
            } else {
                var matchFormatId = formatId.match(/^([yMQEd]+)([Hhms]+)$/);
                if (datePartOnly && matchFormatId) {
                    // The requested format has both date and time components, but the caller only wants a date
                    // interval renderer, so we can do a little better than the date interval fallback format by
                    // only rendering the date part:
                    var dateFormatId = matchFormatId[1],
                        timeFormatId = matchFormatId[2];
                    return function (dateInterval) {
                        return inter.renderDateInterval(dateInterval, dateFormatId, calendarId);
                    };
                } else {
                    // Create a fallback date interval renderer from the date format and the date interval fallback format:
                    var dateFormat = this.getDateFormat(formatId, calendarId);
                    return this.getPatternRenderer(this.calendars[calendarId].dateIntervalFallbackFormat,
                                                   this.makeDateRendererSource('values.start', dateFormat, calendarId),
                                                   this.makeDateRendererSource('values.end', dateFormat, calendarId));
                }
            }
        },

        /**
         * Get one of the locale's standard full/long/medium/short time or
         * date formats, or a locale-specific format specified by a CLDR
         * <tt>dateFormatItem</tt> id (<a
         * href='http://unicode.org/reports/tr35/#dateFormats'>see some
         * examples</a>).
         *
         * Example invocation:
         * <pre><code>
         *   inter.getDateFormat("fullDate"); // "l, F j, Y" (en_US)
         * </code></pre>
         * @param {String} formatId The CLDR id of the date format, or
         * <tt>"fullDate"</tt>, <tt>"fullTime"</tt>, <tt>"fullDateTime"</tt>,
         * <tt>"longDate"</tt>, <tt>"longTime"</tt>, <tt>"longDateTime"</tt>,
         * <tt>"mediumDate"</tt>, <tt>"mediumTime"</tt>, <tt>"mediumDateTime"</tt>,
         * <tt>"shortDate"</tt>, <tt>"shortTime"</tt>, or <tt>"shortDateTime"</tt>.
         * @return {String} The date format in ICU format, or undefined if no usable
         * format could be found.
         */
        getDateFormat: function (formatId, calendarId) {
            calendarId = calendarId || 'gregorian';
            var icuFormat = this.calendars[calendarId].dateFormats.basic[formatId] || this.calendars[calendarId].dateFormats.cldr[formatId];
            if (icuFormat) {
                return icuFormat;
            } else {
                // The exact format wasn't found.
                // See if we know a similar format that can be rewritten, explanation here: http://unicode.org/cldr/trac/ticket/2641
                var bestCandidateFormatId = this.getBestICUFormatId(formatId, this.dateFormats.cldr, calendarId);
                if (bestCandidateFormatId) {
                    return (this.calendars[calendarId].dateFormats.cldr[formatId] = this.adaptICUFormat(this.calendars[calendarId].dateFormats.cldr[bestCandidateFormatId], formatId));
                } else {
                    // No suitable formats found
                    var matchFormatId = formatId.match(/^y+M+d+$/);
                    if (matchFormatId) {
                        // For some reason there's no yMd fragment in CLDR, adapt the short date format to the required level of detail:
                        return (this.calendars[calendarId].dateFormats.cldr[formatId] = this.adaptICUFormat(this.dateFormats.basic.shortDate, formatId));
                    }

                    matchFormatId = formatId.match(/^([yMQEd]+)([Hhms]+)$/);
                    if (matchFormatId) {
                        // It's a format with both date and time components. Try to lookup the date and time parts separately,
                        // then compose them using the default date time pattern:
                        var dateFormat = this.getDateFormat(matchFormatId[1], calendarId),
                            timeFormat = this.getDateFormat(matchFormatId[2], calendarId);
                        return this.renderPattern([timeFormat, dateFormat], this.calendars[calendarId].defaultDateTimePattern);
                    } else {
                        throw new Error('inter.getDateFormat: Cannot find format: ' + formatId);
                    }
                }
            }
        },

        /**
         * Make a date or date-time interval renderer from an ICU format
         * string.
         * @param {String} format The format.
         * @return {Function} The date or date-time interval renderer
         * function (Object{start: Date, end: Date} => String).
         * @private
         */
        makeDateIntervalRendererFromFormatString: function (format, calendarId) {
            calendarId = calendarId || 'gregorian';
            var expressions = [],
                seenFields = {};
            this.tokenizeDateFormat(format).forEach(function (token) {
                if (token.type === 'text') {
                    expressions.push('"' + token.value.replace(/"/g, '\\"') + '"');
                } else {
                    // token.type === 'field'
                    expressions.push(inter.getCodeFragmentForDateField(token.value, 'dateInterval.' + (seenFields[token.value[0]] ? 'end' : 'start'), calendarId));
                    seenFields[token.value[0]] = true;
                }
            });
            return new Function('dateInterval', 'return ' + expressions.join('+') + ";");
        },

        /**
         * Make a date or date-time interval renderer from an object
         * representing the <tt>greatestDifferences</tt> date interval
         * formats as extracted from CLDR (see <a
         * href='http://unicode.org/reports/tr35/#dateTimeFormats'>see
         * some examples</a>) by <tt>build-locale.pl</tt>.
         * @param {Object} greatestDifferences Object containing the
         * greatestDifferences map.
         * @return {Function} The date or date-time interval renderer
         * (Object{start: Date, end: Date} => String).
         * @private
         */
        makeDateIntervalRendererFromGreatestDifferences: function (greatestDifferences, calendarId) {
            calendarId = calendarId || 'gregorian';
            var formatters = [],
                previousFormatter;
            ['y', 'M', 'd', 'a', 'h', 'm'].forEach(function (ch, i) {
                var formatter;
                if (ch in greatestDifferences) {
                    formatter = this.makeDateIntervalRendererFromFormatString(greatestDifferences[ch], calendarId);
                    if (!previousFormatter) {
                        for (var j = 0; j < i; j += 1) {
                            formatters[j] = formatter;
                        }
                    }
                    previousFormatter = formatters[i] = formatter;
                } else if (previousFormatter) {
                    formatters[i] = previousFormatter;
                }
            }, this);
            var dateIntervalRenderers = {};
            for (var greatestDifference in greatestDifferences) {
                if (greatestDifferences.hasOwnProperty(greatestDifference)) {
                    dateIntervalRenderers[greatestDifference] = this.makeDateIntervalRendererFromFormatString(greatestDifferences[greatestDifference], calendarId);
                }
            }
            return function (dateInterval) {
                if (dateInterval.start.getFullYear() !== dateInterval.end.getFullYear()) {
                    return formatters[0](dateInterval);
                } else if (dateInterval.start.getMonth() !== dateInterval.end.getMonth()) {
                    return formatters[1](dateInterval);
                } else if (dateInterval.start.getDate() !== dateInterval.end.getDate()) {
                    return formatters[2](dateInterval);
                } else if ((dateInterval.start.getHours() >= 12) === (dateInterval.end.getHours() >= 12)) {
                    return formatters[4](dateInterval);
                } else if (dateInterval.start.getHours() !== dateInterval.end.getHours()) {
                    return formatters[3](dateInterval);
                } else {
                    return formatters[5](dateInterval);
                }
            };
        },

        /**
         * Get the CLDR id of the best matching date or date-time format
         * given a (possible non-existent) CLDR
         * <tt>dateFormatItem</tt>-like id.
         * @param {String} formatId The CLDR id of the date or date-time
         * format to search for.
         * @param {Object} sourceObject The object to search for
         * candidates in, could be set to <tt>this.dateFormats.cldr</tt>
         * or <tt>this.dateIntervalFormats</tt>.
         * @return {String} The CLDR id of the best matching format, or
         * undefined if no candidate is found.
         * @private
         */
        getBestICUFormatId: function (formatId, sourceObject) {
            var bestCandidateFormatId,
                matcher = new RegExp("^" + formatId.replace(/(([a-zA-Z])\2*)/g, function ($0, formatToken, formatChar) {
                    return formatChar + "{1," + formatToken.length + "}";
                }) + "$");
            // Find the longest matching candidate:
            for (var candidateFormatId in sourceObject) {
                if (matcher.test(candidateFormatId)) {
                    if (!bestCandidateFormatId || candidateFormatId.length > bestCandidateFormatId.length) {
                        bestCandidateFormatId = candidateFormatId;
                    }
                }
            }
            return bestCandidateFormatId;
        },

        /**
         * Adapt an ICU date format to a different level of detail as
         * specified by a CLDR <tt>dateFormatItem</tt> id. Typically used
         * in conjunction with inter.getBestICUFormatId. The
         * return value probably won't make sense if the parameters
         * specify incompatible formats.
         * @param {String} icuFormat The ICU format to adapt.
         * @param {String} adaptToFormatId The CLDR id specifying the
         * level of detail to adapt to.
         * @return {String} The adapted ICU format.
         * @private
         */
        adaptICUFormat: function (icuFormat, adaptToFormatId) {
            adaptToFormatId.replace(/(([a-zA-Z])\2*)/g, function ($0, formatToken, formatChar) { // For each token in the wanted format id
                // FIXME: This should probably be aware of quoted strings:
                icuFormat = icuFormat.replace(new RegExp(formatChar + "+", "g"), formatToken);
            });
            return icuFormat;
        }
    };

    // Generate render(Unit|Number|Percentage|FileSize|Date|DateInterval|Pattern)
    // and get(Unit|Number|Percentage|FileSize|Date|Interval|Pattern)Renderer
    // methods.
    // The renderer functions themselves are cached in inter.renderers.

    ['Unit', 'Number', 'Percentage', 'FileSize', 'Date', 'DateInterval', 'Pattern'].forEach(function (rendererType) {
        if (('make' + rendererType + 'Renderer') in inter) {
            inter['get' + rendererType + 'Renderer'] = function () { // ...
                var rendererId = rendererType + ':' + [].join.call(arguments, '/');
                return inter.renderers[rendererId] || (inter.renderers[rendererId] = inter['make' + rendererType + 'Renderer'].apply(inter, arguments));
            };
            inter['render' + rendererType] = function (obj) { // ...
                // inter.renderDate(date, format) => inter.getDateRenderer(format)(date)
                // inter.renderDateInterval(dateInterval, format, datePartOnly) => inter.getDateIntervalRenderer(format, datePartOnly)(dateInterval)
                // inter.renderPattern(argumentsArray, pattern, codeFragment1, codeFragment2) => inter.getPatternRenderer(pattern, codeFragment1, codeFragment2)(argumentsArray)
                var makeRendererArgs = [].slice.call(arguments, 1);
                return (inter.renderers[rendererType + ':' + makeRendererArgs.join('/')] || inter['get' + rendererType + 'Renderer'].apply(inter, makeRendererArgs))(obj);
            };
        }
    });

    ['timeZones', 'countries', 'territories', 'regions', 'languages', 'currencies', 'scripts'].forEach(function (pluralName) {
        var singularName = pluralName.replace(/(ie)?s$/, function ($0, ending) {return ending ? 'y' : '';}),
            capitalizedSingularName = singularName.replace(/[a-z]/, function ($0) {return $0.toUpperCase();});
        inter['get' + capitalizedSingularName] = function (id) {
            if (!inter[singularName + 'byId']) {
                if (!inter[pluralName]) {
                    throw new Error('inter.get' + capitalizedSingularName + ': The library was compiled without --' + pluralName.toLowerCase());
                }
                var byId = inter[singularName + 'byId'] = {};
                inter[pluralName].forEach(function (obj) {
                    byId[obj.id] = obj;
                });
            }
            return inter[singularName + 'byId'][id];
        };
    }, inter);

    return inter;
}));
