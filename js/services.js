angular.module('lootsplit')
.service('CashService', function(){
  /*
   * @input: Associative array of {cointype: amount} such as {gp: 10, sp: 50}
   * @output: Decimal equivalence
   */
  this.coinsToDecimal = function(coins){
    var total = 0;
    if(coins.cp) total += Number(coins.cp) * 0.01;
    if(coins.sp) total += Number(coins.sp) * 0.1;
    if(coins.ep) total += Number(coins.ep) * 0.5;
    if(coins.gp) total += Number(coins.gp);
    if(coins.pp) total += Number(coins.pp) * 10;
    return Number(total.toFixed(2));
  };

  /*
   * @input: Decimal up to two places
   * @output: Coin array
   */
  this.decimalToCoins = function(total, options){
    var coins = {};
    total = Number(total);

    // if(options.allowPP){
    //   coins.pp = Math.floor(total/10);
    //   total = total - (coins.pp * 10);
    // }

    coins.gp = Math.floor(total);
    total = total - coins.gp;

    // if(options.allowEP){
    //   coins.ep = Math.floor(total/0.5);
    //   total = total - (coins.ep * 0.5);
    // }

    coins.sp = Math.floor(total/0.1);
    total = total - (coins.sp * 0.1);

    coins.cp = Math.floor(total/0.01);
    total = total - (coins.cp * 0.01);

    return coins;
  };
})
.service('LootService', function($rootScope){
  var self = this;
  var debug = false;

  this.lootPile = [];
  this.lootCoins = 0;
  this.characters = {};

  if(debug){
    this.lootPile = [
      {base: null, name: 'Sword', details: '', notes: '', value: 5, coins: {}, quantity: 1, id: "sword_01"},
      {base: null, name: 'Gem', details: '', notes: '', value: 50, coins: {}, quantity: 1, id: "gem_01"},
      {base: null, name: 'Potion', details: '', notes: '', value: 25.5, coins: {}, quantity: 1, id: "potion_01"},
      {base: null, name: 'Book', details: '', notes: '', value: 125, coins: {}, quantity: 1, id: "book_01"},
    ];
    this.lootCoins = 513.98;
    this.characters = {
      "bob": {name: 'Bob', player: '', notes: '', loot:[
        {base: null, name: 'Sword', details: '', notes: '', value: 5, coins: {}, quantity: 1, id: "sword_02"},
        {base: null, name: 'Gem', details: '', notes: '', value: 50, coins: {}, quantity: 1, id: "gem_02"}
      ], lootCoins: 23},
      "sally": {name: 'Sally', player: '', notes: '', loot:[
        {base: null, name: 'Potion', details: '', notes: '', value: 25.5, coins: {}, quantity: 1, id: "potion_02"}
      ], lootCoins: 43.5},
      "mae": {name: 'Mae', player: '', notes: '', loot:[
        {base: null, name: 'Book', details: '', notes: '', value: 125, coins: {}, quantity: 1, id: "book_02"}
      ], lootCoins: 77.62}
    };
  }

  this.lootTotal = 0;
  this.characterTotals = {};
  this.characterDifferences = {};
  this.avgCharacterDifference = 0;

  this.lootPerChar = 0;

  this.sumLootPile = function(){
    var total = 0;
    lootTotal = this.lootPile.reduce(function(runningTotal, item){
      return runningTotal += item.value;
    }, 0);
    total += this.lootCoins;
    if(lootTotal) total += lootTotal;
    return total;
  };

  this.slugify = function(text){
    return _.snakeCase(text);
  };

  this.getCharacter = function(name){
    return this.characters[this.slugify(name)];
  };

  this.removeCharacter = function(name){
    var charLoot = this.characters[this.slugify(name)].loot;
    self.lootPile = self.lootPile.concat(charLoot);
    self.lootCoins += this.characters[this.slugify(name)].lootCoins;
    delete this.characters[this.slugify(name)];
    this.updateLootTotal();
  };

  this.sumCharacter = function(name){
    var char = this.getCharacter(name);
    var charTotal = 0;
    var charLoot = char.loot.reduce(function(runningTotal, item){
      return runningTotal += item.value;
    }, 0);
    if(charLoot) charTotal += charLoot;
    charTotal += char.lootCoins;
    return charTotal;
  };

  this.sumAllCharacters = function(){
    var coinage = 0;
    var characterLoot = _.toArray(this.characters).reduce(function(loot, char){
      coinage += char.lootCoins;
      return loot.concat(char.loot);
    }, []);

    var totalCharacterLootValue = characterLoot.reduce(function(runningTotal, item){
      return runningTotal += item.value;
    }, 0);

    if(totalCharacterLootValue){
      totalCharacterLootValue += coinage;
    }else{
      totalCharacterLootValue = coinage;
    }
    return totalCharacterLootValue;
  };

  this.addCharacter = function(character){
    var name = this.slugify(character.name);
    if(!name || this.characters[name]) return false;
    this.characters[name] = character;
    return true;
  };

  this.getLootItem = function(id){
    for(var i = 0; i < this.lootPile.length; i++){
      var loot = this.lootPile[i];
      if(loot.id === id) return loot;
    }
  };

  this.removeLootItem = function(id){
    for(var i = 0; i < this.lootPile.length; i++){
      var loot = this.lootPile[i];
      if(loot.id === id) this.lootPile.splice(i, 1);
    }
    this.updateLootTotal();
  };

  this.transferCoinsFromStash = function(amount, char){
    if(typeof char === 'string') char = this.getCharacter(char);
    if(this.lootCoins >= amount){
      this.lootCoins -= amount;
      char.lootCoins += amount;
    }else{
      char.lootCoins += this.lootCoins;
      this.lootCoins = 0;
    }
  };

  this.transferCoinsToStash = function(amount, char){
    if(typeof char === 'string') char = this.getCharacter(char);
    if(char.lootCoins >= amount){
      this.lootCoins += amount;
      char.lootCoins -= amount;
    }else{
      this.lootCoins += char.lootCoins;
      char.lootCoins = 0;
    }
  };

  this.updateLootTotal = function(){
    self.lootTotal = self.sumLootPile();
    self.lootPerChar = (self.lootTotal + this.sumAllCharacters()) / Object.keys(self.characters).length;
    self.updateCharacterTotals();
  };

  this.updateCharacterTotals = function(){
    var avgDiff = 0;
    for(var char in self.characters){
      var character = self.characters[char];
      self.characterTotals[char] = self.sumCharacter(char);
      self.characterDifferences[char] = self.lootPerChar - self.characterTotals[char];
      self.characters[char].diff = self.characterDifferences[char];
      avgDiff += self.characterDifferences[char];
    }
    self.avgCharacterDifference = (( avgDiff / Object.keys(self.characters).length ));
  };

  this.resetLootItems = function(){
    for(var slug in self.characters){
      var char = self.characters[slug];
      self.lootPile = self.lootPile.concat(char.loot);
      char.loot.splice(0, char.loot.length);
      self.transferToLootPile(char.lootCoins, char);
    }
    this.updateLootTotal();
  };

  this.clumpInventory = function(inventory){
    var newInv = [];
    var inv = _.forEach(inventory, function(item){
      var matches = _.filter(inventory, {name: item.name, value: item.value});
      item.quantity = matches.length;
      if(item.quantity) newInv.push(item);
      inventory = _.reject(inventory, {name: item.name, value: item.value});
    });

    return _.orderBy(newInv, ['value', 'name'], {name: 'asc', value: 'desc'});
  };

})
.service('NavService', function($rootScope, $location, LootService){
  var self = this;
  this.routes = [
    {path: '/characters', name: 'Add Characters', active: false, isDisabled: function(){ return false; }},
    {path: '/loot', name: 'Add Loot', active: false, isDisabled: function(){ return Object.keys(LootService.characters).length === 0; }},
    {path: '/split', name: 'Split Loot', active: false, isDisabled: function(){ return false; }},
    {path: '/share', name: 'Share Results', active: false, isDisabled: function(){ return LootService.avgCharacterDifference === 0 && LootService.lootPerChar === 0; }},
  ];

  this.findActiveLink = function(){
    _.forEach(self.routes, function(route){
      route.active = false;
    });
    var path = $location.path();
    var route = _.find(self.routes, {path: path});

    if(route) route.active = true;
    if(route && route.isDisabled && route.isDisabled()) $location.path('/characters');
  };

  $rootScope.$on('$locationChangeSuccess', function(){
    self.findActiveLink();
  });
});
