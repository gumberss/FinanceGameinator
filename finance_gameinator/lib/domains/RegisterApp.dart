import 'package:finance_gameinator/components/navigation/Navinator.dart';
import 'package:finance_gameinator/domains/RegisterModuleBase.dart';
import 'package:finance_gameinator/domains/authentication/AuthenticationRegister.dart';
import 'package:finance_gameinator/domains/player/PlayerRegister.dart';
import 'package:flutter/material.dart';

import '../components/constants/AppStrings.dart';
import '../components/constants/AppTheme.dart';
import '../components/navigation/AppRouteNames.dart';
import '../components/navigation/AppRoutes.dart';
import '../components/snackbar/Snackbar.dart';

class RegisterApp extends StatelessWidget {
  RegisterApp({super.key}) {
    List<RegisterModuleBase> registers = [AuthenticationRegister(), PlayerRegister()];
    registers.forEach((register) => register.registerRoutes());
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: AppStrings.loginAndRegister,
      theme: AppTheme.themeData,
      initialRoute: AppRouteNames.playerHome,//initialRoute: AppRouteNames.login,
      scaffoldMessengerKey: Snackbar.key,
      navigatorKey: Navinator.key,
      onGenerateRoute: AppRoutes.generateRoute,
    );
  }
}
