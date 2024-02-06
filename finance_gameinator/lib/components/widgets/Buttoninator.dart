import 'package:flutter/material.dart';

class Buttoninator extends StatelessWidget {
  String buttonText;
  void Function() onPressed;

  Color buttonColor;
  Color textColor;

  bool expanded;

  double? height;

  Buttoninator(
      {super.key,
      required this.buttonText,
      required this.onPressed,
      this.buttonColor = Colors.blue,
      this.textColor = Colors.black,
      this.expanded = false,
      this.height});

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
        padding: const EdgeInsets.all(16.0),
        child: Text(
          buttonText,
          style: TextStyle(
            fontSize: 20.0,
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
      ),
    );

    var container = Container(
        width: double.infinity,
        height: height != null ? height: double.infinity,
        margin: EdgeInsets.only(top: 10, bottom: 10),
        child: button);

    return expanded
        ? Expanded(
            child: Row(
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
