import 'package:finance_gameinator/domains/RegisterModuleBase.dart';
import 'package:finance_gameinator/domains/authentication/pages/ConfirmationPage.dart';
import 'package:finance_gameinator/domains/authentication/pages/RegisterPage.dart';
import 'package:finance_gameinator/domains/authentication/pages/SignInPage.dart';

import '../../components/navigation/AppRouteNames.dart';
import '../../components/navigation/AppRoutes.dart';

class AuthenticationRegister implements RegisterModuleBase {
  @override
  void registerRoutes() {
    AppRoutes.registerPage(AppRouteNames.login, (settings) => const SignInPage());
    AppRoutes.registerPage(AppRouteNames.register, (settings) => const RegisterPage());
    AppRoutes.registerPage(AppRouteNames.confirmation, (settings) => ConfirmationPage(email: settings.arguments as String));
  }
}
