import 'package:flutter/material.dart';

class Buttoninator extends StatelessWidget {
  String buttonText;
  void Function() onPressed;

  Color buttonColor;
  Color textColor;
  bool fullExpanded;
  double height;
  double width;
  double fontSize;
  double buttonTextPadding;
  EdgeInsets buttonMargin;

  Buttoninator(
      {super.key,
      required this.buttonText,
      required this.onPressed,
      this.buttonColor = Colors.blue,
      this.textColor = Colors.black,
      this.fullExpanded = false,
      this.height = double.infinity,
      this.width = double.infinity,
      this.fontSize = 20.0,
      this.buttonTextPadding = 16.0,
      this.buttonMargin = const EdgeInsets.all(10)});

  @override
  Widget build(BuildContext context) {
    var button = ElevatedButton(
      onPressed: onPressed,
      style: ButtonStyle(
        backgroundColor: MaterialStateProperty.all(buttonColor),
        elevation: MaterialStateProperty.all(2.0),
        shape: MaterialStateProperty.all<RoundedRectangleBorder>(
          RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16.0),
          ),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.all(buttonTextPadding),
        child: Text(
          textAlign: TextAlign.center,
          buttonText,
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        )
      ),
    );

    var container = Container(
        width: width, height: height, margin: buttonMargin, child: button);

    return fullExpanded
        ? Expanded(
            child: Column(
              children: [
                Expanded(
                  child: container,
                ),
              ],
            ),
          )
        : container;
  }
}
