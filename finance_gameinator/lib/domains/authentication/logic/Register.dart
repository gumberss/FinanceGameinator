import '../../../components/constants/AppRegex.dart';
import '../../../components/constants/AppStrings.dart';

class Register {
  Register._();

  static String? validateName(String? name) => name!.isEmpty
      ? AppStrings.pleaseEnterName
      : name.length < 4
          ? AppStrings.invalidName
          : null;

  static String? validateEmail(String? email) =>
      email!.isEmpty
          ? AppStrings.pleaseEnterEmailAddress
          : AppRegex.emailRegex.hasMatch(email)
          ? null
          : AppStrings.invalidEmailAddress;

  static String? validatePassword(String? password) =>
      password!.isEmpty
          ? AppStrings.pleaseEnterPassword
          : AppRegex.passwordRegex.hasMatch(password)
          ? null
          : AppStrings.invalidPassword;
}

