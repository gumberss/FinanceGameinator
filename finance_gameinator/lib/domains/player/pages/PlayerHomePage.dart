
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class PlayerHomePage extends StatelessWidget {
  const PlayerHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: Text("HellooHellooHellooHellooHellooHellooHellooHelloo"),
    );
  }
}

