// Some variables use for the map's position
var
    // defaultWidth = 960,
    // defaultHeight = 400,
    width = document.getElementById("map-container").clientWidth,
    height = document.getElementById("map-container").clientHeight;

// They are many projections possibilities as you can see from here: https:// github.com/d3/d3-geo-projection/
var projection = d3.geo.naturalEarth().scale(180);
var path = d3.geo.path().projection(projection);

// We add the svg to the html
var svg = d3.select("#map-container").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("class","worldmap");

// We add a group where we'll put our continents and countries in
var group = svg.append("g")
    .attr("width", width)
    .attr("height", height)

var countriesValues, mostVisited;
// We get the values we use to color our map
d3.json("data/dataTheodoTravels.json", function(error, data){
    countriesValues = data;
    mostVisited = 0;
    for (var country in countriesValues) {
        current = parseInt(countriesValues[country])
        if (mostVisited < current) {
            mostVisited = current;
        }
    }
});

// We have modified the original continent-geogame-110m.json file to make zooms more easier, so some countries won't show up with all theirs parts
// like French Guiana for France.
d3.json("data/continent-geogame-110m-countrieszoom.json", function(error, world) {
    // See here to get more info about the following line: https:// github.com/mbostock/topojson
    var countries = topojson.feature(world, world.objects.countries);
    // We group the countries in contients (We removed Antarctica and we put oceania with Asia)
    var asia = {type: "FeatureCollection", name: "Asia", id:1, features: countries.features.filter(function(d) { return d.properties.continent == "Asia"; })};
    var africa = {type: "FeatureCollection", name: "Africa", id:2, features: countries.features.filter(function(d) { return d.properties.continent == "Africa"; })};
    var europe = {type: "FeatureCollection", name: "Europe", id:3, features: countries.features.filter(function(d) { return d.properties.continent == "Europe"; })};
    var na = {type: "FeatureCollection", name: "North America", id:4, features: countries.features.filter(function(d) { return d.properties.continent == "North America"; })};
    var sa = {type: "FeatureCollection", name: "South America", id:5, features: countries.features.filter(function(d) { return d.properties.continent == "South America"; })};

    var continents = [asia,africa,europe,na,sa];
    var focus, isFocusedOnContinent, isFocusedOnCountry, previousTransformation, worldmapBBox, worldmapBBoxOffsetX, worldmapBBoxOffsetY, translateX, translateY;
    // There are 3 levels of zoom: "world, continent and country"
    isFocusedOnContinent = false;
    isFocusedOnCountry = false;

    focus = function(clickedCountry) {

        // zoom continent => zoom world
        if ((clickedCountry == null) && !isFocusedOnCountry && isFocusedOnContinent) {
            isFocusedOnContinent = false;
            group.selectAll(".continent").transition().duration(200).attr("transform", "").each("end", function() {
                group.selectAll(".continent").attr("class", function(d) {
                    return 'continent';
                });
            });
        } else if (isFocusedOnContinent) {
            // Zoom continent => zoom country
            if (!isFocusedOnCountry) {
                isFocusedOnCountry = true;
                selectedCountry = clickedCountry;
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
                    return 'country focused';
                }).transition().duration(600).attr("transform", function() {
                    var bBox, miniCountryOffsetX, miniCountryOffsetY, miniCountryScale, targetSize;
                    bBox = this.getBBox();
                    targetSize = 100;
                    miniCountryScale = Math.min(targetSize / bBox.width, targetSize / bBox.height);
                    miniCountryOffsetX = -bBox.x * miniCountryScale - worldmapBBoxOffsetX + 0.5 * (targetSize - bBox.width * miniCountryScale);
                    miniCountryOffsetY = -bBox.y * miniCountryScale - worldmapBBoxOffsetY + 0.5 * (targetSize - bBox.height * miniCountryScale);
                    return "translate(" + miniCountryOffsetX + "," + miniCountryOffsetY + ") scale(" + miniCountryScale + ")";
                }).each("end", function() {
                    document.getElementById("country-details").className = "";
                    document.getElementById("country-name").textContent = clickedCountry.properties.name;
                });
            } else {
                // Zoom country => zoom continent
                document.getElementById("country-details").className = "faded";
                isFocusedOnCountry = false;
                group.selectAll(".country").attr("class", function(d) {
                    return 'country';
                });
                group.selectAll(".country").filter(function(d) {
                    if (d === selectedCountry) {
                        return d;
                    }
                }).transition().attr("transform", "");
                group.select(".continent.focused").transition().delay(50).duration(200).attr("transform", previousTransformation);
            }
        // Zoom world => zoom continent
        } else if(!(clickedCountry == null)) {
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
            group.selectAll(".continent").filter(function(d) {
                if (d.name === continent) {
                    return d;
                }
            }).attr("class", "continent focused").transition().duration(400).attr("transform", function() {
                var bBox, scaleFactor;
                console.log("zoom");
                bBox = this.getBBox();
                scaleFactor = Math.min(width / bBox.width, height / bBox.height);
                translateX = width / 2 - scaleFactor * (bBox.x + bBox.width / 2);
                translateY = height / 2 - scaleFactor * (bBox.y + bBox.height / 2);
                console.log("continent : " + bBox.width + " " + bBox.height + " " + bBox.x);
                console.log("map : " + width + " " + height + " " + translateX);
                console.log("scaleFactor : " + scaleFactor);
                return "translate(" + translateX + "," + translateY + ") scale(" + scaleFactor + ")";
            });
            group.selectAll(".country").attr("class", function(d) {
                return 'country';
            });
        }
    };

    baseValue = 69;
    remainder = 255 - baseValue;

    // We draw the continents
    group.selectAll(".continent").data(continents).enter().call(function() {
        return this.append("g").attr('class', function(d) {
            return 'continent ' + d.name.replace(' ', '');
        }).selectAll(".country").data(function(d) {
            return d.features;
        }).enter().insert("path").attr("class", function(d) {
            return "country";
        }).attr("fill", function(d) {
            var value = Math.round(remainder  * countriesValues[d.properties.name]/mostVisited);
            var red = 69;
            var green = 69;
            var blue = baseValue + value;
            return "rgb(" + red + ", " + green + ", " + blue + ")";
        }).attr("d", path).attr("id", function(d) {
            return d.id;
        }).on("click", function(d) {
            focus(d);
            d3.event.stopPropagation();
        });
    });


    // We here draw some attributes of continents, here we simply display the name
    var continent, continentBBox, _i, _len;
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

    // We catch the click
    d3.select("body").on("click", function() {
        focus();
        d3.event.stopPropagation();
    });

    // We scale the map to a reasonnable size dynamically from the width of the heigth of the window
    group.attr("transform", function() {
        worldmapBBox = this.getBBox();
        console.log("bbox: " + worldmapBBox.width + " " + worldmapBBox.height);
        console.log("container: " + width + " " + height);
        var scaleFactor = Math.min(height/worldmapBBox.height, width/worldmapBBox.width);
        console.log(scaleFactor);
        worldmapBBoxOffsetX = 0.5 * (width - worldmapBBox.width * scaleFactor - worldmapBBox.x);
        worldmapBBoxOffsetY = Math.max(0.5 * (height - worldmapBBox.height * scaleFactor), 0);
        return "translate(" + worldmapBBoxOffsetX + "," + worldmapBBoxOffsetY + ") scale(" + scaleFactor + ")";
    });
});
