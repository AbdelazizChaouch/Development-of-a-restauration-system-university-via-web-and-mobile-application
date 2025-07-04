import 'package:flutter/material.dart';
import 'package:i_eat/data/menu.dart';

class Diner extends StatefulWidget {
  const Diner({super.key});

  @override
  State<Diner> createState() => _DinerState();
}

class _DinerState extends State<Diner> {
  List<Menu> menuItems = [];
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadMenuData();
  }

  Future<void> _loadMenuData() async {
    try {
      final menus = await Menu.getDinnerItems();
      setState(() {
        menuItems = menus;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = 'Failed to load menu data';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              error!,
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadMenuData,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (menuItems.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/images/dinner.png',
              width: 200,
              height: 200,
            ),
            const SizedBox(height: 16),
            const Text(
              'No dinner items available',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Please check back later',
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadMenuData,
              child: const Text('Refresh'),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadMenuData,
        child: ListView.builder(
          padding: const EdgeInsets.all(16.0),
          itemCount: menuItems.length,
          itemBuilder: (context, index) {
            final menu = menuItems[index];
            return Card(
              elevation: 4,
              margin: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Food Image
                  ClipRRect(
                    borderRadius:
                        const BorderRadius.vertical(top: Radius.circular(8)),
                    child: Image.network(
                      menu.imageUrl ?? '',
                      width: double.infinity,
                      height: 200,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Image.asset(
                        'assets/images/dinner.png',
                        width: double.infinity,
                        height: 200,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title and Price
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                menu.name ?? 'Unknown Item',
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.red,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.red.shade100,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '${menu.price?.toStringAsFixed(3) ?? 0} DT',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.red.shade700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        // Description
                        if (menu.description != null) ...[
                          Text(
                            'Description',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.red.shade700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            menu.description!,
                            style: const TextStyle(
                              fontSize: 16,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 8),
                        ],

                        // Ingredients
                        if (menu.ingredients != null &&
                            menu.ingredients!.isNotEmpty) ...[
                          Text(
                            'Ingredients',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.red.shade700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Wrap(
                            spacing: 8.0,
                            children: menu.ingredients!
                                .map((ingredient) =>
                                    _buildIngredientChip(ingredient))
                                .toList(),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildIngredientChip(String label) {
    return Chip(
      label: Text(label.trim()),
      backgroundColor: Colors.red.shade100,
      labelStyle: TextStyle(
        color: Colors.red.shade700,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}
