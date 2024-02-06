import 'package:flutter/material.dart';

import '../constants/AppCollors.dart';

class GradientBackground extends StatelessWidget {
  GradientBackground({
    required this.children,
    this.colors = AppColors.defaultGradient,
    this.padding = const EdgeInsets.all(20),
    super.key,
  });

  EdgeInsets padding;


  final List<Color> colors;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(gradient: LinearGradient(colors: colors)),
      child: Padding(
        padding: padding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: MediaQuery.sizeOf(context).height * 0.01,
            ),
            ...children,
          ],
        ),
      ),
    );
  }
}
