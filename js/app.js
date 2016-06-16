angular.module('lootsplit', ['ngRoute', angularDragula(angular)]).config(function($routeProvider, $locationProvider){
  $routeProvider
  .when('/characters', {
    templateUrl: 'templates/characters.html',
    controller: 'CharactersController'
  })
  .when('/loot', {
    templateUrl: 'templates/loot.html',
    controller: 'LootController'
  })
  .when('/split', {
    templateUrl: 'templates/split.html',
    controller: 'SplitController'
  })
  .when('/share', {
    templateUrl: 'templates/share.html',
    controller: 'ShareController'
  }).otherwise({
    redirectTo: '/characters'
  });

  // configure html5 to get links working on jsfiddle
  $locationProvider.html5Mode({enabled: false, requireBase: false});
}).filter('coins', function(){
  function decimalToCoins(total, options){
    var coins = {};
    total = Number(total);

    if(false){
      coins.pp = Math.floor(total/10);
      total = total - (coins.pp * 10);
    }

    coins.gp = Math.floor(total);
    total = total - coins.gp;

    coins.sp = Math.floor(total/0.1);
    total = total - (coins.sp * 0.1);

    coins.cp = Math.floor(total/0.01);
    total = total - (coins.cp * 0.01);

    return coins;
  }
  return function(input){
    var coins = decimalToCoins(input);
    var coinsStr = '';
    if(coins.pp) coinsStr += coins.pp + 'pp ';
    if(coins.gp) coinsStr += coins.gp + 'gp ';
    if(coins.sp) coinsStr += coins.sp + 'sp ';
    if(coins.cp) coinsStr += coins.cp + 'cp ';
    if(coinsStr.length < 1) coinsStr = '0';
    return coinsStr;
  };
});
