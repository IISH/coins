/*global jQuery, d3, moment*/
var Map = (function ($, d3, moment) {
    'use strict';

    var that;

    return function (elem, variables, fields) {
        that = this;

        this.elem = elem;
        this.variables = variables;
        this.fields = fields;

        this.authorities = {};
        this.mints = {};

        var width = 1110,
            height = 1050;

        var svg = d3.select(elem).append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('cursor', 'pointer');

        var projection = d3.geo.mercator()
            .scale(7500)
            .center([0, 51.5])
            .rotate([-4.8, 0])
            .translate([(width / 2) + 100, height / 2]);

        var path = d3.geo.path().projection(projection);

        var emptyColor = 'lightgrey';
        var pieColor = '#6B486B';
        var color = d3.scale.linear()
            .domain([0, 100])
            .range(['#fff951', '#dd3030']);

        var sliderWidth = 200;
        var yearRange = d3.scale.linear()
            .domain([1334, 1830])
            .range([0, sliderWidth])
            .clamp(true);

        var pie = d3.layout.pie();

        var pieArc = d3.svg.arc()
            .outerRadius(5)
            .innerRadius(0);

        var infoArcRadius = 15;

        var infoArc = d3.svg.arc()
            .outerRadius(infoArcRadius)
            .innerRadius(0);

        var isZooming = false;
        svg.call(
            d3.behavior.zoom()
                .scaleExtent([1, 8])
                .on('zoomstart', function () {
                    isZooming = true;
                })
                .on('zoomend', function () {
                    isZooming = false;
                })
                .on('zoom', zoomed)
        );

        var lastYearVal = yearRange.domain()[0];
        var drag = d3.behavior.drag()
            .on('dragstart', function () {
                d3.event.sourceEvent.stopPropagation();
            });

        var map = createMap();
        var legend = createLegend();
        var slider = createSlider();
        var info = createInfo();

        this.update = function (data, values, pctByYear, showFilteredMints) {
            this.data = data;
            this.values = values;
            this.pctByYear = pctByYear;
            this.showFilteredMints = showFilteredMints;

            this.yearsDiffAuthorities = {};
            this.yearsDiffMints = {};
        };

        this.render = function () {
            if ($.isArray(this.data) && !$.isEmptyObject(this.authorities) && !$.isEmptyObject(this.mints)) {
                updateAuthoritiesPercentages();
                updateMintsPercentages();
            }
        };

        function createMap() {
            var map = svg.append('g').attr('class', 'map');

            getAuthorities(function (authorities) {
                that.authoritiesFeatures = authorities;

                map.selectAll('.authority')
                    .data(that.authoritiesFeatures)
                    .enter()
                    .append('path')
                    .attr('stroke', '#777')
                    .attr('class', 'authority')
                    .attr('data-authority', function (d) {
                        return d.properties.AUTHORITY;
                    })
                    .attr('d', path)
                    .on('mouseover', onHoverAuthority)
                    .on('mouseout', hideInfo);

                getMints(function (mints) {
                    that.mintsFeatures = mints;

                    map.selectAll('.mint')
                        .data(that.mintsFeatures)
                        .enter()
                        .append('g')
                        .attr('class', 'mint')
                        .attr('data-mint', function (d) {
                            return d.properties.ID;
                        })
                        .attr('transform', function (d) {
                            return 'translate(' + projection(d.geometry.coordinates)[0] + ' ' + projection(d.geometry.coordinates)[1] + ')';
                        })
                        .on('mouseover', onHoverMint)
                        .on('mouseout', hideInfo);

                    onYear(yearRange.domain()[0]);
                });
            });

            return map;
        }

        function createLegend() {
            var defs = svg.append('defs')
                .append('linearGradient')
                .attr('id', 'gradient')
                .attr('x1', '100%')
                .attr('y1', '0%')
                .attr('x2', '100%')
                .attr('y2', '100%');

            defs.append('stop')
                .attr('offset', '0%')
                .attr('stop-color', function () {
                    return color(0);
                });

            defs.append('stop')
                .attr('offset', '100%')
                .attr('stop-color', function () {
                    return color(100);
                });

            var legend = svg.append('g')
                .style('pointer-events', 'none')
                .attr('class', 'legend')
                .attr('transform', 'translate(10,10)');

            legend.append('text')
                .text('Percentage data available')
                .attr('x', -150)
                .attr('text-anchor', 'middle')
                .attr('transform', 'rotate(270)')
                .style('font-size', '10px');

            legend.append('rect')
                .attr('width', 20)
                .attr('height', 20)
                .attr('fill', emptyColor)
                .attr('transform', 'translate(10,5)');

            legend.append('rect')
                .attr('width', 20)
                .attr('height', 200)
                .attr('fill', 'url(#gradient)')
                .attr('transform', 'translate(10,55)');

            legend.append('text')
                .text('0%')
                .attr('x', 20)
                .attr('text-anchor', 'middle')
                .style('font-size', '10px');

            legend.append('text')
                .text('> 0%')
                .attr('x', 20)
                .attr('y', 50)
                .attr('text-anchor', 'middle')
                .style('font-size', '10px');

            legend.append('text')
                .text('100%')
                .attr('x', 20)
                .attr('y', 270)
                .attr('text-anchor', 'middle')
                .style('font-size', '10px');

            return legend;
        }

        function createSlider() {
            var slider = svg.append('g')
                .attr('class', 'slider')
                .attr('transform', 'translate(70,10)');

            slider.append('line')
                .attr('class', 'track')
                .attr('x1', yearRange.range()[0])
                .attr('x2', yearRange.range()[1])
                .attr('transform', 'translate(0,15)')
                .style({
                    'stroke-linecap': 'round',
                    'stroke': '#000',
                    'stroke-opacity': '0.3',
                    'stroke-width': '10px'
                });

            slider.append('line')
                .attr('class', 'track-inset')
                .attr('x1', yearRange.range()[0])
                .attr('x2', yearRange.range()[1])
                .attr('transform', 'translate(0,15)')
                .style({
                    'stroke-linecap': 'round',
                    'stroke': '#ddd',
                    'stroke-width': '8px'
                });

            slider.append('line')
                .attr('class', 'track-overlay')
                .attr('x1', yearRange.range()[0])
                .attr('x2', yearRange.range()[1])
                .attr('transform', 'translate(0,15)')
                .style({
                    'stroke-linecap': 'round',
                    'pointer-events': 'stroke',
                    'stroke-width': '50px',
                    'cursor': 'crosshair'
                })
                .call(drag);

            slider.insert('g', '.track-overlay')
                .attr('class', 'ticks')
                .attr('transform', 'translate(0,33)')
                .selectAll('text')
                .data(yearRange.ticks(5))
                .enter()
                .append('text')
                .attr('x', yearRange)
                .attr('text-anchor', 'middle')
                .style('font-size', '10px')
                .text(function (d) {
                    return d;
                });

            var handle = slider.insert('g', '.track-overlay').attr('class', 'handle');

            var handleYear = handle.insert('text')
                .attr('class', 'handle-year')
                .attr('text-anchor', 'middle')
                .style('font-size', '10px')
                .text(yearRange.domain()[0]);

            handle.insert('circle')
                .attr('class', 'handle-circle')
                .attr('r', 9)
                .attr('transform', 'translate(0,15)')
                .style({
                    'fill': '#fff',
                    'stroke': '#000',
                    'stroke-opacity': '0.5',
                    'stroke-width': '1.25px'
                });

            slider.append('text')
                .text('Show/hide mint houses/authorities by year')
                .attr('x', 100)
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(0,50)')
                .style('font-size', '10px');

            drag.on('drag', function () {
                lastYearVal = Math.round(yearRange.invert(d3.event.x));
                handleYear.text(lastYearVal);
                handle.attr('transform', 'translate(' + yearRange(yearRange.invert(d3.event.x)) + ',0)');
                onYear(lastYearVal);
            });

            return slider;
        }

        function createInfo() {
            return svg.append('g')
                .style('pointer-events', 'none')
                .attr('class', 'info')
                .attr('transform', 'translate(70,80)');
        }

        function getAuthorities(callback) {
            d3.json('/geo/authorities', function (error, authorities) {
                if (error) return console.error(error);

                var features = authorities.features.filter(function (feature) {
                    return (feature.properties !== undefined) && (feature.properties.AUTHORITY !== null);
                });

                callback(features);
            });
        }

        function getMints(callback) {
            d3.json('/geo/mints', function (error, mint) {
                if (error) return console.error(error);

                var mints = [];
                var features = [];
                mint.features.forEach(function (feature) {
                    var props = feature.properties;

                    if ((props.MINT !== null) && (props.AUTHORITY !== null) &&
                        (props.DATEfrom !== null) && (props.DATEto !== null)) {

                        if (mints.indexOf(props.MINT) === -1) {
                            mints.push(props.MINT);
                            features.push(feature);
                        }

                        var from = moment(props.DATEfrom, 'YYYY/MM/DD');
                        var to = moment(props.DATEto, 'YYYY/MM/DD');
                        props.years = getYears(from.year(), to.year());

                        $.addToObject(that.authorities, props.AUTHORITY, [props], function (val) {
                            val.push(props);
                            return val;
                        });

                        $.addToObject(that.mints, props.MINT, [props], function (val) {
                            val.push(props);
                            return val;
                        });
                    }
                });

                callback(features);
            });
        }

        function updateAuthoritiesPercentages() {
            map.selectAll('.authority')
                .data(that.authoritiesFeatures)
                .attr('fill', function (d) {
                    var auth = d.properties.AUTHORITY;

                    // Compute the years difference if not done so already
                    if (!(auth in that.yearsDiffAuthorities))
                        that.yearsDiffAuthorities[auth] = getYearsDifferenceForAuthority(auth);

                    var fillColor = emptyColor;
                    var percentages = getPercentages(that.yearsDiffAuthorities[auth]);
                    if ((percentages.parts.length > 0) && (percentages.percentage > 0))
                        fillColor = color(percentages.percentage);
                    return fillColor;
                });
        }

        function updateMintsPercentages() {
            map.selectAll('.mint')
                .data(that.mintsFeatures)
                .each(function (mint) {
                    var m = mint.properties.MINT;

                    // Compute the years difference if not done so already
                    if (!(m in that.yearsDiffMints))
                        that.yearsDiffMints[m] = getYearsDifferenceForMint(m);

                    var p = getPercentages(that.yearsDiffMints[m]);

                    var arcs = d3.select(this)
                        .selectAll('.arc')
                        .data(pie([100 - p.percentage, p.percentage]));

                    arcs.enter()
                        .append('path')
                        .attr('class', 'arc')
                        .attr('fill', function (d, i) {
                            return (i === 0) ? 'white' : pieColor;
                        });

                    arcs.attr('d', pieArc)
                        .attr('stroke', function (d) {
                            if (d.startAngle === d.endAngle)
                                return 'none';
                            return pieColor;
                        });
                });
        }

        function onHoverAuthority(d) {
            setInfoBlock(getPercentages(that.yearsDiffAuthorities[d.properties.AUTHORITY]), d.properties.AUTHORITY);
        }

        function onHoverMint(d) {
            setInfoBlock(getPercentages(that.yearsDiffMints[d.properties.MINT]), d.properties.MINT);
        }

        function hideInfo() {
            if (!isZooming)
                info.selectAll('*').remove();
        }

        function setInfoBlock(percentages, defaultLabel) {
            if (isZooming)
                return;

            var margin = 5, height = margin, defaultWidth = 250 + margin;

            var rect = info.append('rect')
                .attr('fill', '#EFF0F1')
                .attr('fill-opacity', '0.6');

            setInfo(margin, height, percentages.percentage, defaultLabel, true);
            percentages.parts.forEach(function (part, i) {
                var width = defaultWidth + margin;
                if (i % 2 === 0) {
                    width = margin;
                    height += (infoArcRadius * 2) + 10 + margin;
                }

                setInfo(width, height, part.percentage, part.name, false);
            });
            height += (infoArcRadius * 2) + 10;

            rect.attr('width', (defaultWidth * 2) + margin).attr('height', height);
        }

        function setInfo(width, height, percentage, label, isBold) {
            var g = info.append('g').attr('transform', 'translate(' + width + ',' + height + ')');

            g.append('g')
                .attr('transform', 'translate(' + infoArcRadius + ',' + infoArcRadius + ')')
                .selectAll('.arc')
                .data(pie([100 - percentage, percentage]))
                .enter()
                .append('path')
                .attr('class', 'arc')
                .attr('d', infoArc)
                .attr('stroke', function (d) {
                    if (d.startAngle === d.endAngle)
                        return 'none';
                    return pieColor;
                })
                .style('fill', function (d, i) {
                    return (i === 0) ? 'white' : pieColor;
                });

            var text = g.append('text')
                .text(label)
                .attr('x', 50)
                .attr('y', infoArcRadius + 6)
                .style({
                    'font-size': '16px',
                    'font-weight': isBold ? 'bold' : 'normal'
                });

            g.append('text')
                .text('(' + Math.round(percentage) + '%)')
                .attr('x', 52 + text.node().getComputedTextLength())
                .attr('y', infoArcRadius + 6)
                .style({
                    'font-size': '16px',
                    'font-style': 'italic',
                    'font-weight': isBold ? 'bold' : 'normal'
                });
        }

        function getYearsDifferenceForAuthority(authority) {
            return getYearsDifference('AUTHORITY', 'MINT', authority, that.authorities);
        }

        function getYearsDifferenceForMint(mint) {
            return getYearsDifference('MINT', 'AUTHORITY', mint, that.mints);
        }

        function getYearsDifference(keyFilter, keyObtain, value, props) {
            // Make sure we have data to map the years difference
            if (value in props) {
                // Collect all the years that we should try to map
                var yearsPerKey = {};
                props[value].forEach(function (p) {
                    if (yearsPerKey[p[keyObtain]] === undefined)
                        yearsPerKey[p[keyObtain]] = {yearsBefore: [], yearsAfter: []};

                    yearsPerKey[p[keyObtain]].yearsBefore = p.years.concat(yearsPerKey[p[keyObtain]].yearsBefore);
                    yearsPerKey[p[keyObtain]].yearsAfter = yearsPerKey[p[keyObtain]].yearsBefore.slice(0);
                });

                // Try to map all the filtered data
                that.data.forEach(function (d) {
                    if (d.QTTYcoins !== undefined) {
                        var filterValues = getValues(d, keyFilter);

                        if (filterValues.indexOf(value) >= 0) {
                            var years = getYears(d.DATEfrom.year, d.DATEto.year);
                            var allValues = getValues(d, keyObtain);

                            // All years that we found in the filtered data, remove those from the list
                            allValues.forEach(function (value) {
                                if (value in yearsPerKey) {
                                    yearsPerKey[value].yearsAfter = yearsPerKey[value].yearsAfter.filter(function (year) {
                                        return years.indexOf(year) < 0;
                                    });
                                }
                            });
                        }
                    }
                });

                return yearsPerKey;
            }

            return [];
        }

        function getPercentages(yearsDifference) {
            var percentages = [];

            // Map the years difference for each part to a percentage
            $.forEachInObject(yearsDifference, function (key, yearsObj) {
                var percentage = null;
                if (that.pctByYear) {
                    if (yearsObj.yearsBefore.indexOf(lastYearVal) >= 0)
                        percentage = (yearsObj.yearsAfter.indexOf(lastYearVal) >= 0) ? 0 : 100;
                }
                else
                    percentage = 100 - Math.round(yearsObj.yearsAfter.length / (yearsObj.yearsBefore.length / 100));

                if (percentage !== null)
                    percentages.push({percentage: percentage, name: key});
            });

            // Sort the collected percentages parts, first by percentage, then by name
            percentages.sort(function (a, b) {
                if (a.percentage > b.percentage)
                    return -1;
                if (a.percentage < b.percentage)
                    return 1;
                return a.name.localeCompare(b.name);
            });

            // Then compute the total percentage
            var total = percentages.reduce(function (t, p) {
                return t + p.percentage;
            }, 0);
            var avg = (percentages.length > 0) ? (total / percentages.length) : 0;

            return {percentage: avg, parts: percentages};
        }

        function getYears(from, to) {
            var years = [];
            for (var year = from; year <= to; year++) {
                years.push(year);
            }
            return years;
        }

        function getValues(data, key) {
            var values = data[key];
            if ((values === null) || (values === undefined))
                return [];

            return values.split('/').map(function (val) {
                if (val.substr(val.length - 1) === '?')
                    return val.substr(0, val.length - 1).trim();
                return val.trim();
            });
        }

        function zoomed() {
            map.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
            map.selectAll('.authority').style('stroke-width', 1 / d3.event.scale + 'px');
            map.selectAll('.mint').style('stroke-width', 1 / d3.event.scale + 'px');
        }

        function onYear(year) {
            map.selectAll('.authority')
                .data(that.authoritiesFeatures)
                .attr('visibility', function (d) {
                    // Only show an authority, when it existed for the given year
                    if (d.properties.DATEfrom && d.properties.DATEto) {
                        var from = moment(d.properties.DATEfrom, 'YYYY/MM/DD');
                        var to = moment(d.properties.DATEto, 'YYYY/MM/DD');

                        if ((year < from.year()) || (year > to.year()))
                            return 'hidden';
                    }
                    return 'visible';
                });

            map.selectAll('.mint')
                .data(that.mintsFeatures)
                .attr('visibility', function (d) {
                    var visibility = 'hidden';

                    // Only show a mint house, when it existed for the given year
                    // or when it is among the filtered mints, if we only can show filtered mints
                    if (!that.showFilteredMints || (that.values.MINT.indexOf(d.properties.MINT) >= 0)) {
                        that.mints[d.properties.MINT].forEach(function (props) {
                            var from = moment(props.DATEfrom, 'YYYY/MM/DD');
                            var to = moment(props.DATEto, 'YYYY/MM/DD');

                            if ((year >= from.year()) && (year <= to.year()))
                                visibility = 'visible';
                        });
                    }

                    return visibility;
                });

            // If we show a percentage by year, then also update those percentages for this year
            if (that.pctByYear) {
                updateAuthoritiesPercentages();
                updateMintsPercentages();
            }
        }
    };
})(jQuery, d3, moment);