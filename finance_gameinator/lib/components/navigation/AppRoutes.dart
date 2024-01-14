import 'package:flutter/material.dart';

import '../widgets/InvalidRoute.dart';

class AppRoutes {
  const AppRoutes._();

  static Map<String, Widget Function()> _pagesRegistered = {};

  static void registerPage(String route, Widget Function() pageFunction) {
    _pagesRegistered[route] = pageFunction;
  }

  static Route<dynamic> generateRoute(RouteSettings settings) {
    Route<dynamic> getRoute({
      required Widget widget,
      bool fullscreenDialog = false,
    }) {
      return MaterialPageRoute<void>(
        builder: (context) => widget,
        settings: settings,
        fullscreenDialog: fullscreenDialog,
      );
    }

    var page = _pagesRegistered.containsKey(settings.name)
    ? _pagesRegistered[settings.name]
    : () => const InvalidRoute();
    
    return getRoute(widget: page!());
  }
}
