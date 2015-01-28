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
            return this.getPatternRenderer(patternByQuantity[this.pluralRule(number)]).call(this, Array.prototype.slice.call(arguments, 1));
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
         * @param {String[]} list The list type, either 'default', 'unit', 'unitShort', or 'unitNarrow'. Defaults to 'default'.
         * @return {String} The rendered list.
         */
        renderList: function (list, type) {
            type = type || 'default';
            var patterns = this.listPatterns[type];
            switch (list.length) {
            case 0:
                return "";
            case 1:
                return list[0];
            case 2:
                if ('2' in patterns) {
                    return this.renderPattern(list, patterns['2']);
                }
                /* falls through */
            default:
                var str = this.renderPattern(list.slice(-2), patterns.end || "{0}, {1}");
                for (var i = list.length - 3; i >= 0; i -= 1) {
                    str = this.renderPattern([list[i], str], (!i && patterns.start) || patterns.middle || "{0}, {1}");
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
         * @param {String} pattern The pattern, e.g. `"I like {0}
         * music"`.
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
        makeUnitRenderer: function (unit, unitLength) {
            unitLength = unitLength || 'long';
            var that = this,
                quantityRenderers = {};
            for (var quantity in that.unitPatterns[unitLength].unit[unit]) {
                if (that.unitPatterns[unitLength].unit[unit].hasOwnProperty(quantity)) {
                    quantityRenderers[quantity] = that.makePatternRenderer(that.unitPatterns[unitLength].unit[unit][quantity]);
                }
            }
            return function (n) {
                return quantityRenderers[that.pluralRule(n)]([n]);
            };
        },

        /**
         * Make a function for rendering a file size, ie. a number of
         * bytes. The renderer works like {@link
         * Ext.util.Format#fileSize}, but respects the locale's decimal
         * separator. Note: The strings `bytes`, `KB`,
         * `MB`, and `GB` are not localized yet, sorry!
         * @param {Number} numDecimals (optional) The fixed number of
         * decimals, defaults to `0`. Won't be used when the number
         * of bytes is less than or equal to 1000.
         * @return {Function} The file size renderer (Number => String).
         * @private (use renderFileSize or getFileSizeRenderer)
         */
        makeFileSizeRenderer: function (numDecimals, numberSystemId) {
            var numberSymbols = this.numbers[numberSystemId || this.defaultNumberSystemId].symbols;
            function makeNumberRendererSource(sourceVariableNameOrExpression, numDecimals, suffix) {
                return "(" + sourceVariableNameOrExpression + ")" +
                    ".toFixed(" + (numDecimals || 0) + ")" +
                    (numberSymbols.decimalPoint === '.' ? "" : ".replace('.', '" + numberSymbols.decimal.replace(/\'/g, "\\'") + "')") +
                    (suffix ? "+'" + suffix.replace(/\'/g, "\\'") + "'" : "");
            }
            return new Function("size",
                                "if (size < 1000) {" +
                                    "return " + makeNumberRendererSource("size", 0, " bytes", numberSystemId) + ";" +
                                "} else if (size < 1000000) {" +
                                    "return " + makeNumberRendererSource("size/1024", numDecimals, " KB", numberSystemId) + ";" +
                                "} else if (size < 1000000000) {" +
                                    "return " + makeNumberRendererSource("size/1048576", numDecimals, " MB", numberSystemId) + ";" +
                                "} else if (size < 1000000000000) {" +
                                    "return " + makeNumberRendererSource("size/1073741824", numDecimals, " GB", numberSystemId) + ";" +
                                "} else {" +
                                    "return " + makeNumberRendererSource("size/1099511627776", numDecimals, " TB", numberSystemId) + ";" +
                                "}");
        },

        /**
         * Adapted from git://github.com/owiber/numberformat.js.git
         * which is itself an adaptation of the NumberFormat class in
         * the Google Closure lib.
         *
         * Copyright 2006 The Closure Library Authors. All Rights Reserved
         * Copyright 2012 Oliver Wong. All Rights Reserved
         *
         * @param {String} pattern (optional) The format pattern, eg. "#,##0.00".
         * Defaults to the locale's standard decimal format.
         * @param {String} numberSystemId The number system id. Defaults to 'latn'.
         * @param {String} currencyCode (optional) The currency code
         * to use instead of '¤'.
         */
        makeNumberRenderer: function (pattern, numberSystemId, currencyCode) {
            pattern = pattern || this.numbers.latn.formats.decimal['default'];

            var numberSystem = this.numbers[numberSystemId || 'latn'],
                digits = numberSystem.digits;

            if (typeof digits === 'string') {
                // Algorithmic renderer -- not sure this is the right place to special case that...
                var that = this;
                return function (number) {
                    return that[digits](number);
                };
            }

            var maximumIntegerDigits = 40,
                minimumIntegerDigits = 1,
                maximumFractionDigits = 3, // invariant, >= minFractionDigits
                minimumFractionDigits = 0,
                minExponentDigits = 0,
                useSignForPositiveExponent = false,
                positivePrefix = '',
                positiveSuffix = '',
                negativePrefix = '-',
                negativeSuffix = '',
                // The multiplier for use in percent, per mille, etc.
                multiplier = 1,
                groupingSize = 3,
                decimalSeparatorAlwaysShown = false,
                useExponentialNotation = false,
                // pattern_ = pattern.replace(/ /g, '\u00a0'), // Not used anywhere in the original code?
                pos = [0];

            positivePrefix = parseAffix(pattern, pos);
            var trunkStart = pos[0];
            parseTrunk(pattern, pos);
            var trunkLen = pos[0] - trunkStart;
            positiveSuffix = parseAffix(pattern, pos);
            if (pos[0] < pattern.length && pattern.charAt(pos[0]) === ';') {
                pos[0] += 1;
                negativePrefix = parseAffix(pattern, pos);
                // we assume this part is identical to positive part.
                // user must make sure the pattern is correctly constructed.
                pos[0] += trunkLen;
                negativeSuffix = parseAffix(pattern, pos);
            } else {
                // if no negative affix specified, they share the same positive affix
                negativePrefix = positivePrefix + negativePrefix;
                negativeSuffix += positiveSuffix;
            }

            /**
             * Parses affix part of pattern.
             *
             * @param {string} pattern Pattern string that need to be parsed.
             * @param {Array[Number]} pos One element position array to set and receive
             *     parsing position.
             *
             * @return {string} Affix received from parsing.
             * @private
             */
            function parseAffix(pattern, pos) {
                var affix = '',
                    inQuote = false,
                    len = pattern.length;

                for (; pos[0] < len; pos[0] += 1) {
                    var ch = pattern.charAt(pos[0]);
                    if (ch === "'") {
                        if (pos[0] + 1 < len &&
                            pattern.charAt(pos[0] + 1) === "'") {
                            pos[0] += 1;
                            affix += '\''; // 'don''t'
                        } else {
                            inQuote = !inQuote;
                        }
                        continue;
                    }

                    if (inQuote) {
                        affix += ch;
                    } else {
                        switch (ch) {
                        case '#':
                        case '0':
                        case ',':
                        case '.':
                        case ';':
                            return affix;
                        case "¤":
                            // FIXME
                            if ((pos[0] + 1) < len && pattern.charAt(pos[0] + 1) === '¤') {
                                // '¤¤'
                                pos[0] += 1;
                                affix += currencyCode || '¤';
                            } else {
                                // '¤'
                                affix += currencyCode || '¤';
                            }
                            break;
                        case '%':
                            if (multiplier !== 1) {
                                throw Error('Too many percent/permill');
                            }
                            multiplier = 100;
                            affix += numberSystem.symbols.percentSign;
                            break;
                        case '‰':
                            if (multiplier !== 1) {
                                throw Error('Too many percent/permill');
                            }
                            multiplier = 1000;
                            affix += numberSystem.symbols.perMille;
                            break;
                        default:
                            affix += ch;
                        }
                    }
                }
                return affix;
            }

            /**
             * Formats a Number in fraction format.
             *
             * @param {number} number Value need to be formated.
             * @param {number} minIntDigits Minimum integer digits.
             * @param {Array} parts This array holds the pieces of formatted string.
             *     This function will add its formatted pieces to the array.
             * @private
             */
            function subformatFixed(number, minIntDigits, parts) {
                // round the number
                var power = Math.pow(10, maximumFractionDigits),
                    shiftedNumber = Math.round(number * power),
                    intValue, fracValue;
                if (isFinite(shiftedNumber)) {
                    intValue = Math.floor(shiftedNumber / power);
                    fracValue = Math.floor(shiftedNumber - intValue * power);
                } else {
                    intValue = number;
                    fracValue = 0;
                }

                var fractionPresent = minimumFractionDigits > 0 || fracValue > 0,
                    intPart = '',
                    translatableInt = intValue;
                while (translatableInt > 1E20) {
                    // here it goes beyond double precision, add '0' make it look better
                    intPart = '0' + intPart;
                    translatableInt = Math.round(translatableInt / 10);
                }
                intPart = translatableInt + intPart;

                var decimal = numberSystem.symbols.decimal,
                    grouping = numberSystem.symbols.group,
                    zeroCode = digits[0].charCodeAt(0),
                    digitLen = intPart.length,
                    i;

                if (intValue > 0 || minIntDigits > 0) {
                    for (i = digitLen; i < minIntDigits; i += 1) {
                        parts.push(String.fromCharCode(zeroCode));
                    }

                    for (i = 0; i < digitLen; i += 1) {
                        parts.push(String.fromCharCode(zeroCode + intPart.charAt(i) * 1));

                        if (digitLen - i > 1 && groupingSize > 0 &&
                            ((digitLen - i) % groupingSize === 1)) {
                            parts.push(grouping);
                        }
                    }
                } else if (!fractionPresent) {
                    // If there is no fraction present, and we haven't printed any
                    // integer digits, then print a zero.
                    parts.push(String.fromCharCode(zeroCode));
                }

                // Output the decimal separator if we always do so.
                if (decimalSeparatorAlwaysShown || fractionPresent) {
                    parts.push(decimal);
                }

                var fracPart = '' + (fracValue + power),
                    fracLen = fracPart.length;
                while (fracPart.charAt(fracLen - 1) === '0' &&
                       fracLen > minimumFractionDigits + 1) {
                    fracLen -= 1;
                }

                for (i = 1; i < fracLen; i += 1) {
                    parts.push(String.fromCharCode(zeroCode + fracPart.charAt(i) * 1));
                }
            }

            /**
             * Formats exponent part of a Number.
             *
             * @param {number} exponent Exponential value.
             * @param {Array.<string>} parts The array that holds the pieces of formatted
             *     string. This function will append more formatted pieces to the array.
             * @private
             */
            function addExponentPart(exponent, parts) {
                parts.push(numberSystem.symbols.exponential);

                if (exponent < 0) {
                    exponent = -exponent;
                    parts.push(numberSystem.symbols.minusSign);
                } else if (useSignForPositiveExponent) {
                    parts.push(numberSystem.symbols.plusSign);
                }

                var exponentDigits = '' + exponent,
                    zeroChar = digits[0];
                for (var i = exponentDigits.length; i < minExponentDigits; i += 1) {
                    parts.push(zeroChar);
                }
                parts.push(exponentDigits);
            }


            /**
             * Formats Number in exponential format.
             *
             * @param {number} number Value need to be formated.
             * @param {Array.<string>} parts The array that holds the pieces of formatted
             *     string. This function will append more formatted pieces to the array.
             * @private
             */
            function subformatExponential(number, parts) {
                if (number === 0.0) {
                    subformatFixed(number, minimumIntegerDigits, parts);
                    addExponentPart(0, parts);
                    return;
                }

                var exponent = Math.floor(Math.log(number) / Math.log(10));
                number /= Math.pow(10, exponent);

                var minIntDigits = minimumIntegerDigits;
                if (maximumIntegerDigits > 1 && maximumIntegerDigits > minimumIntegerDigits) {

                    // A repeating range is defined; adjust to it as follows.
                    // If repeat === 3, we have 6,5,4=>3; 3,2,1=>0; 0,-1,-2=>-3;
                    // -3,-4,-5=>-6, etc. This takes into account that the
                    // exponent we have here is off by one from what we expect;
                    // it is for the format 0.MMMMMx10^n.
                    while ((exponent % maximumIntegerDigits) !== 0) {
                        number *= 10;
                        exponent -= 1;
                    }
                    minIntDigits = 1;
                } else {
                    // No repeating range is defined; use minimum integer digits.
                    if (minimumIntegerDigits < 1) {
                        exponent += 1;
                        number /= 10;
                    } else {
                        exponent -= minimumIntegerDigits - 1;
                        number *= Math.pow(10, minimumIntegerDigits - 1);
                    }
                }
                subformatFixed(number, minIntDigits, parts);
                addExponentPart(exponent, parts);
            }

            /**
             * Returns the digit value of current character. The character could be either
             * '0' to '9', or a locale specific digit.
             *
             * @param {string} ch Character that represents a digit.
             * @return {number} The digit value, or -1 on error.
             * @private
             */
            function getDigit(ch) {
                var code = ch.charCodeAt(0);
                // between '0' to '9'
                if (48 <= code && code < 58) {
                    return code - 48;
                } else {
                    var zeroCode = digits[0].charCodeAt(0);
                    return zeroCode <= code && code < zeroCode + 10 ? code - zeroCode : -1;
                }
            }

            /**
             * Parses the trunk part of a pattern.
             *
             * @param {string} pattern Pattern string that need to be parsed.
             * @param {Array.<number>} pos One element position array to set and receive
             *     parsing position.
             * @private
             */
            function parseTrunk(pattern, pos) {
                var decimalPos = -1,
                    digitLeftCount = 0,
                    zeroDigitCount = 0,
                    digitRightCount = 0,
                    groupingCount = -1,
                    len = pattern.length;
                for (var loop = true; pos[0] < len && loop; pos[0] += 1) {
                    var ch = pattern.charAt(pos[0]);
                    switch (ch) {
                    case '#':
                        if (zeroDigitCount > 0) {
                            digitRightCount += 1;
                        } else {
                            digitLeftCount += 1;
                        }
                        if (groupingCount >= 0 && decimalPos < 0) {
                            groupingCount += 1;
                        }
                        break;
                    case '0':
                        if (digitRightCount > 0) {
                            throw Error('Unexpected "0" in pattern "' + pattern + '"');
                        }
                        zeroDigitCount += 1;
                        if (groupingCount >= 0 && decimalPos < 0) {
                            groupingCount += 1;
                        }
                        break;
                    case ',':
                        groupingCount = 0;
                        break;
                    case '.':
                        if (decimalPos >= 0) {
                            throw Error('Multiple decimal separators in pattern "' + pattern + '"');
                        }
                        decimalPos = digitLeftCount + zeroDigitCount + digitRightCount;
                        break;
                    case 'E':
                        if (useExponentialNotation) {
                            throw Error('Multiple exponential symbols in pattern "' + pattern + '"');
                        }
                        useExponentialNotation = true;
                        minExponentDigits = 0;

                        // exponent pattern can have a optional '+'.
                        if ((pos[0] + 1) < len && pattern.charAt(pos[0] + 1) === '+') {
                            pos[0] += 1;
                            useSignForPositiveExponent = true;
                        }

                        // Use lookahead to parse out the exponential part
                        // of the pattern, then jump into phase 2.
                        while ((pos[0] + 1) < len && pattern.charAt(pos[0] + 1) === '0') {
                            pos[0] += 1;
                            minExponentDigits += 1;
                        }

                        if ((digitLeftCount + zeroDigitCount) < 1 || minExponentDigits < 1) {
                            throw Error('Malformed exponential pattern "' + pattern + '"');
                        }
                        loop = false;
                        break;
                    default:
                        pos[0] -= 1;
                        loop = false;
                        break;
                    }
                }

                if (zeroDigitCount === 0 && digitLeftCount > 0 && decimalPos >= 0) {
                    // Handle '###.###' and '###.' and '.###'
                    var n = decimalPos;
                    if (n === 0) { // Handle '.###'
                        n += 1;
                    }
                    digitRightCount = digitLeftCount - n;
                    digitLeftCount = n - 1;
                    zeroDigitCount = 1;
                }

                // Do syntax checking on the digits.
                if (decimalPos < 0 && digitRightCount > 0 ||
                    decimalPos >= 0 && (decimalPos < digitLeftCount ||
                                        decimalPos > digitLeftCount + zeroDigitCount) ||
                    groupingCount === 0) {

                    throw Error('Malformed pattern "' + pattern + '"');
                }
                var totalDigits = digitLeftCount + zeroDigitCount + digitRightCount;

                maximumFractionDigits = decimalPos >= 0 ? totalDigits - decimalPos : 0;
                if (decimalPos >= 0) {
                    minimumFractionDigits = digitLeftCount + zeroDigitCount - decimalPos;
                    if (minimumFractionDigits < 0) {
                        minimumFractionDigits = 0;
                    }
                }

                // The effectiveDecimalPos is the position the decimal is at or would be at
                // if there is no decimal. Note that if decimalPos<0, then digitTotalCount ==
                // digitLeftCount + zeroDigitCount.
                var effectiveDecimalPos = decimalPos >= 0 ? decimalPos : totalDigits;
                minimumIntegerDigits = effectiveDecimalPos - digitLeftCount;
                if (useExponentialNotation) {
                    maximumIntegerDigits = digitLeftCount + minimumIntegerDigits;

                    // in exponential display, we need to at least show something.
                    if (maximumFractionDigits === 0 && minimumIntegerDigits === 0) {
                        minimumIntegerDigits = 1;
                    }
                }

                groupingSize = Math.max(0, groupingCount);
                decimalSeparatorAlwaysShown = decimalPos === 0 || decimalPos === totalDigits;
            }

            return function format(number) {
                if (isNaN(number)) {
                    return numberSystem.symbols.nan;
                }

                var parts = [],
                    // in icu code, it is commented that certain computation need to keep the
                    // negative sign for 0.
                    isNegative = number < 0.0 || number === 0.0 && 1 / number < 0.0;

                parts.push(isNegative ? negativePrefix : positivePrefix);

                if (!isFinite(number)) {
                    parts.push(numberSystem.symbols.infinity);
                } else {
                    // convert number to non-negative value
                    number *= isNegative ? -1 : 1;
                    number *= multiplier;
                    useExponentialNotation ?
                        subformatExponential(number, parts) :
                        subformatFixed(number, minimumIntegerDigits, parts);
                }

                parts.push(isNegative ? negativeSuffix : positiveSuffix);

                return parts.join('');
            };
        },

        /**
         * Make a percentage renderer honoring the locale's preferred format.
         * @param {String} numberSystemId (optional) The number system id.
         * Defaults to 'latn'.
         * @returns {Function} The renderer function (Number => String).
         * @private (use renderPercentage or getPercentageRenderer)
         */
        makePercentageRenderer: function (numberSystemId) {
            numberSystemId = numberSystemId || 'latn';
            var pattern = this.numbers[numberSystemId].formats.percent['default'];
            return this.makeNumberRenderer(pattern, numberSystemId);
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

        getCodeFragmentsByFormatChar: function () {
            if (!this.codeFragmentsByFormatChar) {
                this.codeFragmentsByFormatChar = {
                    G: ['{eraNames.abbreviated}[{date}.getFullYear() > 0 ? 1 : 0]'], // Era designator
                    y: ['"0000".slice(String({date}.getFullYear()).length) + {date}.getFullYear()'],
                    //Y: [], // Week of Year
                    //u: [], // Extended year
                    //U: [], // Cyclic year name, as in Chinese lunar calendar
                    Q: ['"0" + ({date}.getMonth()/4)', '*', '{quarterNames.format.abbreviated}[Math.floor({date}.getMonth()/4)]', '{quarterNames.format.wide}[Math.floor({date}.getMonth()/4)]'], // Quarter
                    //q: [], // Stand alone quarter
                    M: ['({date}.getMonth() + 1)', '({date}.getMonth() < 9 ? "0" : "") + ({date}.getMonth() + 1)', '{monthNames.format.abbreviated}[{date}.getMonth()]', '{monthNames.format.wide}[{date}.getMonth()]'],
                    L: ['({date}.getMonth() + 1)', '({date}.getMonth() < 9 ? "0" : "") + ({date}.getMonth() + 1)', '{monthNames.format.abbreviated}[{date}.getMonth()]', '{monthNames.format.wide}[{date}.getMonth()]'],
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
                    s: ['({date}.getSeconds() < 10 ? "0" : "") + {date}.getSeconds()'],
                    //S: [], // Millisecond
                    //A: [], // Milliseconds in day
                    //z: [ '{#}({date}.getTimezoneOffset(), this.timeZoneFormats.hour[0])' ]
                    z: [
                        function () {
                            // Argh
                            return '({date}.getTimezoneOffset() < 0 ? ' +
                                    this.makeDateFormatRendererSource('new Date(1970, 0, 1, 0, Math.abs({date}.getTimezoneOffset()))', this.timeZoneFormats.hour[0]) + ':' +
                                    this.makeDateFormatRendererSource('new Date(1970, 0, 1, 0, Math.abs({date}.getTimezoneOffset()))', this.timeZoneFormats.hour[1]) + ')';
                        }
                    ]

                    //z: [], // Time zone: Specific non-location
                    //Z: [], // Time zone: RFC 822/localized GMT
                    //V: [], // Time zone: Generic (non-)location
                    //W: [], // Week in month
                };
            }
            return this.codeFragmentsByFormatChar;
        },

        getCodeFragmentForDateField: function (fieldToken, sourceVariableNameOrExpression, calendarId) {
            calendarId = calendarId || 'gregorian';
            var codeFragmentsByFormatChar = this.getCodeFragmentsByFormatChar(),
                codeFragments = codeFragmentsByFormatChar[fieldToken[0]];
            if (codeFragments) {
                var codeFragmentNumber = Math.min(fieldToken.length, codeFragments.length) - 1;
                while (codeFragments[codeFragmentNumber] === '*') {
                    codeFragmentNumber -= 1;
                }
                var that = this,
                    codeFragment = codeFragments[codeFragmentNumber];
                if (typeof codeFragment === 'function') {
                    codeFragment = codeFragment.apply(this);
                }
                return codeFragment.replace(/\{([^\}]+)\}/g, function ($0, varName) {
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
        },

        makeDateFormatRendererSource: function (sourceVariableNameOrExpression, format, calendarId) {
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
         * by a CLDR `dateFormatItem` id (<a
         * href='http://unicode.org/reports/tr35/#dateFormats'>see some
         * examples</a>).
         * @param {String} formatId The CLDR id of the date format, or
         * `"fullDate"`, `"fullTime"`, `"fullDateTime"`,
         * `"longDate"`, `"longTime"`, `"longDateTime"`,
         * `"mediumDate"`, `"mediumTime"`, `"mediumDateTime"`,
         * `"shortDate"`, `"shortTime"`, or `"shortDateTime"`.
         * @return {Function} The date renderer.
         * @private (use renderDate or getDateRenderer)
         */
        makeDateRenderer: function (formatId, calendarId) {
            return new Function('d', 'if (!d || !d.getHours) { d = new Date(d); }return ' + this.makeDateFormatRendererSource('d', this.getDateFormat(formatId, calendarId), calendarId) + ';');
        },

        /**
         * Make a date renderer based on an ICU date format.
         * @param {String} format The ICU date format.
         * @return {Function} The date renderer.
         * @private (use renderDateFormat or getDateFormatRenderer)
         */
        makeDateFormatRenderer: function (format, calendarId) {
            return new Function('d', 'return ' + this.makeDateFormatRendererSource('d', format, calendarId) + ';');
        },

        /**
         * Make a locale-specific date or date-time interval renderer
         * using one of the locale's standard full/long/medium/short time
         * or date formats, or specified by a CLDR `dateFormatItem`
         * id (<a href='http://unicode.org/reports/tr35/#timeFormats'>see
         * some examples</a>).
         * @param {String} formatId The CLDR id of the date format, or
         * `"fullDate"`, `"fullTime"`, `"fullDateTime"`,
         * `"longDate"`, `"longTime"`, `"longDateTime"`,
         * `"mediumDate"`, `"mediumTime"`, `"mediumDateTime"`,
         * `"shortDate"`, `"shortTime"`, or `"shortDateTime"`.
         * @param {Boolean} datePartOnly Only render the date part when
         * using a fallback format (defaults to false).
         * @return {Function} The date or date-time interval renderer
         * (Object{start: Date, end: Date} => String).
         * @private (use renderDateInterval or getDateIntervalRenderer)
         */
        makeDateIntervalRenderer: function (formatId, datePartOnly, calendarId) {
            calendarId = calendarId || 'gregorian';
            var that = this,
                greatestDifferences = that.calendars[calendarId].dateIntervalFormats[formatId];
            if (!greatestDifferences) {
                var bestMatchingDateIntervalFormatId = that.getBestICUFormatId(formatId, that.calendars[calendarId].dateIntervalFormats, calendarId);
                if (bestMatchingDateIntervalFormatId) {
                    // Clone the best match, then adapt it:
                    greatestDifferences = {};
                    for (var key in that.calendars[calendarId].dateIntervalFormats[bestMatchingDateIntervalFormatId]) {
                        greatestDifferences[key] = that.adaptICUFormat(that.calendars[calendarId].dateIntervalFormats[bestMatchingDateIntervalFormatId][key], formatId);
                    }
                }
            }
            if (greatestDifferences) {
                return that.makeDateIntervalRendererFromGreatestDifferences(greatestDifferences, calendarId);
            } else {
                var matchFormatId = formatId.match(/^([yMQEd]+)([Hhms]+)$/);
                if (datePartOnly && matchFormatId) {
                    // The requested format has both date and time components, but the caller only wants a date
                    // interval renderer, so we can do a little better than the date interval fallback format by
                    // only rendering the date part:
                    var dateFormatId = matchFormatId[1],
                        timeFormatId = matchFormatId[2];
                    return function (dateInterval) {
                        return that.renderDateInterval(dateInterval, dateFormatId, calendarId);
                    };
                } else {
                    // Create a fallback date interval renderer from the date format and the date interval fallback format:
                    var dateFormat = that.getDateFormat(formatId, calendarId);
                    return that.getPatternRenderer(that.calendars[calendarId].dateIntervalFallbackFormat,
                                                   that.makeDateFormatRendererSource('values.start', dateFormat, calendarId),
                                                   that.makeDateFormatRendererSource('values.end', dateFormat, calendarId));
                }
            }
        },

        /**
         * Get one of the locale's standard full/long/medium/short time or
         * date formats, or a locale-specific format specified by a CLDR
         * `dateFormatItem` id (<a
         * href='http://unicode.org/reports/tr35/#dateFormats'>see some
         * examples</a>).
         *
         * Example invocation:
         * <pre><code>
         *   inter.getDateFormat("fullDate"); // "l, F j, Y" (en_US)
         * </code></pre>
         * @param {String} formatId The CLDR id of the date format, or
         * `"fullDate"`, `"fullTime"`, `"fullDateTime"`,
         * `"longDate"`, `"longTime"`, `"longDateTime"`,
         * `"mediumDate"`, `"mediumTime"`, `"mediumDateTime"`,
         * `"shortDate"`, `"shortTime"`, or `"shortDateTime"`.
         * @return {String} The date format in ICU format, or undefined if no usable
         * format could be found.
         */
        getDateFormat: function (formatId, calendarId) {
            calendarId = calendarId || 'gregorian';
            formatId = formatId || 'fullDateTime';
            var icuFormat = this.calendars[calendarId].dateFormats.basic[formatId] || this.calendars[calendarId].dateFormats.cldr[formatId];
            if (icuFormat) {
                return icuFormat;
            } else {
                // The exact format wasn't found.
                // See if we know a similar format that can be rewritten, explanation here: http://unicode.org/cldr/trac/ticket/2641
                var bestCandidateFormatId = this.getBestICUFormatId(formatId, this.calendars[calendarId].dateFormats.cldr);
                if (bestCandidateFormatId) {
                    return (this.calendars[calendarId].dateFormats.cldr[formatId] = this.adaptICUFormat(this.calendars[calendarId].dateFormats.cldr[bestCandidateFormatId], formatId));
                } else {
                    // No suitable formats found
                    var matchFormatId = formatId.match(/^y+M+d+$/);
                    if (matchFormatId) {
                        // For some reason there's no yMd fragment in CLDR, adapt the short date format to the required level of detail:
                        return (this.calendars[calendarId].dateFormats.cldr[formatId] = this.adaptICUFormat(this.calendars[calendarId].dateFormats.basic.shortDate, formatId));
                    }

                    matchFormatId = formatId.match(/^([yMQEd]+)([Hhms]+)$/);
                    if (matchFormatId) {
                        // It's a format with both date and time components. Try to lookup the date and time parts separately,
                        // then compose them using the default date time pattern:
                        var dateFormat = this.getDateFormat(matchFormatId[1], calendarId),
                            timeFormat = this.getDateFormat(matchFormatId[2], calendarId);
                        return this.renderPattern([timeFormat, dateFormat], 'medium');
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
                seenFields = {},
                that = this;
            that.tokenizeDateFormat(format).forEach(function (token) {
                if (token.type === 'text') {
                    expressions.push('"' + token.value.replace(/"/g, '\\"') + '"');
                } else {
                    // token.type === 'field'
                    expressions.push(that.getCodeFragmentForDateField(token.value, 'dateInterval.' + (seenFields[token.value[0]] ? 'end' : 'start'), calendarId));
                    seenFields[token.value[0]] = true;
                }
            });
            return new Function('dateInterval', 'return ' + expressions.join('+') + ";");
        },

        /**
         * Make a date or date-time interval renderer from an object
         * representing the `greatestDifferences` date interval
         * formats as extracted from CLDR (see <a
         * href='http://unicode.org/reports/tr35/#dateTimeFormats'>see
         * some examples</a>) by `build-locale.pl`.
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
         * `dateFormatItem`-like id.
         * @param {String} formatId The CLDR id of the date or date-time
         * format to search for.
         * @param {Object} sourceObject The object to search for
         * candidates in, could be set to, eg.
         * `this.calendars.gregorian.dateFormats.cldr` or
         * `this.calendars.gregorian.dateIntervalFormats`.
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
         * specified by a CLDR `dateFormatItem` id. Typically used
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
                if (formatChar === 'M') {
                    // L and M are the same field, so it's OK to use the number of Ms in the original format to determine the desired number of Ls.
                    // This should probably be expanded to know about other equivalent fields.
                    formatChar = '[LM]';
                }
                icuFormat = icuFormat.replace(new RegExp(formatChar + "+", "g"), formatToken);
            });
            return icuFormat;
        }
    };

    // Generate render(Unit|Number|Percentage|FileSize|Date|DateFormat|DateInterval|Pattern)
    // and get(Unit|Number|Percentage|FileSize|Date|DateFormat|DateInterval|Pattern)Renderer
    // methods.
    // The renderer functions themselves are cached in inter.renderers.

    ['Unit', 'Number', 'Percentage', 'FileSize', 'Date', 'DateFormat', 'DateInterval', 'Pattern'].forEach(function (rendererType) {
        if (('make' + rendererType + 'Renderer') in this) {
            this['get' + rendererType + 'Renderer'] = function () { // ...
                var rendererId = rendererType + ':' + [].join.call(arguments, '/');
                return this.renderers[rendererId] || (this.renderers[rendererId] = this['make' + rendererType + 'Renderer'].apply(this, arguments));
            };
            this['render' + rendererType] = function (obj) { // ...
                // inter.renderDate(date, format) => inter.getDateRenderer(format)(date)
                // inter.renderDateInterval(dateInterval, format, datePartOnly) => inter.getDateIntervalRenderer(format, datePartOnly)(dateInterval)
                // inter.renderPattern(argumentsArray, pattern, codeFragment1, codeFragment2) => inter.getPatternRenderer(pattern, codeFragment1, codeFragment2)(argumentsArray)
                var makeRendererArgs = [].slice.call(arguments, 1);
                return (this.renderers[rendererType + ':' + makeRendererArgs.join('/')] || this['get' + rendererType + 'Renderer'].apply(this, makeRendererArgs))(obj);
            };
        }
    }, inter);

    ['timeZones', 'countries', 'territories', 'regions', 'languages', 'currencies', 'scripts'].forEach(function (pluralName) {
        var singularName = pluralName.replace(/(ie)?s$/, function ($0, ending) {return ending ? 'y' : '';}),
            capitalizedSingularName = singularName.replace(/[a-z]/, function ($0) {return $0.toUpperCase();});
        this['get' + capitalizedSingularName] = function (id) {
            if (!this.hasOwnProperty(singularName + 'byId')) {
                if (!this[pluralName]) {
                    throw new Error('inter.get' + capitalizedSingularName + ': The library was compiled without --' + pluralName.toLowerCase());
                }
                var byId = this[singularName + 'byId'] = {};
                this[pluralName].forEach(function (obj) {
                    byId[obj.id] = obj;
                });
            }
            return this[singularName + 'byId'][id];
        };
    }, inter);

    return inter;
}));
