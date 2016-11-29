/*global jQuery, Data, Table, Chart, Map*/
(function ($, Data, Table, Chart, Map) {
    'use strict';

    var tableTab = $('#table'), chartTab = $('#chart'), mapTab = $('#map');
    var data = new Data('#download', '#run', '#tableColumns', '#xAxis', '#yAxis', '#variable',
        '#pctByYear', '#showFilteredMints');
    var table, chart, map = null;
    var loading = true;

    data.onInitialize(function () {
        table = new Table('#table .content', data.variables, data.fields);
        chart = new Chart('#chart .content', data.variables, data.fields);
        map = new Map('#map .content', data.variables, data.fields);
    });

    data.onRefresh(function () {
        loading = true;
        $('.tab-content .tab-pane').each(function (i, tabPane) {
            $(tabPane).find('.content').hide();
            $(tabPane).find('.loading').show();
        });
    });

    data.onData(function () {
        loading = false;

        table.update(data.records, data.tableColumns.val());
        chart.update(data.records, data.xAxis.val(), data.yAxis.val(), data.variable.val());
        map.update(data.records, data.values, data.pctByYear.is(':checked'), data.showFilteredMints.is(':checked'));

        if (tableTab.is(':visible'))
            renderTable();

        if (chartTab.is(':visible'))
            renderChart();

        if (mapTab.is(':visible'))
            renderMap();
    });

    $('#table-tab').on('shown.bs.tab', function () {
        setTimeout(function () {
            if (!loading && tableTab.find('.loading').is(':visible'))
                renderTable();
        }, 5);
    });

    $('#chart-tab').on('shown.bs.tab', function () {
        setTimeout(function () {
            if (!loading && chartTab.find('.loading').is(':visible'))
                renderChart();
        }, 5);
    });

    $('#map-tab').on('shown.bs.tab', function () {
        setTimeout(function () {
            if (!loading && mapTab.find('.loading').is(':visible'))
                renderMap();
        }, 5);
    });

    function renderTable() {
        table.render();
        tableTab.find('.loading').hide();
        tableTab.find('.content').show();
    }

    function renderChart() {
        chart.render();
        chartTab.find('.loading').hide();
        chartTab.find('.content').show();
    }

    function renderMap() {
        map.render();
        mapTab.find('.loading').hide();
        mapTab.find('.content').show();
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
})(jQuery, Data, Table, Chart, Map);
