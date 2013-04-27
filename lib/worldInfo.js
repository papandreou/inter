var Path = require('path'),
    fs = require('fs'),
    leftPad = require('./leftPad'),
    countryInfos = JSON.parse(fs.readFileSync(Path.resolve(__dirname, '../worldInfo/countries.json'))),
    worldInfo = module.exports = {
        countryInfosByTerritoryId: {},
        numericRegionIdByNumericTerritoryId: {},
        numericRegionIdByTerritoryId: {},
        alpha2CodeByNumericTerritoryId: {}
    };

countryInfos.forEach(function (countryInfo) {
    worldInfo.alpha2CodeByNumericTerritoryId[countryInfo.numericCode] = countryInfo.alpha2Code;
    if (countryInfo.alpha2Code) {
        (worldInfo.countryInfosByTerritoryId[countryInfo.alpha2Code] = worldInfo.countryInfosByTerritoryId[countryInfo.alpha2Code] || []).push(countryInfo);
    }
});

(function traverseRegions(region, parentId) {
    var id = leftPad(region.id, 3, '0');
    if (parentId) {
        worldInfo.numericRegionIdByNumericTerritoryId[id] = parentId;
        worldInfo.numericRegionIdByTerritoryId[worldInfo.alpha2CodeByNumericTerritoryId[id]] = parentId;
    }
    if (region.children) {
        region.children.forEach(function (child) {
            traverseRegions(child, id);
        });
    }
}(JSON.parse(fs.readFileSync(Path.resolve(__dirname, '../worldInfo/regions.json')))));
