import 'package:dio/dio.dart';
import 'package:finance_gameinator/components/HttpClient/HttpClientVariables.dart';
import 'package:finance_gameinator/components/HttpClient/HttpResponseData.dart';
import 'package:finance_gameinator/components/HttpClient/http_client.dart';

class PlayerService {
  String baseUrl = HttpClientVariables.serverSideBaseUrl;
  String basePath = HttpClientVariables.serverSideBasePath;
  String urlPath = "players";

  late Uri baseUri;

  Options defaultOptions = Options(headers: {
    'Content-Type': 'application/json; charset=UTF-8',
  });

  PlayerGameHttpClient() {
    baseUri = Uri.http(baseUrl, basePath);
  }

  Future<HttpResponseData<String?>> registerPlayer(
      String id, String name) async {
    return await tryRequest(
        client.postUri(Uri.https(baseUrl, "$basePath/$urlPath/register"),
            options: defaultOptions, data: {"id": id, "name": name}),
        (response) => HttpResponseData(
            response.statusCode!, null));
  }
}
