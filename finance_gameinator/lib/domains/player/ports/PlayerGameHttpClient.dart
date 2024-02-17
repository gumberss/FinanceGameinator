import 'package:dio/dio.dart';
import 'package:finance_gameinator/components/HttpClient/HttpClientVariables.dart';
import 'package:finance_gameinator/components/HttpClient/HttpResponseData.dart';
import 'package:finance_gameinator/components/HttpClient/http_client.dart';
import 'package:finance_gameinator/domains/player/models/PlayerOverview.dart';

class PlayerGameHttpClient {
  String baseUrl = HttpClientVariables.serverSideBaseUrl;
  String basePath = "/api/games";

  late Uri baseUri;

  Options defaultOptions = Options(headers: {
    'Content-Type': 'application/json; charset=UTF-8',
  });

  PlayerGameHttpClient() {
    baseUri = Uri.http(baseUrl, basePath);
  }

  Future<HttpResponseData<String?>> createGame(String gameName) async {
    return await tryRequest(
        client.getUri(Uri.http(baseUrl, basePath),
            options: defaultOptions),
            (response) => HttpResponseData(response.statusCode!, response.data["id"].toString()));
  }
}
