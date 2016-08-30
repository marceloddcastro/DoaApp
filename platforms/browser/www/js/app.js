(function () {
    var app = ons.bootstrap('doa', ['onsen', 'ab-base64', 'ngStorage', 'ngProgress']);

    app.run(function () {
        FastClick.attach(document.body);
    });

    app.directive('appBlur', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function ($scope, $element, $attrs) {
                $element.bind('blur', function () {
                    $scope.$apply($attrs.appBlur);
                });
            }
        }
    });

    app.directive('ifLoading', function ($http) {
        return {
            restrict: 'AE',
            link: function ($scope, $element) {
                $scope.isLoading = function () {
                    return $http.pendingRequests.length > 0;
                }

                $scope.$watch($scope.isLoading, function (newValue) {
                    if (newValue) {
                        $element.show();
                    } else {
                        $element.hide();
                    }
                });
            }
        }
    });

    app.directive('ifNotLoading', function ($http) {
        return {
            link: function ($scope, $element) {
                $scope.isNotLoading = function () {
                    return $http.pendingRequests.length == 0;
                }

                $scope.$watch($scope.isNotLoading, function (newValue) {
                    if (newValue) {
                        $element.show();
                    } else {
                        $element.hide();
                    }
                });
            }
        }
    });

    app.factory('UrlService', function () {
        var service = {};

        service.get = function (requestUri) {
            var url = 'http://10.0.0.106:8080/doa/rest' + requestUri;
            var i;

            for (i = 1; i < arguments.length; i++) {
                url += '/' + arguments[i];
            }

            return url;
        }

        service.timeout = function () {
            return 15000;
        }

        return service;
    });

    app.factory('AppService',
        function ($http, $timeout, $httpParamSerializerJQLike , $localStorage, UrlService) {
            var service = {};

            service.setCookies = function (doador) {
                $localStorage.doador = {
                    id: doador.id,
                    cep: doador.cep,
                    cidade: {
                        id: doador.cidade.id,
                        nome: doador.cidade.nome,
                        uf: doador.cidade.uf
                    },
                    email: doador.email,
                    foto: doador.foto,
                    nascimento: doador.nascimento,
                    nome: doador.nome,
                    cpf: doador.cpf,
                    senha: doador.senha,
                    telefone: doador.telefone,
                    tipoSanguineo: doador.tipoSanguineo,
                    ultima_doacao: doador.ultima_doacao,
                    proxima_doacao: doador.proxima_doacao
                };
            };


            service.login = function (credentials, callback) {
                $timeout(function () {
                    $http({
                        method: 'POST',
                        url: UrlService.get('/doador/login'),
                        data: $httpParamSerializerJQLike(credentials),
                        headers: {'Content-Type': 'application/json;charset=utf-8'},
                        timeout: UrlService.timeout
                    }).then(function successCallback(response) {
                        callback(true, response);
                    }, function errorCallback(response) {
                        callback(false, response);
                    });
                }, 1000);
            };

            service.isLoggedIn = function () {
                return angular.isDefined($localStorage.doador);
            }

            service.logout = function () {
                delete $localStorage.doador;
            };

            service.doador = $localStorage.doador;

            return service;
        });

    app.controller('LoginController', function ($scope, $http, $timeout, AppService, ngProgressFactory) {
        ons.ready(function() {
            $scope.doador = AppService.doador;
            if(AppService.isLoggedIn()){
                if($scope.doador.foto != null){
                    document.getElementById('imgPerfil').src = 'data:image/png;base64,'+$scope.doador.foto;
                }else{
                    $scope.doador = null;
                }
                $scope.menu.setMainPage('home.html', {closeMenu: true});
            }
            $scope.progressbar = ngProgressFactory.createInstance();
            $scope.progressbar.setHeight('10px');
        });

        $timeout(function() {
            $scope.showError = function (message) {
                $scope.errorMessage = message;

                if (angular.isUndefined($scope.errorDialog)) {
                    ons.createDialog('login-error-dialog.html', {parentScope: $scope}).then(function (dialog) {
                        $scope.errorDialog = dialog;
                        $scope.errorDialog.show();
                    });
                } else {
                    $scope.errorDialog.show();
                }
            }

            $scope.login = function () {
                $scope.progressbar.start();
                $scope.__loading = true;

                AppService.login($scope.credentials, function (success, response) {
                    $scope.__loading = false;
                    $scope.progressbar.complete();
                    if (success) {
                        AppService.logout();
                        AppService.setCookies(response.data);

                        $scope.menu.setMainPage('home.html', {closeMenu: true});

                    } else {
                        console.log(response.data);
                        $scope.showError(response.status === 404
                            ? response.data
                            : 'Não foi possível contactar ao servidor, tente novamente mais tarde.');
                    }
                });
            }

            $scope.logout = function () {
                AppService.logout();
                delete $scope.doador;
                $scope.menu.setMainPage('login.html', {closeMenu: true});
            }

            $scope.isLoggedIn = function () {
                return AppService.isLoggedIn();
            }
        }, 500);

    });

    app.controller('CadastroController', function ($scope, $http, $timeout, AppService, UrlService, ngProgressFactory) {
        //http://docs.phonegap.com/en/edge/cordova_camera_camera.md.html#Camera
        ons.ready(function () {
            $scope.tiposSanguineos = ['A+', 'A-', 'B+', 'B+', 'O+', 'O+', 'AB+', 'AB+', 'OB+', 'OB+'];
            if(AppService.isLoggedIn()){
                $scope.doador = AppService.doador;
                console.log($scope.doador);
                var smallImage = document.getElementById('smallImage');
                smallImage.style.display = 'block';
                smallImage.src = 'data:image/png;base64,'+$scope.doador.foto;
                console.log(smallImage.src);
                var btnCamera = document.getElementById('btnCamera');

                btnCamera.style.display = 'none';
            }else{
                $scope.doador = {
                    id: null,
                    cep: null,
                    cidade: {
                        id: null,
                        nome: null,
                        uf: null
                    },
                    email: null,
                    foto: null,
                    nascimento: null,
                    nome: null,
                    cpf: null,
                    senha: null,
                    telefone: null,
                    tipoSanguineo: null};
            }

            $scope.progressbar = ngProgressFactory.createInstance();
            $scope.progressbar.setHeight('10px');
        });

        $timeout(function () {

            $scope.showInfo = function (message, redirectToLogin) {
                $scope.infoMessage = message;
                $scope.infoRedirectToLogin = redirectToLogin;

                if (angular.isUndefined($scope.infoDialog)) {
                    ons.createDialog('cadastro-info-dialog.html', {parentScope: $scope}).then(function (dialog) {
                        $scope.infoDialog = dialog;
                        $scope.infoDialog.on('posthide', function (e) {
                            if ($scope.infoRedirectToLogin) {
                                $scope.menu.setMainPage('login.html', {closeMenu: true});
                            }
                        });

                        $scope.infoDialog.show();
                    });
                } else {
                    $scope.infoDialog.show();
                }
            }

            $scope.showError = function (message) {
                $scope.errorMessage = message;

                if (angular.isUndefined($scope.errorDialog)) {
                    ons.createDialog('cadastro-error-dialog.html', {parentScope: $scope}).then(function (dialog) {
                        $scope.errorDialog = dialog;
                        $scope.errorDialog.show();
                    });
                } else {
                    $scope.errorDialog.show();
                }
            }

            $scope.showCidadesDialog = function () {
                ons.createDialog('cidades.html', {parentScope: $scope}).then(function (dialog) {
                    $scope.cidadeDialog = dialog;
                    dialog.show();
                });
            }

            $scope.showTipoSanguineoDialog = function () {
                ons.createDialog('tipo-sanguineo.html', {parentScope: $scope}).then(function (dialog) {
                    $scope.tipoSanguineoDialog = dialog;
                    dialog.show();
                });
            }

            $scope.findCidade = function () {
                $scope.cidades = [];
                $http.get(UrlService.get("/doador/findCidadeByDescricao", document.getElementById('searchCidade').value), {timeout: UrlService.timeout}).then(
                    function successCallback(response) {
                        if (response.status == 200) {
                            console.log(document.getElementById('searchCidade').value);
                            $scope.cidades = response.data;
                        } else {
                            alert('Nenhum resultado encontrado');
                        }
                    }, function errorCallback(response) {
                        console.log(response);
                    });
            }

            $scope.selectCidade = function (index) {
                $scope.doador.cidade = $scope.cidades[index];
                $scope.cidadeDialog.hide();
            }

            $scope.selectTipoSanguineo = function (index) {
                $scope.doador.tipoSanguineo = $scope.tiposSanguineos[index];
                $scope.tipoSanguineoDialog.hide();
            }

            $scope.saveNewDoador = function () {
                $scope.progressbar.start();
                $http({
                    method: 'POST',
                    url: UrlService.get('/doador/saveNewDoador'),
                    data: AppService.doador,
                    headers: {'Content-Type': 'application/json;charset=utf-8'},
                    timeout: 10000
                }).then(function successCallback(response) {
                    $scope.showInfo($scope.doador.id == null ?
                        'Inscrição consluída com sucesso! Faça para acessar a sua conta.'
                        :'Os dados da sua conta foram atualizados.', $scope.doador.id == null)
                    $scope.doador = response.data;
                    console.log(response.data)
                }, function errorCallback(response) {
                    console.error(response);
                });
                $scope.progressbar.complete();
            }

            $scope.showFotoOpcoesDialog = function () {
                ons.createDialog('foto-opcoes.html', {parentScope: $scope}).then(function (dialog) {
                    $scope.tipoOpcoesFoto = dialog;
                    dialog.show();
                });
            }

            function onPhotoDataSuccess(imageData) {
                var smallImage = document.getElementById('smallImage');
                smallImage.style.display = 'block';
                smallImage.src = "data:image/jpg;base64," + imageData;
                console.log(smallImage.src);
                var btnCamera = document.getElementById('btnCamera');

                btnCamera.style.display = 'none';
            }

            function getDataUri(url, callback) {
                var image = new Image();
                image.onload = function () {
                    var canvas = document.createElement('canvas');
                    canvas.display = 'block';
                    canvas.width = this.naturalWidth;
                    canvas.height = this.naturalHeight;
                    canvas.getContext('2d').drawImage(this, 0, 0);

                    callback(canvas.toDataURL('image/jpg').replace(/^data:image\/(png|jpg);base64,/, ''));

                };
                image.src = url;
            }


            function onPhotoURISuccess(imageURI) {
                var smallImage = document.getElementById('smallImage');
                smallImage.style.display = 'block';
                smallImage.src = imageURI;

                getDataUri(imageURI, function (dataUri) {
                    AppService.doador.foto = dataUri;
                });

                var btnCamera = document.getElementById('btnCamera');
                btnCamera.style.display = 'none';
                $scope.tipoOpcoesFoto.hide();

            }

            function onFail(message) {
                alert('Failed because: ' + message);
            }

            $scope.removerFoto = function () {
                var smallImage = document.getElementById('smallImage');
                smallImage.style.display = 'none';
                smallImage.src = null;

                $scope.doador.foto = null;
                $scope.tipoOpcoesFoto.hide();
                var btnCamera = document.getElementById('btnCamera');
                btnCamera.style.display = 'block';

            }

            $scope.tirarFoto = function () {
                navigator.camera.getPicture(onPhotoURISuccess, onFail, {
                    quality: 100,
                    destinationType: Camera.DestinationType.FILE_URI,
                    // : Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    //mediaType : Camera.MediaType.PICTURE,
                    encodingType:Camera.EncodingType.JPEG,
                    //correctOrientation: true,
                    targetWidth: 200,
                    targetHeight: 100,
                    allowEdit: true
                });
            }

            $scope.escolherFoto = function () {
                navigator.camera.getPicture(onPhotoURISuccess, onFail, {
                    quality: 100,
                    destinationType: Camera.DestinationType.FILE_URI,
                    // : Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
                    //mediaType : Camera.MediaType.PICTURE,
                    encodingType:Camera.EncodingType.JPEG,
                    //correctOrientation: true,
                    targetWidth: 200,
                    targetHeight: 100,
                    allowEdit: true
                });
            }

        }, 500);

    });

    app.controller('HomeController', function ($scope, $http, $timeout, AppService, UrlService, ngProgressFactory) {
        ons.ready(function () {

        });
    });

})();


