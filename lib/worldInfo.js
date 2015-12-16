var cldr = require('cldr');

function extractWorldInfo () {
    // Extract data
    var territoryInfoByTerritoryId = cldr.extractTerritories();
    var territoryContainmentGroups = cldr.extractTerritoryContainmentGroups();

    // Build convenience arrays
    var numericTerritoryIdByAlpha2Code = {};
    Object.keys(territoryInfoByTerritoryId).forEach(function (type) {
        var numericCode = territoryInfoByTerritoryId[type].numericCode;

        if (numericCode) {
            numericTerritoryIdByAlpha2Code[type] = numericCode;
        }
    });

    var containedTerritoriesByNumericTerritoryId = {};
    var containedTerritoriesByAlpha2TerritoryId = {};

    var parentRegionIdByTerritoryId = {};
    var numericRegionIdByTerritoryId = {};
    var alpha2CodeByNumericTerritoryId = {};

    // Process territory containment data, get knowledge about territories
    Object.keys(territoryContainmentGroups).forEach(function (type) {
        var group = territoryContainmentGroups[type];

        if (type in territoryInfoByTerritoryId) {
            territoryInfoByTerritoryId[type].isSubdivided = true;
        }

        if (/^\d+$/.test(type) && !(type in alpha2CodeByNumericTerritoryId)) {
            alpha2CodeByNumericTerritoryId[type] = null;
        }

        group.contains.forEach(function (id) {
            var numeric;
            if (/^\d+$/.test(id)) {
                numeric = id;
                if (!(id in alpha2CodeByNumericTerritoryId)) {
                    alpha2CodeByNumericTerritoryId[id] = null;
                }
            } else {
                if (id in numericTerritoryIdByAlpha2Code) {
                    numeric = numericTerritoryIdByAlpha2Code[id];
                    alpha2CodeByNumericTerritoryId[numeric] = id;
                }

                containedTerritoriesByAlpha2TerritoryId[id] = true
            }

            if (numeric !== undefined && /^\d+$/.test(type)) {
                if (!(numeric in parentRegionIdByTerritoryId)) {
                    parentRegionIdByTerritoryId[numeric] = type;
                }

                if (/^[A-Z]+$/.test(id) && !(id in numericRegionIdByTerritoryId)) {
                    numericRegionIdByTerritoryId[id] = type;
                }
            }
        });
    });

    // Remove historical regions, exceptional reservations, and other unused codes.
    Object.keys(territoryInfoByTerritoryId).forEach(function (territoryId) {
        var numeric;
        if (territoryId in numericTerritoryIdByAlpha2Code) {
            numeric = numericTerritoryIdByAlpha2Code[territoryId];
        }

        if (!containedTerritoriesByAlpha2TerritoryId[territoryId]) {
            delete numericRegionIdByTerritoryId[territoryId];
            delete territoryInfoByTerritoryId[territoryId];
        }
    });

    return {
        alpha2CodeByNumericTerritoryId: alpha2CodeByNumericTerritoryId,
        territoryInfoByTerritoryId: territoryInfoByTerritoryId,
        parentRegionIdByTerritoryId: parentRegionIdByTerritoryId,
        numericRegionIdByTerritoryId: numericRegionIdByTerritoryId
    };
}

module.exports = extractWorldInfo();
