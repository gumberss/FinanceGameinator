import 'package:finance_gameinator/domains/RegisterModuleBase.dart';
import 'package:finance_gameinator/domains/authentication/models/User.dart';
import '../../components/navigation/AppRouteNames.dart';
import '../../components/navigation/AppRoutes.dart';
import 'pages/PlayerHomePage.dart';

class PlayerRegister implements RegisterModuleBase {
  @override
  void registerRoutes() {
    AppRoutes.registerPage(AppRouteNames.playerHome, (settings) => PlayerHomePage());
  }
}


