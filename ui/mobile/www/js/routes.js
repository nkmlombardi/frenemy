angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider
        .state('app', {
            url: '/app',
            abstract: true,
            templateUrl: "templates/app.html"
        })

        .state('app.game', {
            url: '/game',
            views: {
                'appContent': {
                    templateUrl: 'templates/game.html'
                }
            }
        })

    $urlRouterProvider.otherwise('/app/game')
});
