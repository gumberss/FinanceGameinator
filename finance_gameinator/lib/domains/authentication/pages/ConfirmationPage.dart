import 'package:finance_gameinator/Secrets.dart';
import 'package:finance_gameinator/components/constants/AppRegex.dart';
import 'package:finance_gameinator/components/navigation/AppRoutes.dart';
import 'package:flutter/material.dart';

import '../../../components/constants/AppStrings.dart';
import '../../../components/constants/AppTheme.dart';
import '../../../components/fields/AppTextFormField.dart';
import '../../../components/navigation/AppRouteNames.dart';
import '../../../components/navigation/Navinator.dart';
import '../../../components/snackbar/Snackbar.dart';
import '../../../components/widgets/GradientBackground.dart';
import '../ports/UserService.dart';

class ConfirmationPage extends StatefulWidget {
 final String email;

  const ConfirmationPage({Key? key, required this.email})
  : super(key: key);

  @override
  State<ConfirmationPage> createState() => _ConfirmationPageState();
}

class _ConfirmationPageState extends State<ConfirmationPage> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController confirmationCodeController;
  final ValueNotifier<bool> fieldValidNotifier = ValueNotifier(false);

  void initializeControllers() {
    confirmationCodeController = TextEditingController();
  }

  void disposeControllers() {
    confirmationCodeController.dispose();
  }

  @override
  void initState() {
    initializeControllers();
    super.initState();
  }

  @override
  void dispose() {
    disposeControllers();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
           GradientBackground(
            children: const [
              Text(
                AppStrings.confirmYourAccount,
                style: AppTheme.titleLarge,
              ),
              SizedBox(height: 6),
              Text(AppStrings.confirmYourAccount, style: AppTheme.bodySmall),
            ],
          ),
          Form(
            key: _formKey,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  AppTextFormField(
                    controller: confirmationCodeController,
                    labelText: AppStrings.confirmationCode,
                    keyboardType: TextInputType.text,
                    textInputAction: TextInputAction.send
                  ),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: () async {
                      
                      var confirmed = await UserService(userPool).confirmAccount(widget.email, confirmationCodeController.text);

                      if(!confirmed){
                        Snackbar.showSnackBar(
                          AppStrings.invalidRegistrationCode,
                        );

                        return;
                      }

                      Snackbar.showSnackBar(
                        AppStrings.registrationComplete,
                      );
                      confirmationCodeController.clear();
                      Navinator.pushReplacementNamed(AppRouteNames.login);
                    },
                    child: const Text(AppStrings.confirm),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}