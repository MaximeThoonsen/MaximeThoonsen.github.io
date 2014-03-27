var continents, group, height, path, patternNegatif, patternPositif, svg, topMargin, width;

path = d3.geo.path().projection(d3.geo.eckert3().scale(180));

width = window.innerWidth - 150;

topMargin = 50;

height = window.innerHeight;

svg = d3.select("#worldmap").attr("width", width).attr("height", height);

patternPositif = svg.append("svg:defs").append("svg:pattern").attr("id", "dotsPatternPositif").attr("x", 0).attr("y", 0).attr("width", 8).attr("height", 8).attr("patternUnits", "userSpaceOnUse").attr("patternContentUnits", "userSpaceOnUse");

patternPositif.append("svg:circle").attr("r", 3).attr("cx", 4).attr("cy", 4).style("fill", "#00A700");

patternNegatif = svg.append("svg:defs").append("svg:pattern").attr("id", "dotsPatternNegatif").attr("x", 0).attr("y", 0).attr("width", 8).attr("height", 8).attr("patternUnits", "userSpaceOnUse");

patternNegatif.append("svg:circle").attr("r", 3).attr("cx", 4).attr("cy", 4).style("fill", "#cd2514");

group = svg.append("g").attr("width", "100%").attr("height", "100%");

continents = void 0;

