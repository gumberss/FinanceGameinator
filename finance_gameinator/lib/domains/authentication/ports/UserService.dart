import 'dart:async';
import 'dart:io';

import 'package:amazon_cognito_identity_dart_2/cognito.dart';
import 'package:finance_gameinator/components/constants/ErrorIdentifier.dart';
import 'package:finance_gameinator/components/result/BusinessError.dart';
import 'package:finance_gameinator/components/result/Result.dart';
import 'package:flutter/cupertino.dart';

import '../../../Secrets.dart';
import '../../../components/snackbar/Snackbar.dart';
import '../models/User.dart';

class UserService {
  late final CognitoUserPool _userPool;
  CognitoUser? _cognitoUser;
  CognitoUserSession? _session;

  UserService(this._userPool);

  CognitoCredentials? credentials;

  /// Initiate user session from local storage if present
  Future<bool> init() async {
    // final prefs = await SharedPreferences.getInstance();
    // final storage = Storage(prefs);
    final storage = CognitoMemoryStorage();
    _userPool.storage = storage;

    _cognitoUser = await _userPool.getCurrentUser();
    if (_cognitoUser == null) {
      return false;
    }
    _session = await _cognitoUser!.getSession();
    return _session?.isValid() ?? false;
  }

  /// Get existing user from session with his/her attributes
  Future<User?> getCurrentUser() async {
    if (_cognitoUser == null || _session == null) {
      return null;
    }
    if (!_session!.isValid()) {
      return null;
    }
    final attributes = await _cognitoUser?.getUserAttributes();
    if (attributes == null) {
      return null;
    }
    final user = User.fromUserAttributes(attributes);
    user.hasAccess = true;
    return user;
  }

  Future<CognitoCredentials?> getCredentials() async {
    if (_cognitoUser == null || _session == null) {
      return null;
    }

    credentials = CognitoCredentials(cognitoIdentityPoolId, userPool);
    await credentials!.getAwsCredentials(_session?.getIdToken().getJwtToken());
    return credentials!;
  }

  Future<Result<User, BusinessError>> login(
      String email, String password) async {

    _cognitoUser = CognitoUser(email, _userPool, storage: _userPool.storage);

    final authDetails = AuthenticationDetails(
      username: email,
      password: password,
    );

    try {
      _session = await _cognitoUser!.authenticateUser(authDetails);

    } on CognitoClientException catch (e) {

      if (e.code == 'UserNotConfirmedException') {
        return Result.fromError(BusinessError(
            ErrorIdentifier.userNotConfirmed, "The user wasn't confirmed"));
      } else {
        return Result.fromError(
            BusinessError(ErrorIdentifier.unknownError,e.message));
      }
    } on Exception catch (e){
      return Result.fromError(
          BusinessError(ErrorIdentifier.unknownError, "Unknown error"));
    }

    if (_session == null || !_session!.isValid()) {
      return Result.fromError(BusinessError(ErrorIdentifier.userInvalidSession,
          "The customer session is invalid"));
    }

    final attributes = await _cognitoUser!.getUserAttributes();
    if(attributes != null){
      final user = User.fromUserAttributes(attributes);
      user.confirmed = true;
      user.hasAccess = true;
      return Result(user);
    }

    return Result.fromError(BusinessError(ErrorIdentifier.unknownError, "It wasn't possible to get the user"));
  }

  /// Confirm user's account with confirmation code sent to email
  Future<bool> confirmAccount(String email, String confirmationCode) async {
    _cognitoUser = CognitoUser(email, _userPool, storage: _userPool.storage);
    try {
      return await _cognitoUser?.confirmRegistration(confirmationCode) ?? false;
    } catch (e) {
      return false;
    }
  }

  /// Resend confirmation code to user's email
  Future<void> resendConfirmationCode(String email) async {
    _cognitoUser = CognitoUser(email, _userPool, storage: _userPool.storage);
    await _cognitoUser?.resendConfirmationCode();
  }

  /// Check if user's current session is valid
  Future<bool> checkAuthenticated() async {
    if (_cognitoUser == null || _session == null) {
      return false;
    }
    return _session!.isValid();
  }

  /// Sign up user
  Future<Result<User, BusinessError>> signUp(
      String email, String password, String name) async {
    CognitoUserPoolData data;
    final userAttributes = [
      AttributeArg(name: 'name', value: name),
    ];

    try {
      data = await _userPool.signUp(email, password,
          userAttributes: userAttributes);
    } on CognitoClientException catch (e) {
      debugPrint(e.toString());
      if (e.code == 'UsernameExistsException' ||
          e.code == 'InvalidParameterException' ||
          e.code == 'InvalidPasswordException' ||
          e.code == 'ResourceNotFoundException') {
        return Result.fromError(BusinessError(
            ErrorIdentifier.invalid, e.message ?? e.code ?? e.toString()));
      } else {
        return Result.fromError(BusinessError(ErrorIdentifier.serverError,
            'Unknown cognito client error occurred'));
      }
    } catch (e) {
      return Result.fromError(BusinessError(
          ErrorIdentifier.serverError, 'Unknown client error occurred'));
    }

    final user = User();
    user.email = email;
    user.name = name;
    user.confirmed = data.userConfirmed ?? false;

    return Result(user);
  }

  Future<void> signOut() async {
    if (credentials != null) {
      await credentials!.resetAwsCredentials();
    }
    if (_cognitoUser != null) {
      return _cognitoUser!.signOut();
    }
  }
}
