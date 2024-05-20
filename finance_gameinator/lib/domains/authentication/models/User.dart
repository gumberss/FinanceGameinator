import 'dart:convert';

import 'package:amazon_cognito_identity_dart_2/cognito.dart';

class User {
  String? email;
  String? name;
  String? password;
  String? id;
  String? accessToken;
  bool confirmed = false;
  bool hasAccess = false;

  User({this.email, this.name});

  User.fromJson(Map<String, dynamic> json)
      : email = json['email'],
        name = json['name'],
        password = json['password'],
        id = json['id'];

  static Map<String, dynamic> toMap(User user) => <String, dynamic>{
        'email': user.email,
        'name': user.name,
        'password': user.password,
        'id': user.id
      };

  static String serialize(User user) =>
      json.encode(User.toMap(user));

  static User deserialize(String json) =>
      User.fromJson(jsonDecode(json));

  factory User.fromUserAttributes(List<CognitoUserAttribute> attributes) {
    final user = User();
    attributes.forEach((attribute) {
      if (attribute.getName() == 'email') {
        user.email = attribute.getValue();
      } else if (attribute.getName() == 'name') {
        user.name = attribute.getValue();
      } else if (attribute.getName() == 'sub') {
        user.id = attribute.getValue();
      } else if (attribute.getName() != null &&
          attribute.getName()!.toLowerCase().contains('verified')) {
        if (attribute.getValue() != null &&
            attribute.getValue()!.toLowerCase() == 'true') {
          user.confirmed = true;
        }
      }
    });
    return user;
  }
}
