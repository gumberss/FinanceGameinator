import 'package:flutter_dotenv/flutter_dotenv.dart';

class HttpClientVariables {
  static String serverSideBaseUrl = dotenv.env['DEFAULT_URL'].toString();

}