/*global jQuery, Data, Table, Chart*/
(function ($, Data, Table, Chart) {
    'use strict';

    var tableTab = $('#table'), statsTab = $('#stats'), chartTab = $('#chart');
    var data = new Data('#download', '#run', '#tableColumns', '#xAxis', '#yAxis', '#variable');
    var table, chart = null;
    var loading = true;

    data.onInitialize(function () {
        table = new Table('#table .content', data.variables, data.fields);
        chart = new Chart('#chart .content', data.variables, data.fields);
    });

    data.onRefresh(function () {
        loading = true;
        $('.tab-content .tab-pane').each(function (i, tabPane) {
            $(tabPane).find('.content').empty().hide();
            $(tabPane).find('.loading').show();
        });
    });

    data.onData(function () {
        loading = false;

        table.update(data.records, data.tableColumns.val());
        chart.update(data.records, data.xAxis.val(), data.yAxis.val(), data.variable.val());

        if (tableTab.is(':visible'))
            renderTable();

        if (statsTab.is(':visible'))
            renderStatistics();

        if (chartTab.is(':visible'))
            renderChart();
    });

    $('#table-tab').on('shown.bs.tab', function () {
        if (!loading && tableTab.find('.loading').is(':visible'))
            renderTable();
    });

    $('#stats-tab').on('shown.bs.tab', function () {
        if (!loading && statsTab.find('.loading').is(':visible'))
            renderStatistics();
    });

    $('#chart-tab').on('shown.bs.tab', function () {
        if (!loading && chartTab.find('.loading').is(':visible'))
            renderChart();
    });

    function renderTable() {
        tableTab.find('.loading').hide();
        table.render();
        tableTab.find('.content').show();
    }

    function renderChart() {
        chartTab.find('.loading').hide();
        chart.render();
        chartTab.find('.content').show();
    }

    function renderStatistics() {
        statsTab.find('.loading').hide();

        var missingTotals = {};
        data.records.forEach(function (row) {
            $.forEachInObject(data.variables, function (variable) {
                var val = (variable === 'DATE') ? row.DATEfrom : row[variable];
                var count = (val !== undefined) ? 0 : 1;
                $.addToObject(missingTotals, variable, count, function (value) {
                    return value + count;
                });
            });
        });

        var html = '<h3>Missing data</h3>';

        var count = 0;
        $.forEachInObject(data.variables, function (variable) {
            if (missingTotals[variable] > 0) {
                if (count % 2 === 0) {
                    html += '<div class="row">';
                }

                html += '<div class="col-md-3"><strong>' + data.fields[variable] + ':' + '</strong></div>';
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

        statsTab.find('.content').html(html).show();
    }

    $.forEachInObject = function (obj, callback) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                callback(key, obj[key]);
            }
        }
    };

    $.addToObject = function (obj, key, ifNotExists, ifExists) {
        if (obj[key] === undefined) {
            obj[key] = ifNotExists;
        }
        else if ($.isFunction(ifExists)) {
            obj[key] = ifExists(obj[key]);
        }
        else if (ifExists !== undefined) {
            obj[key] = ifExists;
        }
    };
})(jQuery, Data, Table, Chart);
