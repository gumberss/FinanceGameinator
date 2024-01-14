import 'package:finance_gameinator/domains/RegisterModuleBase.dart';
import 'package:finance_gameinator/domains/authentication/pages/RegisterPage.dart';
import 'package:finance_gameinator/domains/authentication/pages/SignInPage.dart';

import '../../components/navigation/AppRouteNames.dart';
import '../../components/navigation/AppRoutes.dart';

class AuthenticationRegister implements RegisterModuleBase {
  @override
  void registerRoutes() {
    AppRoutes.registerPage(AppRouteNames.login, () => const SignInPage());
    AppRoutes.registerPage(AppRouteNames.register, () => const RegisterPage());
  }
}
