import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../../components/constants/AppCollors.dart';
import '../../../components/constants/AppStrings.dart';
import '../../../components/constants/AppTheme.dart';
import '../../../components/widgets/GradientBackground.dart';

class PlayerHomePage extends StatelessWidget {
  const PlayerHomePage({super.key});

  @override
  Widget build(BuildContext context) {
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
                child: Container(
                  margin:
                      EdgeInsets.only(top: 10, bottom: 5, left: 10, right: 10),
                  width: double.infinity,
                  padding: EdgeInsets.all(10),
                  color: AppColors.lightGray,
                  child: Column(
                    children: [
                      Text(
                        AppStrings.yourGames,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                flex: 5),
            Expanded(
              child: Container(
                margin:
                    EdgeInsets.only(top: 10, bottom: 5, left: 10, right: 10),
                width: double.infinity,
                padding: EdgeInsets.all(10),
                color: AppColors.lightGray,
                child: Column(
                  children: [

                  ],
                ),
              ),
              flex: 2,
            )
          ],
        ));
  }
}
