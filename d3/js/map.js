//Some variables use for the map's position
var
    defaultWidth = 960,
    defaultHeight = 500,
    topMargin = 75,// If you want to show some elements at the top of your page
    width = window.innerWidth,
    mapScaleFactor = Math.min(width/defaultWidth,window.innerHeight/defaultHeight),
    height = window.innerHeight - topMargin;

//They are many projections possibilities as you can see from here: https://github.com/d3/d3-geo-projection/
var projection = d3.geo.eckert3().scale(180);
var path = d3.geo.path().projection(projection);

//We add the svg to the html
var svg = d3.select("#container").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class","worldmap");

//We add a group where we'll put our continents and countries in
var group = svg.append("g")
    .attr("width", "100%")
    .attr("height", "100%")

//You can use this function to add your own css classes
function getClassFromNode(d) {
    if (d.id > 5) {
        return " negatif";
    }
    return " positif";
}

//We have modified the original continent-geogame-110m.json file to make zooms more easier, so some countries won't show up with all theirs parts
// like French Guiana for France.
d3.json("data/continent-geogame-110m-countrieszoom.json", function(error, world) {
    // See here to get more info about the following line: https://github.com/mbostock/topojson
    var countries = topojson.feature(world, world.objects.countries);
    //We group the countries in contients (We removed Antartica and we put ocenania with Asia)
    var asia = {type: "FeatureCollection", name: "Asia", id:1, features: countries.features.filter(function(d) { return d.properties.continent=="Asia"; })};
    var africa = {type: "FeatureCollection", name: "Africa", id:2, features: countries.features.filter(function(d) { return d.properties.continent=="Africa"; })};
    var europe = {type: "FeatureCollection", name: "Europe", id:3, features: countries.features.filter(function(d) { return d.properties.continent=="Europe"; })};
    var na = {type: "FeatureCollection", name: "North America", id:4, features: countries.features.filter(function(d) { return d.properties.continent=="North America"; })};
    var sa = {type: "FeatureCollection", name: "South America", id:5, features: countries.features.filter(function(d) { return d.properties.continent=="South America"; })};

    var continents = [asia,africa,europe,na,sa];
    var focus, isFocusedOnContinent, isFocusedOnCountry, previousTransformation, scaleFactor, worldmapBBox, worldmapBBoxOffsetX, worldmapBBoxOffsetY,selectedCountrycontinent,translateX, translateY;;
    //There is 3 levels of zoom = "world, continent and country"
    isFocusedOnContinent = false;
    isFocusedOnCountry = false;

    focus = function(clickedCountry) {

        //zoom continent => zoom world
        if ((clickedCountry == null) && !isFocusedOnCountry && isFocusedOnContinent) {
            isFocusedOnContinent = false;
            group.selectAll(".continent").transition().duration(200).attr("transform", "").each("end", function() {
                group.selectAll(".continent").attr("class", function(d) {
                    return 'continent' + getClassFromNode(d);
                });
            });
        } else if (isFocusedOnContinent) {
            //Zoom continent => zoom country
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
                    return 'country focused' + getClassFromNode(d);
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
                    document.getElementById("country-name").textContent = clickedCountry.properties.name;
                });
            } else {
                //Zoom country => zoom continent
                document.getElementById("country-details").className = "faded";
                isFocusedOnCountry = false;
                group.selectAll(".country").attr("class", function(d) {
                    return 'country' + getClassFromNode(d);
                });
                group.selectAll(".country").filter(function(d) {
                    if (d === selectedCountry) {
                        return d;
                    }
                }).transition().attr("transform", "");
                group.select(".continent.focused").transition().delay(50).duration(200).attr("transform", previousTransformation);
            }
        //Zoom world => zoom continent
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
                var bbox, scaleFactor;
                bbox = this.getBBox();
                scaleFactor = Math.min(width * 0.7 / bbox.width, height * 0.7 / (bbox.height + topMargin));
                translateX = worldmapBBox.width / 2 - scaleFactor * (bbox.x + bbox.width / 2);
                translateY = worldmapBBox.height / 2 - scaleFactor * (bbox.y + bbox.height / 2);
                return "translate(" + translateX + "," + translateY + ") scale(" + scaleFactor + ")";
            });
            group.selectAll(".country").attr("class", function(d) {
                return 'country' + getClassFromNode(d);
            });
        }
    };

    //We draw the continents
    group.selectAll(".continent").data(continents).enter().call(function() {
        return this.append("g").attr('class', function(d) {
            return 'continent ' + d.name.replace(' ', '') + getClassFromNode(d);
        }).selectAll(".country").data(function(d) {
            return d.features;
        }).enter().insert("path").attr("class", function(d) {
            return "country" + getClassFromNode(d);
        }).attr("d", path).attr("id", function(d) {
            return d.id;
        }).attr("title", function(d) {
            return d.name;
        }).on("click", function(d) {
            focus(d);
            d3.event.stopPropagation();
        });
    });


    //We here draw some attributes of continents, here we simply display the name
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

    //We catch the click
    d3.select("body").on("click", function() {
        focus();
        d3.event.stopPropagation();
    });

    //We scale the map to a reasonnable size dynamically from the width of the heigth of the window
    group.attr("transform", function() {
        worldmapBBox = this.getBBox();
        worldmapBBoxOffsetX = 0.5 * (width - worldmapBBox.width * mapScaleFactor - worldmapBBox.x);
        worldmapBBoxOffsetY = Math.max(0.5 * (height - worldmapBBox.height * mapScaleFactor), topMargin * 2);
        return "translate(" + worldmapBBoxOffsetX + "," + worldmapBBoxOffsetY + ") scale(" + mapScaleFactor + ")";
    });
});