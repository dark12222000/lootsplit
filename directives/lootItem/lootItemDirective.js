angular.module('lootsplit').directive('lootitem', function(){
  return {
    templateUrl: '/directives/lootItem/lootItem.html',
    restrict: 'E',
    scope: {
      item: '=',
      inList: '@'
    }
  };
});
