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

        this.totalDaysPerAuthority = {};
        this.totalDaysPerMint = {};

        var width = 1110,
            height = 1000;

        var svg = d3.select(elem).append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('cursor', 'pointer');

        var projection = d3.geo.mercator()
            .scale(8000)
            .center([0, 51.5])
            .rotate([-4.8, 0])
            .translate([(width / 2) + 200, height / 2]);

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
            })
            .on('dragend', function () {
                onYear(lastYearVal);
            });

        var map = createMap();
        var legend = createLegend();
        var slider = createSlider();
        var info = createInfo();

        this.update = function (data, values) {
            this.data = data;
            this.values = values;
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

                onYear(yearRange.domain()[0]);

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

                    that.render();
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
                .style('pointer-events', 'none')
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
                .text('Show/hide authorities by year')
                .attr('x', 100)
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(0,50)')
                .style('font-size', '10px');

            drag.on('drag', function () {
                lastYearVal = Math.round(yearRange.invert(d3.event.x));
                handleYear.text(lastYearVal);
                handle.attr('transform', 'translate(' + yearRange(yearRange.invert(d3.event.x)) + ',0)');
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
            d3.json('/geojson/authorities.json', function (error, authorities) {
                if (error) return console.error(error);

                var features = [];
                var skip = ['Utrecht (Province)', 'Friesland (Province)', 'Groningen', 'Guelders (Province)', 'Holland (Province)'];

                authorities.features.forEach(function (feature) {
                    if ((feature.properties !== undefined) && (feature.properties.AUTHORITY !== null)
                        && (feature.properties.AUTHORITY.indexOf('Kingdom') === -1)
                        && (skip.indexOf(feature.properties.AUTHORITY) === -1)) {

                        features.push(feature);
                    }
                });

                callback(features);
            });
        }

        function getMints(callback) {
            d3.json('/geojson/mint.json', function (error, mint) {
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

                        props.range = moment.range(
                            moment(props.DATEfrom, 'YYYY/MM/DD'),
                            moment(props.DATEto, 'YYYY/MM/DD').add(1, 'd')
                        );
                        props.days = props.range.end.diff(props.range.start, 'days');

                        $.addToObject(that.authorities, props.AUTHORITY, [props], function (val) {
                            val.push(props);
                            return val;
                        });

                        $.addToObject(that.mints, props.MINT, [props], function (val) {
                            val.push(props);
                            return val;
                        });

                        if (!(props.AUTHORITY in that.totalDaysPerAuthority))
                            that.totalDaysPerAuthority[props.AUTHORITY] = {};

                        $.addToObject(that.totalDaysPerAuthority[props.AUTHORITY], props.MINT, props.days, function (val) {
                            return val + props.days;
                        });

                        if (!(props.MINT in that.totalDaysPerMint))
                            that.totalDaysPerMint[props.MINT] = {};

                        $.addToObject(that.totalDaysPerMint[props.MINT], props.AUTHORITY, props.days, function (val) {
                            return val + props.days;
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
                    var fillColor = emptyColor;
                    var percentages = getPercentagesForAuthority(d.properties.AUTHORITY);
                    if ((percentages.parts.length > 0) && (percentages.percentage > 0))
                        fillColor = color(percentages.percentage);
                    return fillColor;
                });
        }

        function updateMintsPercentages() {
            map.selectAll('.mint')
                .data(that.mintsFeatures)
                .each(function (mint) {
                    var p = getPercentagesForMint(mint.properties.MINT);

                    var arcs = d3.select(this)
                        .selectAll('.arc')
                        .data(pie([100 - p.percentage, p.percentage]));

                    arcs.enter()
                        .append('path')
                        .attr('class', 'arc')
                        .attr('stroke', function (d) {
                            if (d.startAngle === d.endAngle)
                                return 'none';
                            return pieColor;
                        })
                        .attr('fill', function (d, i) {
                            return (i === 0) ? 'white' : pieColor;
                        });

                    arcs.attr('d', pieArc);
                });
        }

        function onHoverAuthority(d) {
            setInfoBlock(
                getPercentagesForAuthority(d.properties.AUTHORITY),
                d.properties.AUTHORITY,
                'MINT'
            );
        }

        function onHoverMint(d) {
            setInfoBlock(
                getPercentagesForMint(d.properties.MINT),
                d.properties.MINT,
                'AUTHORITY'
            );
        }

        function hideInfo() {
            if (!isZooming)
                info.selectAll('*').remove();
        }

        function setInfoBlock(percentages, defaultLabel, labelKey) {
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

                setInfo(width, height, part.percentage, part[labelKey], false);
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

        function getPercentagesForAuthority(authority) {
            return getPercentages('AUTHORITY', 'MINT', authority, that.authorities, that.totalDaysPerAuthority)
        }

        function getPercentagesForMint(mint) {
            return getPercentages('MINT', 'AUTHORITY', mint, that.mints, that.totalDaysPerMint)
        }

        function getPercentages(keyFilter, keyObtain, value, props, totalDaysList) {
            // Make sure we have data to gain a coverage percentage
            if (value in props) {
                var propsOld = props[value];
                var propsNew = [];

                // Try to map all the filtered data
                that.data.forEach(function (d) {
                    if (d[keyFilter] === value) {
                        // Compute the range of this data
                        var range = moment.range(
                            moment(new Date(d.DATEfrom.year, d.DATEfrom.month - 1, d.DATEfrom.day)),
                            moment(new Date(d.DATEto.year, d.DATEto.month - 1, d.DATEto.day)).add(1, 'd')
                        );

                        // Go over all the dates we have, and match this range with the range of the data
                        propsOld.forEach(function (p) {
                            var propsAdded = false;

                            // Every range that overlaps, remove that of the range
                            if (p[keyObtain] === d[keyObtain]) {
                                if (p.range.overlaps(range)) {
                                    p.range.subtract(range).forEach(function (rangesLeft) {
                                        var newProps = {MINT: p.MINT, AUTHORITY: p.AUTHORITY};
                                        newProps.range = rangesLeft;
                                        newProps.days = newProps.range.end.diff(newProps.range.start, 'days');
                                        propsNew.push(newProps);
                                    });
                                    propsAdded = true;
                                }
                            }

                            if (!propsAdded)
                                propsNew.push(p);
                        });

                        propsOld = propsNew;
                        propsNew = [];
                    }
                });

                // Whatever ranges we have left, are the ranges we could not map to the data
                var percentages = [];
                $.forEachInObject(totalDaysList[value], function (val, totalDays) {
                    var daysLeft = propsOld.reduce(function (days, p) {
                        if (p[keyObtain] === val)
                            return days + p.days;
                        return days;
                    }, 0);

                    var obj = {percentage: 100 - Math.round(daysLeft / (totalDays / 100))};
                    obj[keyObtain] = val;

                    percentages.push(obj);
                });

                var total = 0;
                percentages.forEach(function (p) {
                    total += p.percentage;
                });
                var avg = total / percentages.length;

                return {percentage: avg, parts: percentages};
            }

            return {percentage: 0, parts: []};
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
                    if (d.properties.YEARfrom && d.properties.YEARto) {
                        if ((year < d.properties.YEARfrom) || (year > d.properties.YEARto))
                            return 'hidden';
                    }
                    return 'visible';
                });
        }
    };
})(jQuery, d3, moment);