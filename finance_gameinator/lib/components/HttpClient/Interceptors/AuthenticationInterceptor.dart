
import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/cupertino.dart';
import '../../JwtService.dart';

class AuthenticationInterceptor extends InterceptorsWrapper{

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    var customHeaders = {
      'content-type': 'application/json',
      HttpHeaders.authorizationHeader: "Bearer ${await JwtService().jwtToken}",
      'user-id': await JwtService().userId
    };
    options.headers.addAll(customHeaders);
    super.onRequest(options, handler);
  }
}