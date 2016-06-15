angular.module('lootsplit')
.controller('AppController', function AppController(NavService){
  this.routes = NavService.routes;
})
.controller('CharactersController', function($scope, LootService){
  $scope.activeCharacter = {name: '', player: '', notes: '', loot:[]};
  $scope.editing = false;

  $scope.characterFormSubmit = function(){
    if($scope.editing) return $scope.updateCharacter();
    return $scope.addCharacter();
  };

  $scope.selectCharacter = function(name){
    $scope.activeCharacter = LootService.getCharacter(name);
    $scope.editing = true;
  };

  $scope.addCharacter = function(){
    LootService.addCharacter($scope.activeCharacter);
    resetActiveCharacter();
  };

  $scope.updateCharacter = function(){
    resetActiveCharacter();
  };

  function resetActiveCharacter(){
    $scope.activeCharacter = {name: '', player: '', notes: '', loot:[]};
    $scope.editing = false;
  }

  $scope.removeCharacter = function(){
    LootService.removeCharacter($scope.activeCharacter.name);
    resetActiveCharacter();
  };
  $scope.characters = LootService.characters;
})
.controller('LootController', function($scope, LootService, coinsFilter){
  $scope.activeLootItem = {base: null, name: '', details: '', notes: '', value: 0, quantity: 1, id: null};
  $scope.editing = false;

  $scope.lootItemFormSubmit = function(){
    if($scope.editing) return $scope.updateLootItem();
    return $scope.addLootItem();
  };

  $scope.selectLootItem = function(id){
    $scope.activeLootItem = LootService.getLootItem(id);
    $scope.editing = true;
  };

  $scope.addLootItem = function(){
    var total = $scope.activeLootItem.quantity;
    for(var i = 0; i < total; i++){
      var newItem = _.clone($scope.activeLootItem);
      newItem.quantity = 1;
      newItem.id = _.uniqueId(_.snakeCase(newItem.name));
      $scope.loot.push(newItem);
    }
    resetActiveLootItem();
  };

  $scope.updateLootItem = function(){
    resetActiveLootItem();
  };

  function resetActiveLootItem(){
    $scope.activeLootItem = {base: null, name: '', details: '', notes: '', value: 0, quantity: 1, id: null};
    $scope.editing = false;
    LootService.updateLootTotal();
  }

  $scope.removeLootItem = function(){
    LootService.removeLootItem($scope.activeLootItem.id);
    resetActiveLootItem();
  };

  $scope.loot = LootService.lootPile;
  $scope.LootService = LootService;
})
.controller('SplitController', function($scope, LootService, dragulaService, coinsFilter){
  $scope.characters = LootService.characters;
  $scope.lootPile = LootService.lootPile;
  $scope.LootService = LootService;
  $scope.debug = function(){
    console.log(LootService);
  };
  $scope.$on('loot.drop-model', function(){
    LootService.updateLootTotal();
    LootService.updateCharacterTotals();
  });

  $scope.autoSplit = function(){
    var chars = _.shuffle(Object.keys(LootService.characters));
    var slices = chars.length;
    var total = LootService.sumLootPile() + LootService.sumAllCharacters();
    var perChar = total/slices;

    LootService.lootPile = _.orderBy(LootService.lootPile, ['value'], ['asc']);
    LootService.updateCharacterTotals();
    for(var i = 0; i < chars.length; i++){
      var slug = chars[i];
      while( ( LootService.characterTotals[slug] < perChar ) && LootService.lootPile.length > 0){
        //distribute loot
        var item = LootService.lootPile.pop();
        if(!$scope.$parent.$$phase) $scope.$parent.apply();
        LootService.characters[slug].loot.push(item);
        LootService.updateCharacterTotals();
      }
    }

    LootService.updateCharacterTotals();
    LootService.updateLootTotal();

  };

})
.controller('ShareController', function($scope){

});
