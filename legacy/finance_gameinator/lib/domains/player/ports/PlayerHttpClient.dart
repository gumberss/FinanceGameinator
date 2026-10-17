import 'package:dio/dio.dart';
import 'package:finance_gameinator/components/HttpClient/HttpClientVariables.dart';
import 'package:finance_gameinator/components/HttpClient/HttpResponseData.dart';
import 'package:finance_gameinator/components/HttpClient/http_client.dart';
import 'package:finance_gameinator/domains/player/models/GameOverview.dart';
import 'package:finance_gameinator/domains/player/models/PlayerInfo.dart';
import 'package:finance_gameinator/domains/player/models/PlayerOverview.dart';

class PlayerHttpClient {
  String baseUrl = HttpClientVariables.serverSideBaseUrl;
  String basePath = "/api/players";

  late Uri baseUri;

  Options defaultOptions = Options(headers: {
    'Content-Type': 'application/json; charset=UTF-8',
  });

  PlayerHttpClient() {
    baseUri = Uri.http(baseUrl, basePath);
  }

  Future<HttpResponseData<PlayerOverview?>> getOverview(String playerId) async {
    return HttpResponseData(
        200,
        PlayerOverview(games: [
          GameOverview(name: "Game 1", id: "12321"),
          GameOverview(name: "Game 2", id: "1232132132131231"),
          GameOverview(name: "Game 2", id: "1232132132131231"),
          GameOverview(name: "Game 2", id: "1232132132131231"),
          GameOverview(name: "Game 2", id: "1232132132131231"),
          GameOverview(name: "Game 2", id: "1232132132131231")

        ], info: PlayerInfo(name: "lala")));
  }


/*
*    Future<HttpResponseData<PlayerOverview?>> getOverview(String playerId) async {
    return await tryRequest(
        client.getUri(Uri.http(baseUrl, "$basePath/$playerId"),
            options: defaultOptions),
            (response) => HttpResponseData(response.statusCode!,
                PlayerOverview.fromJson(response.data)));
  }*/
}
