angular.module('lootsplit')
.controller('AppController', function AppController(NavService, $scope){
  this.routes = NavService.routes;
  this.NavService = NavService;

  NavService.findActiveLink();
  $scope.$on('$viewContentLoaded', function(){
    $('[data-toggle="tooltip"]').tooltip();
  });
})
.controller('CharactersController', function($scope, LootService){
  $scope.activeCharacter = {name: '', player: '', notes: '', loot:[], lootCoins: 0};
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
    $scope.characterForm.$setPristine();
    $scope.characterForm.$setUntouched();
    $scope.activeCharacter = {name: '', player: '', notes: '', loot:[], lootCoins: 0};
    $scope.editing = false;
  }

  $scope.removeCharacter = function(){
    LootService.removeCharacter($scope.activeCharacter.name);
    resetActiveCharacter();
  };
  $scope.characters = LootService.characters;
})
.controller('LootController', function($scope, LootService, coinsFilter, CashService){
  $scope.LootService = LootService;
  $scope.activeLootItem = {base: null, name: '', details: '', notes: '', value: 0, coins: {}, quantity: 1, id: null};
  $scope.$watch('activeLootItem.coins', function(){
    $scope.activeLootItem.value = CashService.coinsToDecimal($scope.activeLootItem.coins);
  }, true);
  $scope.$watch('activeLootItem.value', function(){
    $scope.activeLootItem.coins = CashService.decimalToCoins($scope.activeLootItem.value);
  });

  $scope.rawLootCoins = {cp: 0, sp: 0, gp: 0};
  if($scope.LootService.lootCoins !== 0){
    $scope.rawLootCoins = CashService.decimalToCoins($scope.LootService.lootCoins);
  }
  $scope.$watch('rawLootCoins', function(){
    $scope.LootService.lootCoins = CashService.coinsToDecimal($scope.rawLootCoins);
    $scope.LootService.updateLootTotal();
  }, true);
  $scope.$watch('LootService.lootCoins', function(){
    $scope.rawLootCoins = CashService.decimalToCoins($scope.LootService.lootCoins);
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
      newItem.id = _.uniqueId(_.snakeCase(newItem.name)) + '_' + _.random(0, 100);
      $scope.LootService.lootPile.push(newItem);
    }
    resetActiveLootItem();
  };

  $scope.updateLootItem = function(){
    if($scope.activeLootItem.quantity > 1){
      var ref = $scope.activeLootItem;
      $scope.removeLootItem();
      $scope.activeLootItem = ref;
      $scope.activeLootItem.id += '_2';
      $scope.addLootItem();
    }
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
})
.controller('SplitController', function($scope, LootService, dragulaService, coinsFilter){
  $scope.LootService = LootService;
  $scope.LootService.updateLootTotal();

  $scope.helpVisible = false;

  $scope.debug = function(){
    console.log(LootService);
  };

  $scope.$on('loot.drop-model', function(){
    LootService.updateLootTotal();
  });

  $scope.showHelp = function(){
    if(!$scope.helpVisible){
      $scope.helpVisible = true;
      $('[data-toggle="tooltip"]').tooltip('show');
    }else{
      $scope.helpVisible = false;
      $('[data-toggle="tooltip"]').tooltip('hide');
    }
  };

  $scope.autoSplit = function(){
    var chars = _.shuffle(Object.keys(LootService.characters));
    var slices = chars.length;
    var total = LootService.sumLootPile() + LootService.sumAllCharacters();
    var perChar = total/slices;

    LootService.lootPile = _.orderBy(LootService.lootPile, ['value'], ['asc']);
    LootService.updateCharacterTotals();
    var infBreak = 0;
    while(LootService.lootPile.length > 0 || LootService.lootCoins > 0){
      infBreak++;
      if( _.isNaN(LootService.lootPile) || _.isNaN(LootService.lootCoins) ) break;
      if(infBreak > 10) break;
      for(var i = 0; i < chars.length; i++){
        var slug = chars[i];
        if( ( LootService.characterTotals[slug] < perChar ) && LootService.lootPile.length > 0){
          //distribute loot
          var item = LootService.lootPile.pop();
          if(!$scope.$parent.$$phase) $scope.$parent.apply();
          LootService.characters[slug].loot.push(item);
        }else{
          //figure out how close we can get
          var amount = perChar - LootService.characterTotals[slug];
          if(amount > LootService.lootCoins){
            amount = LootService.lootCoins;
          }
          LootService.transferCoinsFromStash(amount, slug);
        }
        LootService.updateCharacterTotals();
      }
    }

    LootService.updateLootTotal();
  };

})
.controller('ShareController', function($scope, LootService){
  $scope.LootService = LootService;
  LootService.updateLootTotal();

  $scope.characters = null;
  $scope.lootPile = null;

  $scope.sepPages = true;
  $scope.indexPage = true;
  $scope.charPages = true;

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
