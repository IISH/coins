(function ($, d3, c3) {
    var fields, values, dataTable, chart;

    var variables = ["UID", "TYPEID", "SOURCE", "MINT", "REGION", "DATE", "CoinNAME", "ALLOY", "VALUEd", "QTTYcoins", "FINEness", "WEIGHTraw", "WEIGHTfine", "TAILLE"];

    var dateFields = ["DATE", "DATEfrom", "DATEto"];
    var textFields = ["UID", "TYPEID", "SOURCE", "MINT", "REGION", "CoinNAME", "ALLOY"];
    var numberFields = ["VALUEd", "QTTYcoins", "FINEness", "WEIGHTraw", "WEIGHTfine", "TAILLE"];

    var divideByDaysFields = ["QTTYcoins", "WEIGHTraw", "WEIGHTfine"];
    var variablesOfInterestFields = ["TYPEID", "MINT", "REGION", "DATEfrom", "DATEto", "CoinNAME", "ALLOY", "VALUEd", "QTTYcoins", "FINEness", "WEIGHTraw", "WEIGHTfine", "TAILLE"];

    var tableColumns = $('#tableColumns');
    var xAxis = $('#xAxis');
    var yAxis = $('#yAxis');
    var variable = $('#variable');

    initialize(function () {
        createSelect($('select'));
        refreshData();

        $(document)
            .on('click', '.form-group-repeat .btn-add', function (e) {
                addRow($(e.target).closest('.form-group-repeat'));
            })
            .on('click', '.form-group-repeat .btn-remove', function (e) {
                removeRow($(e.target).closest('.form-group-repeat'));
            })
            .on('change', '.criteria-block select', function (e) {
                selectCriteriaField($(e.target));
            });

        $('#download').click(function () {
            window.open('/csv?' + $.param(getParams()));
        });

        $('#run').click(function () {
            refreshData(getParams());
        });
    });

    function initialize(callback) {
        $.getJSON('/fields', function (data) {
            fields = data;

            var select = $('select').not(xAxis).not(yAxis).not(variable);
            forEachInObject(fields, function (key, label) {
                var selects = $();

                if (variablesOfInterestFields.indexOf(key) >= 0) {
                    if (textFields.indexOf(key) >= 0)
                        selects = selects.add(xAxis).add(variable);
                    if (numberFields.indexOf(key) >= 0)
                        selects = selects.add(yAxis).add(variable);
                }

                if (dateFields.indexOf(key) < 0)
                    selects = selects.add(select);

                selects.append($("<option></option>").attr('value', key).text(label));
            });

            select.val('');
            xAxis.val('year');
            yAxis.val('total');
            variable.val('total');
            tableColumns.val(['CoinNAME', 'MINT', 'REGION', 'ALLOY']);

            callback();
        });
    }

    function createSelect(elems) {
        elems.select2({theme: 'bootstrap', width: '100%'});
    }

    function refreshData(params) {
        params = params || {};
        $.getJSON('/json', params, function (data) {
            values = data.values;
            refreshTable(data.records);
            refreshStatistics(data.records);
            refreshChart(data.records);
        });
    }

    function selectCriteriaField(field) {
        var val = field.val();
        var criteriaBlock = field.closest('.criteria-block');
        var textBlock = criteriaBlock.find('.text-criteria');
        var numberBlock = criteriaBlock.find('.number-criteria');

        if (textFields.indexOf(val) >= 0) {
            numberBlock.hide();
            textBlock.show();

            var inputField = textBlock.find('input[type=text]').typeahead('destroy');
            if ((values !== undefined) && (values[val] !== undefined)) {
                inputField.typeahead({source: values[val], minLength: 0, showHintOnFocus: true, items: 'all'});
            }
        }

        if (numberFields.indexOf(val) >= 0) {
            textBlock.hide();
            numberBlock.show();
        }
    }

    function addRow(formGroup) {
        var selectOrg = formGroup.find('select').select2('destroy');
        var newFormGroup = formGroup.clone();
        var selectNew = newFormGroup.find('select').val('');

        newFormGroup.find('input[type=text]').val('').text('');
        newFormGroup.insertAfter(formGroup);

        createSelect(selectOrg);
        createSelect(selectNew);

        selectCriteriaField(selectOrg);
        selectCriteriaField(selectNew);

        formGroup.find('.btn-add')
            .removeClass('btn-add')
            .addClass('btn-remove')
            .find('.glyphicon-plus')
            .removeClass('glyphicon-plus')
            .addClass('glyphicon-minus');
    }

    function removeRow(formGroup) {
        formGroup.remove();
    }

    function getParams() {
        var params = {};

        $('.criteria-block').each(function (i, elem) {
            var criteriaBlock = $(elem);
            var textBlock = criteriaBlock.find('.text-criteria');
            var numberBlock = criteriaBlock.find('.number-criteria');
            var field = criteriaBlock.find('select[name=criteria-column]').val();

            if ((field !== undefined) && (field !== null) && (field.length > 0)) {
                if (textBlock.is(':visible')) {
                    var negativeText = textBlock.find('input[name=negative-text]:checked').val();
                    var contains = textBlock.find('input[name=contains]:checked').val();
                    var value = textBlock.find('input[name=criteria-value]').val().trim();

                    if (value.length > 0)
                        params[field] = negativeText + ':' + contains + ':' + value;
                }
                else if (numberBlock.is(':visible')) {
                    var negativeNumber = numberBlock.find('input[name=negative-number]:checked').val();
                    var min = numberBlock.find('input[name=criteria-min]').val();
                    var max = numberBlock.find('input[name=criteria-max]').val();

                    if ($.isNumeric(min) && $.isNumeric(max))
                        params[field] = negativeNumber + ':' + min + ':' + max;
                }
            }
        });

        var from = $('input[name=from]').val();
        var to = $('input[name=to]').val();
        if ($.isNumeric(from) && $.isNumeric(to)) {
            params.from = from;
            params.to = to;
        }

        var years = $('#years');
        if (years.is(':checked')) {
            params.years = years.val();
        }

        return params;
    }

    function refreshTable(data) {
        var table = $('#table').find('table');

        var columns = [];
        tableColumns.val().forEach(function (field) {
            columns.push({
                data: field,
                title: fields[field],
                defaultContent: '<i>Unknown</i>'
            });
        });

        if (dataTable) {
            dataTable.destroy();
            table.empty();
        }

        dataTable = table.DataTable({
            data: data,
            columns: columns,
            searching: false
        });

        table.find('tbody').on('click', 'tr', function () {
            var tr = $(this);
            var row = dataTable.row(tr);

            if (row.child.isShown()) {
                row.child.hide();
            }
            else {
                row.child(detailedDataHtml(row.data())).show();
            }
        });
    }

    function refreshStatistics(data) {
        var missingTotals = {};
        data.forEach(function (row) {
            variables.forEach(function (variable) {
                var val = (variable === 'DATE') ? row.DATEfrom : row[variable];
                var count = (val !== undefined) ? 0 : 1;
                addToObject(missingTotals, variable, count, function (value) {
                    return value + count;
                });
            });
        });

        var html = '<h3>Missing data</h3>';

        var count = 0;
        variables.forEach(function (variable) {
            if (missingTotals[variable] > 0) {
                if (count % 2 === 0) {
                    html += '<div class="row">';
                }

                html += '<div class="col-md-3"><strong>' + fields[variable] + ':' + '</strong></div>';
                html += '<div class="col-md-3">' + missingTotals[variable] + ' records</div>';

                if (count % 2 === 1) {
                    html += '</div>';
                }

                count++;
            }
        });

        if (count % 2 === 0) {
            html += '</div>';
        }

        $('#stats').html(html);
    }

    function refreshChart(data) {
        var x = xAxis.val(), y = yAxis.val(), varVal = variable.val();
        var chartData = getChartData(data, x, y, varVal);

        var c3Data = [], values = [], names = {};
        forEachInObject(chartData, function (axis, variablesOfInterest) {
            var row = {};
            row[x] = axis;
            forEachInObject(variablesOfInterest, function (variable, totals) {
                row[variable] = totals;
                values.push(variable);
                if (variable in fields)
                    names[variable] = fields[variable];
            });
            c3Data.push(row);
        });

        var tickValues = [];
        if (x === 'year') {
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

        chart = c3.generate({
            bindto: '#chart',
            data: {
                json: c3Data,
                keys: {
                    x: x,
                    value: values
                },
                names: names,
                type: $('input[name=type]:checked').val()
            },
            axis: {
                x: {
                    label: (x === 'year') ? 'Year' : fields[x],
                    type: (x === 'year') ? 'indexed' : 'category',
                    tick: {
                        values: (x === 'year') ? tickValues : null
                    }
                },
                y: {
                    label: (y === 'total') ? 'Number of records' : fields[y]
                }
            },
            zoom: {
                enabled: true
            }
        });
    }

    function detailedDataHtml(row) {
        var html = '';

        for (var i = 0; i < variables.length; i++) {
            if (i % 2 === 0) {
                html += '<div class="row">';
            }

            html += '<div class="col-md-3"><strong>' + fields[variables[i]] + ':' + '</strong></div>';
            html += '<div class="col-md-3">' + getValue(row, variables[i]) + '</div>';

            if (i % 2 === 1) {
                html += '</div>';
            }
        }

        return html;
    }

    function getValue(row, key) {
        if ((key === 'DATE') && (row.DATEfrom !== undefined) && (row.DATEto !== undefined)) {
            return row.DATEfrom.day + '-' + row.DATEfrom.month + '-' + row.DATEfrom.year + ' until ' +
                row.DATEto.day + '-' + row.DATEto.month + '-' + row.DATEto.year;
        }

        if (row[key] !== undefined) {
            return row[key];
        }
        return '<i>Unknown</i>';
    }

    function getChartData(data, xVariable, yVariable, valueVariable) {
        var chartData = {};
        data.forEach(function (row) {
            if (((xVariable === 'year') && row.totalDaysPerYear) || row[xVariable]) {
                var totalsForRow = {};

                var category = null;
                if (valueVariable === 'total')
                    category = 'Number of records';
                else if (yVariable === valueVariable)
                    category = yVariable;
                else if (row[valueVariable])
                    category = row[valueVariable];

                if (category !== null) {
                    if (yVariable === 'total')
                        totalsForRow[category] = 1;
                    else if ($.isNumeric(row[yVariable]))
                        totalsForRow[category] = row[yVariable];
                    else if ((typeof row[yVariable] === 'string') && (row[yVariable].length > 0))
                        totalsForRow[category] = 1;


                    if (xVariable === 'year') {
                        forEachInObject(row.totalDaysPerYear, function (year, totalDays) {
                            addToObject(chartData, year, {});
                            forEachInObject(totalsForRow, function (variable, totals) {
                                if (divideByDaysFields.indexOf(variable) >= 0) {
                                    totals = (totals / row.totalDays) * totalDays;
                                    if (variable === 'QTTYcoins')
                                        totals = Math.round(totals);
                                }
                                addToObject(chartData[year], variable, totals, function (val) {
                                    return val + totals;
                                })
                            });
                        });
                    }
                    else {
                        addToObject(chartData, row[xVariable], {});
                        forEachInObject(totalsForRow, function (variable, totals) {
                            addToObject(chartData[row[xVariable]], variable, totals, function (val) {
                                return val + totals;
                            })
                        });
                    }
                }
            }
        });
        return chartData;
    }

    function forEachInObject(obj, callback) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                callback(key, obj[key]);
            }
        }
    }

    function addToObject(obj, key, ifNotExists, ifExists) {
        if (obj[key] === undefined) {
            obj[key] = ifNotExists;
        }
        else if ($.isFunction(ifExists)) {
            obj[key] = ifExists(obj[key]);
        }
        else if (ifExists !== undefined) {
            obj[key] = ifExists;
        }
    }
})(jQuery, d3, c3);