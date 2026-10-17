class PlayerInfo {
  String name;

  PlayerInfo({required this.name});

  PlayerInfo.fromJson(Map<String, dynamic> json) : name = json['name'];
}
