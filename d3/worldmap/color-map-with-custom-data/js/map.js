// Some variables use for the map's position
var
    container = document.getElementById("map-container"),
    width = container.clientWidth,
    height = container.clientHeight;

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
d3.json("data/dataTheodoTravels.json", function(error, data) {
    countriesValues = data;
    mostVisited = 0;
    for (var country in countriesValues) {
        current = parseInt(countriesValues[country])
        if (mostVisited < current) {
            mostVisited = current;
        }
    }
});

// We have modified the original continent-geogame-110m.json file to make zooms easier, so some countries won't show up with all their parts
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
    var worldScaleFactor, worldmapBBox, worldmapBBoxOffsetX, worldmapBBoxOffsetY;

    var worldDefaultTransformation = undefined;

    fitWorld = function() {
        if (worldDefaultTransformation == undefined) {
            group.attr("transform", function() {
                worldmapBBox = this.getBBox();
                worldScaleFactor = Math.min(height/worldmapBBox.height, width/worldmapBBox.width);
                worldmapBBoxOffsetX = 0.5 * width - worldScaleFactor * (worldmapBBox.x + 0.5 * worldmapBBox.width);
                worldmapBBoxOffsetY = 0.5 * height - worldScaleFactor * (worldmapBBox.y + 0.5 * worldmapBBox.height);
                worldDefaultTransformation = "translate(" + worldmapBBoxOffsetX + "," + worldmapBBoxOffsetY + ") scale(" + worldScaleFactor + ")";
                return worldDefaultTransformation;
            });
        } else {
            group.transition().attr("transform", worldDefaultTransformation);
        }

    };

    baseValue = 69;
    remainder = 255 - baseValue;

    //!!!!!
    // We draw the continents here
    //!!!!!
    group.selectAll(".continent").data(continents).enter().call(function() {
        return this.append("g").attr('class', function(d) {
            return 'continent ' + d.name.replace(' ', '');
        }).selectAll(".country").data(function(d) {
            return d.features;
        }).enter().insert("path").attr("class", "country")
        .attr("fill", function(d) {
            var value = Math.round(remainder * countriesValues[d.properties.name]/mostVisited);
            var red = 69;
            var green = 69;
            var blue = baseValue + value;
            return "rgb(" + red + ", " + green + ", " + blue + ")";
        }).attr("d", path).attr("id", function(d) {
            return d.id;
        });
    });

    // We here draw some attributes of continents, here we simply display the name
    var continent, continentBBox, i, len;
    for (i = 0, len = continents.length; i < len; i++) {
        continent = continents[i];
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
    // We scale the map to fit the #map-container div
    fitWorld();
});
