angular.module('lootsplit').directive('character', function(){
  return {
    templateUrl: '/directives/character/character.html',
    restrict: 'E',
    scope: {
      character: '=char'
    }
  };
});
