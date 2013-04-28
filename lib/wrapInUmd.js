var path = require('path');

function getRelativeModulePath(sourceModuleName, targetModuleName) {
    var relativePath = path.relative(sourceModuleName.replace(/\/[^\/]+$/, '/'), targetModuleName);
    if (relativePath === '' || /\/$/.test(relativePath)) {
        relativePath += sourceModuleName.replace(/^.*\//, '');
    }
    if (!/^\.\.?\//.test(relativePath)) {
        relativePath = './' + relativePath;
    }
    return relativePath;
}

module.exports = function wrapInUmd(moduleName, factoryAst, dependencies) {
    var moduleNameFragments = moduleName.split('/'),
        defineArgAsts = [['name', 'factory']],
        commonJsRequireArgAsts = [];

    if (Array.isArray(dependencies)) {
        defineArgAsts.unshift(['array', dependencies.map(function (dependency) {
            return ['string', dependency];
        })]);
        dependencies.forEach(function (dependency) {
            commonJsRequireArgAsts.push(['string', getRelativeModulePath(moduleName, dependency)]);
        });
    }

    var fallbackBlock = ['block', []],
        dotAst = ['name', 'root'];
    for (var i = 0 ; i < moduleNameFragments.length ; i += 1) {
        dotAst = ['dot', dotAst, moduleNameFragments[i]];
        fallbackBlock[1].push(
            [
                'assign',
                true,
                dotAst,
                i === moduleNameFragments.length - 1 ?
                    [ 'call', [ 'name', 'factory' ], dependencies.map(function (dependency) {
                        var dependencyDotAst = ['name', 'root'];
                        dependency.split('/').forEach(function (dependencyFragment) {
                            dependencyDotAst = ['dot', dependencyDotAst, dependencyFragment];
                        });
                        return dependencyDotAst;
                    }) ] :
                    [ 'binary', '||', dotAst, [ 'object', [] ] ]
            ]
        );
    }

    return (
        [ 'toplevel',
          [ [ 'stat',
              [ 'call',
                [ 'function',
                  null,
                  [ 'root', 'factory' ],
                  [ [ 'stat',
                      [ 'conditional',
                        [ 'binary',
                          '!=',
                          [ 'unary-prefix', 'typeof', [ 'name', 'module' ] ],
                          [ 'string', 'undefined' ] ],
                        [ 'assign',
                          true,
                          [ 'dot', [ 'name', 'module' ], 'exports' ],
                          [ 'call', [ 'name', 'factory' ], commonJsRequireArgAsts ] ],
                        [ 'conditional',
                          [ 'binary',
                            '&&',
                            [ 'binary',
                              '==',
                              [ 'unary-prefix',
                                'typeof',
                                [ 'dot', [ 'name', 'root' ], 'define' ] ],
                              [ 'string', 'function' ] ],
                            [ 'dot', [ 'name', 'define' ], 'amd' ] ],
                          [ 'call', [ 'name', 'define' ], defineArgAsts ],
                          fallbackBlock
                          ] ] ] ] ],
                [ [ 'name', 'this' ], factoryAst ] ] ] ] ]
    );
};
