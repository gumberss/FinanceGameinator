import 'package:finance_gameinator/components/constants/AppCollors.dart';
import 'package:finance_gameinator/components/navigation/Navinator.dart';
import 'package:flutter/material.dart';

import '../navigation/AppRouteNames.dart';

class ExpandableList<T> extends StatelessWidget {
  final List<T> expandableItems;
  final Widget Function(T) titleBuilder;
  final Widget Function(T)? subtitleBuilder;
  final Future<List<ListTile>> Function(T) itemsBuilder;
  final bool maintainState;
  final void Function(T)? onExpandableItemClicked;

  ExpandableList(
      {Key? key,
      required this.expandableItems,
      required this.titleBuilder,
      required this.itemsBuilder,
      this.onExpandableItemClicked,
      this.maintainState = true,
      this.subtitleBuilder})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    var expansionTiles = this.expandableItems.map((expandableItem) {
      var expandableTile = this.expandableTilesBuilder(expandableItem);
      return expandableTile;
    }).toList();

    return Expanded(
      child: ListView.builder(
          itemCount: expansionTiles.length,
          itemBuilder: (context, index) {
            return expansionTiles[index];
          }),
      flex: 2,
    );
  }

  Set<String> expandedItems = Set();

  Container expandableTilesBuilder(T mainItem) {
    var clickable = onExpandableItemClicked != null;

    var subTitleTile =
        subtitleBuilder != null ? subtitleBuilder!(mainItem) : null;

    subTitleTile = clickable && subTitleTile != null
        ? InkWell(
            child: subTitleTile,
            onTap: () => this.onExpandableItemClicked!(mainItem),
          )
        : subTitleTile;

    var titleTitle = clickable
        ? InkWell(
            child: titleBuilder(mainItem),
            onTap: () => this.onExpandableItemClicked!(mainItem),
          )
        : titleBuilder(mainItem);

    return Container(
      decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: Colors.grey, width: 1.0))),
      child: ExpansionTile(
        shape: const Border(),
          title: Container(
            margin: const EdgeInsets.only(right: 20),
              decoration: const BoxDecoration(border: Border(right: BorderSide(color: Colors.grey, width: 1.0))),
              child: titleTitle),
          subtitle: subTitleTile,
          children: [
            FutureBuilder(
                future: itemsBuilder(mainItem),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(
                      child: CircularProgressIndicator(),
                    );
                  } else if (snapshot.hasError) {
                    return Center(
                      child: Text('Error: ${snapshot.error}'),
                    );
                  } else {
                    var items = snapshot.data!;

                    child:
                    return ListView.builder(
                        shrinkWrap: true,
                        itemCount: items.length,
                        itemBuilder: (context, index) {
                          return items[index];
                        });
                  }
                })
          ]),
    );
  }
}
