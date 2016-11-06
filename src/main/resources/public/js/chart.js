/*global jQuery, c3*/
var Chart = (function ($, c3) {
    'use strict';

    var that;

    return function (elem, variables, fields) {
        that = this;

        this.elem = elem;
        this.variables = variables;
        this.fields = fields;

        this.update = function (data, x, y, variable) {
            this.data = data;
            this.x = x;
            this.y = y;
            this.variable = variable;
        };

        this.render = function () {
            var dataByX = groupDataByX();
            var chartData = reduceDataByX(dataByX);
            var tickValues = getTickValues(chartData);

            var c3Data = [], values = [], names = {};
            $.forEachInObject(chartData, function (axis, variablesOfInterest) {
                var row = {};
                row[that.x] = axis;
                $.forEachInObject(variablesOfInterest, function (variable, totals) {
                    row[variable] = totals;
                    values.push(variable);
                    if (variable in fields)
                        names[variable] = fields[variable];
                });
                c3Data.push(row);
            });

            generateChart(c3Data, values, names, tickValues);
        };

        function groupDataByX() {
            var dataByX = {};
            that.data.forEach(function (row) {
                // Only if we have data for x
                if (((that.x === 'year') && row.totalDaysPerYear) || row[that.x]) {
                    var totalsForRow = {};

                    // Determine the name of the category
                    var category = null;
                    if (that.variable === 'total')
                        category = 'Number of records';
                    else if (that.variable === '')
                        category = (that.y == 'total') ? 'Number of records' : that.y;
                    else if (row[that.variable])
                        category = row[that.variable];

                    // If we have data for the category, continue
                    if (category !== null) {
                        // If we count totals, or a text value, then each row count as 1
                        if ((that.y === 'total') || ((typeof row[that.y] === 'string') && (row[that.y].length > 0)))
                            totalsForRow[category] = 1;
                        // If we count a number, then the row counts as the value of the current row
                        else if ($.isNumeric(row[that.y]))
                            totalsForRow[category] = row[that.y];

                        // Now we know have the total value for this row, add it to the grouped dataset
                        // If we query by year, we have to split up the total per year
                        if (that.x === 'year') {
                            $.forEachInObject(row.totalDaysPerYear, function (year, totalDays) {
                                addDataForX(dataByX, totalsForRow, row, year, totalDays);
                            });
                        }
                        else {
                            addDataForX(dataByX, totalsForRow, row, row[that.x], row.totalDays);
                        }
                    }
                }
            });
            return dataByX;
        }

        function addDataForX(dataByX, totalsForRow, row, key, totalDays) {
            $.addToObject(dataByX, key, {});
            $.forEachInObject(totalsForRow, function (variable, totals) {
                // We may need the quantity coins later, to compute the average, fallback to total days
                var qttyCoins = row.QTTYcoins || totalDays;

                // We may need to separate the total value by days
                if (that.x === 'year') {
                    qttyCoins = (qttyCoins / row.totalDays) * totalDays;
                    if ((that.y in that.variables) && that.variables[that.y].divideByDays)
                        totals = (totals / row.totalDays) * totalDays;
                }

                // Add the totals for this row to the complete list of totals
                var totalsObj = {total: totals, qtty: qttyCoins};
                $.addToObject(dataByX[key], variable, [totalsObj], function (val) {
                    val.push(totalsObj);
                    return val;
                })
            });
        }

        function reduceDataByX(dataByX) {
            var chartData = {};
            $.forEachInObject(dataByX, function (x, variablesTotals) {
                // For each x we have to reduce the data
                $.addToObject(chartData, x, {});
                $.forEachInObject(variablesTotals, function (variable, totals) {
                    var total = 0, totalQtty = 0;
                    totals.forEach(function (totalObj) {
                        // We have to to compute the average by coins quantity, otherwise simply compute the sum
                        if ((that.y in that.variables) && that.variables[that.y].divideByQtty) {
                            total += totalObj.total * totalObj.qtty;
                            totalQtty += totalObj.qtty;
                        }
                        else {
                            total += totalObj.total;
                        }
                    });

                    // Now compute the final value for x
                    chartData[x][variable] = ((that.y in that.variables) && that.variables[that.y].divideByQtty)
                        ? (total / totalQtty) : total;
                    // Round the value and determine the scale
                    if (variable === 'QTTYcoins')
                        chartData[x][variable] = Math.round(chartData[x][variable]);
                    else
                        chartData[x][variable] = Math.round(chartData[x][variable] * 1000) / 1000;
                });
            });
            return chartData;
        }

        function getTickValues(chartData) {
            var tickValues = [];
            if (that.x === 'year') {
                var years = Object.keys(chartData);
                var min = Math.min.apply(Math, years), max = Math.max.apply(Math, years);

                var stepSize = Math.round((max - min) / 10);
                var nearest = Math.round(stepSize / 10) * 10;
                if (nearest === 0)
                    nearest = Math.round(stepSize / 5) * 5;
                if (nearest === 0)
                    nearest = 1;

                var minRound = Math.round(min / nearest) * nearest;
                tickValues.push(minRound);

                var last = minRound;
                while (last <= max) {
                    last += nearest;
                    tickValues.push(last);
                }
            }
            return tickValues;
        }

        function generateChart(c3Data, values, names, tickValues) {
            c3.generate({
                bindto: elem,
                data: {
                    json: c3Data,
                    keys: {
                        x: that.x,
                        value: values
                    },
                    names: names,
                    type: $('input[name=type]:checked').val()
                },
                axis: {
                    x: {
                        label: {
                            text: (that.x === 'year') ? 'Year' : that.fields[that.x],
                            position: 'outer-center'
                        },
                        type: (that.x === 'year') ? 'indexed' : 'category',
                        tick: {
                            values: (that.x === 'year') ? tickValues : null,
                            rotate: (that.x !== 'year') ? 90 : null,
                            multiline: false
                        }
                    },
                    y: {
                        min: 0,
                        label: {
                            text: (function () {
                                if (that.y === 'total')
                                    return 'Number of records';

                                if (that.variables[that.y].divideByQtty)
                                    return 'Average ' + that.fields[that.y].toLowerCase();

                                return that.fields[that.y];
                            })(),
                            position: 'outer-center'
                        }
                    }
                },
                zoom: {
                    enabled: true
                }
            });
        }
    };
})(jQuery, c3);