import 'package:finance_gameinator/components/lists/ExpandableList.dart';
import 'package:finance_gameinator/components/navigation/AppRouteNames.dart';
import 'package:finance_gameinator/components/navigation/Navinator.dart';
import 'package:finance_gameinator/components/widgets/Buttoninator.dart';
import 'package:finance_gameinator/components/widgets/SimpleInputOverlay.dart';
import 'package:finance_gameinator/domains/player/models/GameOverview.dart';
import 'package:finance_gameinator/domains/player/models/PlayerOverview.dart';
import 'package:finance_gameinator/domains/player/ports/PlayerGameHttpClient.dart';
import 'package:finance_gameinator/domains/player/ports/PlayerHttpClient.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../../components/constants/AppCollors.dart';
import '../../../components/constants/AppStrings.dart';

class PlayerHomePage extends StatelessWidget {
  const PlayerHomePage({super.key});

  Scaffold defaultScaffold(String title, Widget body) {
    return Scaffold(
        backgroundColor: Colors.grey.shade200,
        appBar: AppBar(
          title: Text(title),
          backgroundColor: AppColors.darkerBlue,
          foregroundColor: AppColors.white,
        ),
        body: body);
  }

  @override
  Widget build(BuildContext context) {
    String playerId = "";

    return FutureBuilder(
      future: PlayerHttpClient().getOverview(playerId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return defaultScaffold(
              AppStrings.financeGameinator,
              const Center(
                child: CircularProgressIndicator(),
              ));
        } else if (snapshot.hasError) {
          return Center(
            child: Text('Error: ${snapshot.error}'),
          );
        } else if (snapshot.data == null || !snapshot.data!.success()) {
          return Center(
            child: Text(
                'Error: null: ${snapshot.data == null} - StatusCode: ${snapshot.data?.statusCode.toString()} ErrorMessage: ${snapshot.data?.errorMessage}'),
          );
        } else {
          var playerOverview = snapshot.data!.data!;

          return defaultScaffold(playerOverview.info.name,
              PlayerOverviewContainer(playerOverview: playerOverview));
        }
      },
    );
  }
}

class PlayerOverviewContainer extends StatelessWidget {
  final PlayerOverview playerOverview;

  const PlayerOverviewContainer({super.key, required this.playerOverview});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
            flex: 5,
            child: Container(
              margin: const EdgeInsets.only(
                  top: 10, bottom: 5, left: 10, right: 10),
              padding: const EdgeInsets.all(10),
              color: AppColors.lightGray,
              child: Column(
                children: [
                  const Text(
                    AppStrings.yourGames,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 24),
                  ),
                  ExpandableList<GameOverview>(
                    expandableItems: playerOverview.games,
                    titleBuilder: (x) => Container(
                      padding: const EdgeInsets.only(bottom: 10, top: 10),
                      child: Text(x.name),
                    ),
                    onExpandableItemClicked: (x) =>
                        Navinator.pushNamed(AppRouteNames.gameRoom),
                    itemsBuilder: (x) async => [
                      ListTile(
                          title: Container(
                        padding: const EdgeInsets.only(top: 12),
                        decoration: const BoxDecoration(
                          border: Border(
                              top: BorderSide(color: Colors.grey, width: 1.0)),
                        ),
                        height: 100,
                        child: Text(x.name),
                      ))
                    ],
                  )
                ],
              ),
            )),
        Expanded(
          flex: 2,
          child: Container(
            margin:
                const EdgeInsets.only(top: 10, bottom: 5, left: 10, right: 10),
            width: double.infinity,
            height: double.infinity,
            color: AppColors.lightGray,
            child: Column(
              children: [
                Buttoninator(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (BuildContext context) {
                        return SimpleInputOverlay(
                          title: 'Create a Game',
                          labelText: 'Game Name',
                          submitButtonText: "Create the Game",
                          onSubmitPressed: (gameName) async {
                            if (gameName == null || gameName.isEmpty) {
                              return null;
                            }

                            var result = await PlayerGameHttpClient().createGame(gameName);

                            if(result.success()){
                              //todo: open game room giving the id "result.data"
                            }

                          },
                        );
                      },
                    );
                  },
                  buttonText: 'Create Game',
                  fullExpanded: true,
                ),
                Buttoninator(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (BuildContext context) {
                        return SimpleInputOverlay(
                          title: 'Join a Game',
                          labelText: 'Game Code',
                          submitButtonText: "Join the Game",
                          onSubmitPressed: (gameName) async {
                            return null;
                          },
                        );
                      },
                    );
                  },
                  buttonText: 'Join a Game',
                  fullExpanded: true,
                )
              ],
            ),
          ),
        )
      ],
    );
  }
}
