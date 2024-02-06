import 'package:finance_gameinator/domains/RegisterModuleBase.dart';
import 'package:finance_gameinator/domains/game/pages/GameRoomPage.dart';
import '../../components/navigation/AppRouteNames.dart';
import '../../components/navigation/AppRoutes.dart';

class GameRegister implements RegisterModuleBase {
  @override
  void registerRoutes() {
    AppRoutes.registerPage(AppRouteNames.gameRoom, (settings) => GameRoomPage());
  }
}

