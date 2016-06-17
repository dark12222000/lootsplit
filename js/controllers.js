angular.module('lootsplit')
.controller('AppController', function AppController(NavService){
  this.routes = NavService.routes;
  this.NavService = NavService;

  NavService.findActiveLink();
})
.controller('CharactersController', function($scope, LootService){
  $scope.activeCharacter = {name: '', player: '', notes: '', loot:[]};
  $scope.editing = false;

  LootService.updateLootTotal();

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
.controller('LootController', function($scope, LootService, coinsFilter, CashService){
  $scope.activeLootItem = {base: null, name: '', details: '', notes: '', value: 0, coins: {}, quantity: 1, id: null};
  $scope.$watch('activeLootItem.coins', function(){
    $scope.activeLootItem.value = CashService.coinsToDecimal($scope.activeLootItem.coins);
  }, true);
  $scope.$watch('activeLootItem.value', function(){
    $scope.activeLootItem.coins = CashService.decimalToCoins($scope.activeLootItem.value);
  });
  $scope.editing = false;

  LootService.updateLootTotal();

  $scope.canSubmit = function(){
    if($scope.activeLootItem.value === 0){
      $scope.lootForm.hasNoValue = true;
      return false;
    }
    return true;
  };

  $scope.lootItemFormSubmit = function(e){
    if($scope.editing) return $scope.updateLootItem();
    return $scope.addLootItem();
  };

  $scope.selectLootItem = function(id){
    $scope.activeLootItem = LootService.getLootItem(id);
    if(!$scope.activeLootItem.coins) $scope.activeLootItem.coins = CashService.decimalToCoins($scope.activeLootItem.value);
    $scope.editing = true;
  };

  $scope.addLootItem = function(){
    var total = $scope.activeLootItem.quantity;
    for(var i = 0; i < total; i++){
      var newItem = _.clone($scope.activeLootItem);
      newItem.quantity = 1;
      if(newItem.coins) newItem.value = CashService.coinsToDecimal(newItem.coins);
      newItem.id = _.uniqueId(_.snakeCase(newItem.name));
      $scope.loot.push(newItem);
    }
    resetActiveLootItem();
  };

  $scope.updateLootItem = function(){
    resetActiveLootItem();
  };

  function resetActiveLootItem(){
    $scope.lootForm.$setPristine();
    $scope.lootForm.$setUntouched();
    $scope.lootForm.hasNoValue = false;
    $scope.activeLootItem = {base: null, name: '', details: '', notes: '', value: 0, coins: {}, quantity: 1, id: null};
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
  $scope.LootService = LootService;
  $scope.LootService.updateLootTotal();

  $scope.debug = function(){
    console.log(LootService);
  };

  $scope.$on('loot.drop-model', function(){
    LootService.updateLootTotal();
  });

  $scope.autoSplit = function(){
    var chars = _.shuffle(Object.keys(LootService.characters));
    var slices = chars.length;
    var total = LootService.sumLootPile() + LootService.sumAllCharacters();
    var perChar = total/slices;

    LootService.lootPile = _.orderBy(LootService.lootPile, ['value'], ['asc']);
    LootService.updateCharacterTotals();

    while(LootService.lootPile.length > 0){
      for(var i = 0; i < chars.length; i++){
        var slug = chars[i];
        if( ( LootService.characterTotals[slug] < perChar ) && LootService.lootPile.length > 0){
          //distribute loot
          var item = LootService.lootPile.pop();
          if(!$scope.$parent.$$phase) $scope.$parent.apply();
          LootService.characters[slug].loot.push(item);
          LootService.updateCharacterTotals();
        }
      }
    }

    LootService.updateLootTotal();
  };

})
.controller('ShareController', function($scope, LootService){
  $scope.LootService = LootService;

  $scope.characters = null;
  $scope.lootPile = null;

  $scope.prepareExport = function(){
    $scope.characters = _.cloneDeep(LootService.characters);
    $scope.lootPile = LootService.clumpInventory(_.cloneDeep(LootService.lootPile));

    _.forEach($scope.characters, function(char){
      char.loot = LootService.clumpInventory(char.loot);
    });
  };

  $scope.print = function(){
    $scope.prepareExport();
    window.print();
  };

  $scope.exportToCSV = function(){
    $scope.prepareExport();
  };

  $scope.exportToJSON = function(){
    $scope.prepareExport();
  };

  $scope.prepareExport();

});
