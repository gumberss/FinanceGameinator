import 'package:finance_gameinator/components/navigation/Navigator.dart';
import 'package:finance_gameinator/domains/RegisterModuleBase.dart';
import 'package:finance_gameinator/domains/authentication/AuthenticationRegister.dart';
import 'package:flutter/material.dart';

import '../components/constants/AppStrings.dart';
import '../components/constants/AppTheme.dart';
import '../components/navigation/AppRouteNames.dart';
import '../components/navigation/AppRoutes.dart';
import '../components/snackbar/Snackbar.dart';

class RegisterApp extends StatelessWidget {
  RegisterApp({super.key}) {
    List<RegisterModuleBase> registers = [AuthenticationRegister()];
    registers.forEach((register) => register.registerRoutes());
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: AppStrings.loginAndRegister,
      theme: AppTheme.themeData,
      initialRoute: AppRouteNames.login,
      scaffoldMessengerKey: Snackbar.key,
      navigatorKey: AppNavigator.key,
      onGenerateRoute: AppRoutes.generateRoute,
    );
  }
}
