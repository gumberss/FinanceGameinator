import 'package:finance_gameinator/domains/player/models/GameOverview.dart';
import 'package:finance_gameinator/domains/player/models/PlayerInfo.dart';

class PlayerOverview {
  PlayerInfo info;
  List<GameOverview> games;

  PlayerOverview({required this.info, required this.games});

  PlayerOverview.fromJson(Map<String, dynamic> json)
      : info = PlayerInfo.fromJson(json['info']),
        games = (json['games'] as List)
            .map((x) => GameOverview.fromJson(x))
            .toList(growable: false);
}
