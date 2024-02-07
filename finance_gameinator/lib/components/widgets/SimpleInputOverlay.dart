import 'package:finance_gameinator/components/widgets/Buttoninator.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class SimpleInputOverlay extends StatefulWidget {
  String title;
  String labelText;
  Future<String?> Function(String) onSubmitPressed;
  String submitButtonText;

  SimpleInputOverlay(
      {Key? key,
      required this.title,
      required this.labelText,
      required this.onSubmitPressed,
      required this.submitButtonText})
      : super(key: key);

  @override
  _SimpleInputOverlayState createState() => _SimpleInputOverlayState();
}

class _SimpleInputOverlayState extends State<SimpleInputOverlay> {
  late TextEditingController _inputController;

  @override
  void initState() {
    super.initState();
    _inputController = TextEditingController();
  }

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.title),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _inputController,
            decoration: InputDecoration(labelText: widget.labelText),
          ),
          const SizedBox(height: 16.0),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Expanded(
                  child: Buttoninator(
                onPressed: () {
                  // Handle create game button press
                  String gameName = _inputController.text;
                  print('Create game: $gameName');
                  Navigator.of(context).pop();
                },
                fontSize: 14,
                buttonTextPadding: 0,
                height: 75,
                buttonText: 'Cancel',
                buttonColor: Colors.redAccent,
              )),
              Expanded(
                  child: Buttoninator(
                onPressed: () async {
                  String inputText = _inputController.text;
                  var errors = await widget.onSubmitPressed(inputText);

                  if (errors == null) {
                    Navigator.of(context).pop();
                  } else {}
                },
                fontSize: 14,
                buttonTextPadding: 0,
                height: 75,
                buttonText: widget.submitButtonText,
              )),
            ],
          ),
        ],
      ),
    );
  }
}
