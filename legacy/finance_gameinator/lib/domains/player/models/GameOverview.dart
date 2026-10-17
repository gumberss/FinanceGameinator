class GameOverview {
  String id;
  String name;

  GameOverview({required this.id, required this.name});

  GameOverview.fromJson(Map<String, dynamic> json)
      : id = json['id'],
        name = json['name'];
}