d3.json("data/continent-geogame-110m.json", function(error, world) {
    console.log('ok');
    var africa, asia, continent, continentBBox, countries, europe, focus, isFocusedOnContinent, isFocusedOnCountry, na, previousTransformation, sa, scaleFactor, worldmapBBox, worldmapBBoxOffsetX, worldmapBBoxOffsetY, _i, _len;
    countries = topojson.feature(world, world.objects.countries).features;
    asia = {
        type: "FeatureCollection",
        name: "Asia",
        id: 1,
        features: countries.filter(function(d) {
            return d.properties.continent === "Asia";
        })
    };
    africa = {
        type: "FeatureCollection",
        name: "Africa",
        id: 2,
        features: countries.filter(function(d) {
            return d.properties.continent === "Africa";
        })
    };
    europe = {
        type: "FeatureCollection",
        name: "Europe",
        id: 3,
        features: countries.filter(function(d) {
            return d.properties.continent === "Europe";
        })
    };
    na = {
        type: "FeatureCollection",
        name: "North America",
        id: 4,
        features: countries.filter(function(d) {
            return d.properties.continent === "North America";
        })
    };
    sa = {
        type: "FeatureCollection",
        name: "South America",
        id: 5,
        features: countries.filter(function(d) {
            return d.properties.continent === "South America";
        })
    };
    continents = [asia, africa, europe, na, sa];
    isFocusedOnContinent = false;
    isFocusedOnCountry = false;
    previousTransformation = null;
    scaleFactor = null;
    worldmapBBox = null;
    worldmapBBoxOffsetX = null;
    worldmapBBoxOffsetY = null;
    focus = function(clickedCountry) {
        var continent, translateX, translateY;
        if ((clickedCountry == null) && !isFocusedOnCountry) {
            isFocusedOnContinent = false;
            return group.selectAll(".continent").transition().duration(200).attr("transform", "").each("end", function() {
                return group.selectAll(".continent").attr("class", function(d) {
                    var classColor;
                    if (d.id % 2 === 0) {
                        classColor = " negatif";
                    } else {
                        classColor = " positif";
                    }
                    return 'continent' + classColor;
                });
            });
        } else if (isFocusedOnContinent) {
            if (!isFocusedOnCountry) {
                isFocusedOnCountry = true;
                group.selectAll(".country").filter(function(d) {
                    if (d !== clickedCountry) {
                        return d;
                    }
                }).attr("class", "country faded");
                previousTransformation = group.select(".continent.focused").attr("transform");
                group.selectAll(".continent").transition().duration(300).ease("linear").attr("transform", "");
                return group.selectAll(".country").filter(function(d) {
                    if (d === clickedCountry) {
                        return d;
                    }
                }).attr("class", function(d) {
                    var classColor;
                    if (d.id % 2 === 0) {
                        classColor = " negatif";
                    } else {
                        classColor = " positif";
                    }
                    return 'country focused' + classColor;
                }).transition().duration(600).attr("transform", function() {
                    var bbox, miniCountryOffsetX, miniCountryOffsetY, miniCountryScale, targetSize;
                    bbox = this.getBBox();
                    targetSize = 100;
                    miniCountryScale = Math.min(targetSize / bbox.width, targetSize / bbox.height);
                    miniCountryOffsetX = -bbox.x * miniCountryScale - worldmapBBoxOffsetX + topMargin * 0.5 + 0.5 * (targetSize - bbox.width * miniCountryScale);
                    miniCountryOffsetY = -bbox.y * miniCountryScale - worldmapBBoxOffsetY + topMargin * 2 + 0.5 * (targetSize - bbox.height * miniCountryScale);
                    return "translate(" + miniCountryOffsetX + "," + miniCountryOffsetY + ") scale(" + miniCountryScale + ")";
                }).each("end", function() {
                    document.getElementById("country-details").className = "";
                    $scope.$parent.country = clickedCountry.properties.name;
                    $scope.$parent.svgMan = "images/man.svg";
                    $scope.$parent.occupationRate = Math.round(100 * Math.random(), 1);
                    $timeout(function() {
                        d3.select('#man .fill-level').style("fill", dbUtils.colorScale(1 - ($scope.$parent.occupationRate + 10) / 100)).transition().duration(800).attr("y", 11 * (100 - $scope.$parent.occupationRate)).attr("height", 11 * $scope.$parent.occupationRate);
                        return d3.select(".indicator").style("color", dbUtils.colorScale(1 - ($scope.$parent.occupationRate + 10) / 100)).select(".value").transition().duration(800).tween("text", function() {
                            var i;
                            i = d3.interpolate(this.textContent, $scope.$parent.occupationRate);
                            return function(t) {
                                return this.textContent = Math.round(i(t));
                            };
                        });
                    }, 400);
                    if (!$scope.$$phase) {
                        return $scope.$apply();
                    }
                });
            } else if (clickedCountry != null) {
                document.getElementById("country-details").className = "faded";
                isFocusedOnCountry = false;
                group.selectAll(".country").attr("class", function(d) {
                    var classColor;
                    if (d.id % 2 === 0) {
                        classColor = " negatif";
                    } else {
                        classColor = " positif";
                    }
                    return 'country' + classColor;
                });
                group.selectAll(".country").filter(function(d) {
                    if (d === clickedCountry) {
                        return d;
                    }
                }).transition().attr("transform", "");
                return group.select(".continent.focused").transition().delay(50).duration(200).attr("transform", previousTransformation);
            }
        } else {
            translateX = null;
            translateY = null;
            isFocusedOnContinent = true;
            continent = clickedCountry.properties.continent;
            group.selectAll(".continent").filter(function(d) {
                if (d.name !== continent) {
                    return d;
                }
            }).attr("class", function() {
                return this.className.animVal + " unfocused";
            });
            return group.selectAll(".continent").filter(function(d) {
                if (d.name === continent) {
                    return d;
                }
            }).attr("class", "continent focused").transition().duration(400).attr("transform", function() {
                var bbox;
                bbox = this.getBBox();
                scaleFactor = Math.min(width * 0.7 / bbox.width, height * 0.7 / (bbox.height + topMargin));
                translateX = worldmapBBox.width / 2 - scaleFactor * (bbox.x + bbox.width / 2);
                translateY = worldmapBBox.height / 2 - scaleFactor * (bbox.y + bbox.height / 2);
                return "translate(" + translateX + "," + translateY + ") scale(" + scaleFactor + ")";
            });
        }
    };
    group.selectAll(".continent").data(continents).enter().call(function() {
        return this.append("g").attr('class', function(d) {
            var classColor;
            if (d.id % 2 === 0) {
                classColor = " negatif";
            } else {
                classColor = " positif";
            }
            return 'continent ' + d.name.replace(' ', '') + classColor;
        }).selectAll(".country").data(function(d) {
            return d.features;
        }).enter().insert("path").attr("class", function(d) {
            var classColor;
            if (d.id % 2 === 0) {
                classColor = " negatif";
            } else {
                classColor = " positif";
            }
            return "country" + classColor;
        }).attr("d", path).attr("id", function(d) {
            return d.id;
        }).attr("title", function(d) {
            return d.name;
        }).on("click", function(d) {
            focus(d);
            d3.event.stopPropagation();
        });
    });
    for (_i = 0, _len = continents.length; _i < _len; _i++) {
        continent = continents[_i];
        continentBBox = null;
        group.selectAll(".continent").filter(function(d) {
            if (d.name === continent.name) {
                continentBBox = this.getBBox();
                return d;
            }
        }).append("text").attr("class", "continent-name").text(function(d) {
            return d.name;
        }).attr("transform", function() {
            var textOffsetX, textOffsetY;
            textOffsetX = continentBBox.x + continentBBox.width / 2;
            textOffsetY = continentBBox.y + continentBBox.height / 2;
            return "translate(" + textOffsetX + "," + textOffsetY + ")";
        });
    }
    d3.select("body").on("click", function() {
        focus();
        d3.event.stopPropagation();
    });
    return group.attr("transform", function() {
        var mapScaleFactor;
        worldmapBBox = this.getBBox();
        mapScaleFactor = 1;
        worldmapBBoxOffsetX = 0.5 * (width - worldmapBBox.width * mapScaleFactor - worldmapBBox.x);
        worldmapBBoxOffsetY = Math.max(0.5 * (height - worldmapBBox.height * mapScaleFactor), topMargin * 2);
        return "translate(" + worldmapBBoxOffsetX + "," + worldmapBBoxOffsetY + ")";
    });
});
