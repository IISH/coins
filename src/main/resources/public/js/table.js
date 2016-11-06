/*global jQuery*/
var Table = (function ($) {
    'use strict';

    var that;

    return function (elem, variables, fields) {
        that = this;

        this.table = $(elem);
        this.variables = variables;
        this.fields = fields;

        this.update = function (data, columns) {
            this.data = data;
            this.columns = columns;
        };

        this.render = function () {
            var tableColumns = getTableColumns();
            generateTable(tableColumns);
        };

        function getTableColumns() {
            var tableColumns = [];
            that.columns.forEach(function (field) {
                var columnData = {
                    data: field,
                    title: that.fields[field],
                    defaultContent: '<i>Unknown</i>'
                };

                if (that.variables[field].date) {
                    columnData.render = function (date) {
                        return date.day + '-' + date.month + '-' + date.year;
                    };
                }

                tableColumns.push(columnData);
            });
            return tableColumns;
        }

        function generateTable(tableColumns) {
            if (that.dataTable) {
                that.dataTable.destroy();
                that.table.empty();
            }

            var table = $('<table class="table table-striped table-hover" style="width:100%;"></table>').appendTo(that.table);

            that.dataTable = table.DataTable({
                data: that.data,
                columns: tableColumns,
                searching: false
            });

            table.find('tbody').on('click', 'tr', function () {
                var tr = $(this);
                var row = that.dataTable.row(tr);

                if (row.child.isShown()) {
                    row.child.hide();
                }
                else {
                    row.child(detailedDataHtml(row.data())).show();
                }
            });
        }

        function detailedDataHtml(row) {
            var html = '';

            var i = 0;
            $.forEachInObject(that.variables, function (variable) {
                if (!that.variables[variable].date || (variable == 'DATE')) {
                    if (i % 2 === 0) {
                        html += '<div class="row">';
                    }

                    html += '<div class="col-md-3"><strong>' + that.fields[variable] + ':' + '</strong></div>';
                    html += '<div class="col-md-3">' + getValue(row, variable) + '</div>';

                    if (i % 2 === 1) {
                        html += '</div>';
                    }

                    i++;
                }
            });

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
    };
})(jQuery);