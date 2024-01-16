import 'package:finance_gameinator/domains/RegisterModuleBase.dart';
import 'package:finance_gameinator/domains/authentication/pages/RegisterPage.dart';
import 'package:finance_gameinator/domains/authentication/pages/SignInPage.dart';
import 'package:finance_gameinator/domains/lobby/LobbyPage.dart';

import '../../components/navigation/AppRouteNames.dart';
import '../../components/navigation/AppRoutes.dart';

class LobbyRegister implements RegisterModuleBase {
  @override
  void registerRoutes() {
    AppRoutes.registerPage(AppRouteNames.lobby, () => const LobbyPage());
  }
}

