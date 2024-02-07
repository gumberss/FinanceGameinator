import 'package:finance_gameinator/components/lists/ExpandableList.dart';
import 'package:finance_gameinator/components/navigation/AppRouteNames.dart';
import 'package:finance_gameinator/components/navigation/Navinator.dart';
import 'package:finance_gameinator/components/widgets/Buttoninator.dart';
import 'package:finance_gameinator/components/widgets/SimpleInputOverlay.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../../components/constants/AppCollors.dart';
import '../../../components/constants/AppStrings.dart';

class Player {
  String name;
  List<Game> games;

  Player({required this.name, required this.games});
}

class Game {
  String id;
  String name;

  Game({required this.id, required this.name});
}

class PlayerHomePage extends StatelessWidget {
  PlayerHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    Game game1 = Game(id: '1', name: 'Chess');
    Game game2 = Game(id: '2', name: 'Soccer');
    Player player1 = Player(name: 'Alice', games: [game1, game2]);

    return Scaffold(
        backgroundColor: Colors.grey.shade200,
        appBar: AppBar(
          title: Text(AppStrings.financeGameinator),
          backgroundColor: AppColors.darkerBlue,
          foregroundColor: AppColors.white,
        ),
        body: Column(
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
                      ),
                      ExpandableList<Game>(
                        expandableItems: player1.games,
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
                                  top: BorderSide(
                                      color: Colors.grey, width: 1.0)),
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
                margin: const EdgeInsets.only(
                    top: 10, bottom: 5, left: 10, right: 10),
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
                                return null;
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
        ));
  }
}
