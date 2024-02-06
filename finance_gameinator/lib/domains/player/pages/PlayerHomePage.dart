import 'package:finance_gameinator/components/lists/ExpandableList.dart';
import 'package:finance_gameinator/components/navigation/AppRouteNames.dart';
import 'package:finance_gameinator/components/navigation/AppRoutes.dart';
import 'package:finance_gameinator/components/navigation/Navinator.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../../components/constants/AppCollors.dart';
import '../../../components/constants/AppStrings.dart';
import '../../../components/constants/AppTheme.dart';
import '../../../components/widgets/GradientBackground.dart';

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
                    Expanded(
                      child: Row(
                        children: [
                          Expanded(
                            child: Container(
                              width: double.infinity,
                              height: double.infinity,
                              margin: EdgeInsets.only(top: 10, bottom: 10),
                              child: ElevatedButton(
                                onPressed: () {
                                  // Handle player joining the game
                                  print('Player joined the game!');
                                },
                                style: ButtonStyle(
                                  backgroundColor:
                                      MaterialStateProperty.all(Colors.blue),
                                  elevation: MaterialStateProperty.all(2.0),
                                  shape: MaterialStateProperty.all<
                                      RoundedRectangleBorder>(
                                    RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16.0),
                                    ),
                                  ),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Text(
                                    'Create Game',
                                    style: TextStyle(
                                      fontSize: 20.0,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.black,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Row(
                        children: [
                          Expanded(
                            child: Container(
                              width: double.infinity,
                              height: double.infinity,
                              margin: EdgeInsets.only(top: 10, bottom: 10),
                              child: ElevatedButton(
                                onPressed: () {
                                  // Handle player joining the game
                                  print('Player joined the game!');
                                },
                                style: ButtonStyle(
                                  backgroundColor:
                                      MaterialStateProperty.all(Colors.blue),
                                  elevation: MaterialStateProperty.all(2.0),
                                  shape: MaterialStateProperty.all<
                                      RoundedRectangleBorder>(
                                    RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16.0),
                                    ),
                                  ),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Text(
                                    'Join a Game',
                                    style: TextStyle(
                                      fontSize: 20.0,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.black,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            )
          ],
        ));
  }
}
