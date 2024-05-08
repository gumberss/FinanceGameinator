import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/User.dart';

class UserStorage {
  get userId async {
    const storage = FlutterSecureStorage();
    return await storage.read(key: 'userId');
  }

  Future storeUser(User user) async {
    const storage = FlutterSecureStorage();
    var data = User.serialize(user);
    await storage.write(key: 'user', value: data);
  }

  Future<User?> getUser() async {
    const storage = FlutterSecureStorage();
    var dataUser = await storage.read(key: 'user');
    if (dataUser?.isNotEmpty == true) {
      return User.deserialize(dataUser!);
    }
    return null;
  }

  Future delete() async {
    const storage = FlutterSecureStorage();
    await storage.delete(key: 'user');
  }
}
