/*global jQuery*/
var Data = (function ($) {
    'use strict';

    var that;
    var initializeCallbacks = [], refreshCallbacks = [], dataCallbacks = [];

    return function (downloadElem, runElem, tableColumnsElem, xAxisElem, yAxisElem, variableElem,
                     pctByYearElem, showFilteredMintsElem) {
        that = this;

        this.variables = {
            UID: {
                date: false,
                text: true,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: false
            },
            TYPEID: {
                date: false,
                text: true,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: true
            },
            SOURCE: {
                date: false,
                text: true,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: true
            },
            MINT: {
                date: false,
                text: true,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: true
            },
            AUTHORITY: {
                date: false,
                text: true,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: true
            },
            DATE: {
                date: true,
                text: false,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: false
            },
            DATEfrom: {
                date: true,
                text: false,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: true
            },
            DATEto: {
                date: true,
                text: false,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: true
            },
            CoinNAME: {
                date: false,
                text: true,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: true
            },
            ALLOY: {
                date: false,
                text: true,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: true
            },
            VALUEd: {
                date: false,
                text: false,
                number: true,
                divideByDays: false,
                divideByQtty: true,
                variableOfInterest: true
            },
            QTTYcoins: {
                date: false,
                text: false,
                number: true,
                divideByDays: true,
                divideByQtty: false,
                variableOfInterest: true
            },
            FINEness: {
                date: false,
                text: false,
                number: true,
                divideByDays: false,
                divideByQtty: true,
                variableOfInterest: true
            },
            WEIGHTraw: {
                date: false,
                text: false,
                number: true,
                divideByDays: true,
                divideByQtty: false,
                variableOfInterest: true
            },
            WEIGHTfine: {
                date: false,
                text: false,
                number: true,
                divideByDays: true,
                divideByQtty: false,
                variableOfInterest: true
            },
            TAILLE: {
                date: false,
                text: false,
                number: true,
                divideByDays: false,
                divideByQtty: true,
                variableOfInterest: true
            },
            AUTHORITY_SUPRA: {
                date: false,
                text: true,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: true
            },
            ALT_CoinNAME: {
                date: false,
                text: true,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: true
            },
            ALT_TYPEID: {
                date: false,
                text: true,
                number: false,
                divideByDays: false,
                divideByQtty: false,
                variableOfInterest: true
            },
            VALUE_HourlyWAGE: {
                date: false,
                text: false,
                number: true,
                divideByDays: false,
                divideByQtty: true,
                variableOfInterest: true
            }
        };

        this.tableColumns = $(tableColumnsElem);
        this.xAxis = $(xAxisElem);
        this.yAxis = $(yAxisElem);
        this.variable = $(variableElem);
        this.pctByYear = $(pctByYearElem);
        this.showFilteredMints = $(showFilteredMintsElem);

        this.onInitialize = function (callback) {
            initializeCallbacks.push(callback);
        };

        this.onRefresh = function (callback) {
            refreshCallbacks.push(callback);
        };

        this.onData = function (callback) {
            dataCallbacks.push(callback);
        };

        $.getJSON('/fields', function (data) {
            that.fields = data;

            var allSelects = $('select');
            var select = allSelects.not(that.tableColumns).not(that.xAxis).not(that.yAxis).not(that.variable);
            $.forEachInObject(that.fields, function (key, label) {
                var selects = $();

                if (that.variables[key].variableOfInterest) {
                    if (that.variables[key].text)
                        selects = selects.add(xAxis).add(variable);
                    if (that.variables[key].number)
                        selects = selects.add(yAxis);
                }

                if (!that.variables[key].date)
                    selects = selects.add(select);

                if (key !== 'DATE')
                    selects = selects.add(that.tableColumns);

                selects.append($("<option></option>").attr('value', key).text(label));
            });

            select.val('');
            that.xAxis.val('year');
            that.yAxis.val('total');
            that.variable.val('');
            that.tableColumns.val(['CoinNAME', 'MINT', 'AUTHORITY', 'ALLOY']);

            createSelect(allSelects);
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

            $(downloadElem).click(function () {
                window.open('/csv?' + $.param(getParams()));
            });

            $(runElem).click(function () {
                refreshData(getParams());
            });

            initializeCallbacks.forEach(function (callback) {
                callback();
            });
        });

        function createSelect(elems) {
            elems.select2({theme: 'bootstrap', width: '100%'});
        }

        function refreshData(params) {
            params = params || {};

            refreshCallbacks.forEach(function (callback) {
                callback();
            });

            $.getJSON('/json', params, function (data) {
                that.values = data.values;
                that.records = data.records;

                dataCallbacks.forEach(function (callback) {
                    callback();
                });
            });
        }

        function selectCriteriaField(field) {
            var val = field.val();
            var criteriaBlock = field.closest('.criteria-block');
            var textBlock = criteriaBlock.find('.text-criteria');
            var numberBlock = criteriaBlock.find('.number-criteria');

            if (val) {
                if (that.variables[val].text) {
                    numberBlock.hide();
                    textBlock.show();

                    var inputField = textBlock.find('input[type=text]').typeahead('destroy');
                    if ((that.values !== undefined) && (that.values[val] !== undefined)) {
                        inputField.typeahead({
                            source: that.values[val],
                            minLength: 0,
                            showHintOnFocus: true,
                            items: 'all'
                        });
                    }
                }

                if (that.variables[val].number) {
                    textBlock.hide();
                    numberBlock.show();
                }
            }
        }

        function addRow(formGroup) {
            var selectOrg = formGroup.find('select').select2('destroy');
            var newFormGroup = formGroup.clone();
            var selectNew = newFormGroup.find('select').val('');

            newFormGroup.find('[name]').each(function (i, elem) {
                var name = $(elem).attr('name');
                var number = parseInt(name.substring(name.length - 1, name.length));
                name = name.substring(0, name.length - 1) + (number + 1);
                $(elem).attr('name', name);
            });

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
                var field = criteriaBlock.find('select[name^=criteria-column]').val();

                if ((field !== undefined) && (field !== null) && (field.length > 0)) {
                    if (textBlock.is(':visible')) {
                        var negativeText = textBlock.find('input[name^=negative-text]:checked').val();
                        var contains = textBlock.find('input[name^=contains]:checked').val();
                        var value = textBlock.find('input[name^=criteria-value]').val().trim();

                        if (value.length > 0) {
                            var textVal = negativeText + ':' + contains + ':' + value;

                            if (params[field] !== undefined)
                                params[field] = [params[field], textVal];
                            else
                                params[field] = textVal;
                        }
                    }
                    else if (numberBlock.is(':visible')) {
                        var negativeNumber = numberBlock.find('input[name^=negative-number]:checked').val();
                        var min = numberBlock.find('input[name^=criteria-min]').val();
                        var max = numberBlock.find('input[name^=criteria-max]').val();

                        if ($.isNumeric(min) && $.isNumeric(max)) {
                            var numberVal = negativeNumber + ':' + min + ':' + max;

                            if (params[field] !== undefined)
                                params[field] = [params[field], numberVal];
                            else
                                params[field] = numberVal;
                        }
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
    };
})(jQuery);