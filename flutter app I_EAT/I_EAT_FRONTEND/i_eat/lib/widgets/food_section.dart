import 'package:flutter/material.dart';
import 'package:i_eat/data/menu.dart';
import 'package:i_eat/widgets/courseCard.dart';

class FoodSection extends StatefulWidget {
  const FoodSection({super.key});

  @override
  _FoodSectionState createState() => _FoodSectionState();
}

class _FoodSectionState extends State<FoodSection>
    with SingleTickerProviderStateMixin {
  Future<List<Menu>>? breakfast;
  Future<List<Menu>>? lunch;
  Future<List<Menu>>? dinner;
  late TabController _tabController;
  int _currentIndex = 0;

  // Colors matching the app theme
  final Color _primaryColor = const Color(0xFF0000FF);
  final Color _accentColor = const Color(0xFF00C2FF);

  @override
  void initState() {
    super.initState();
    _loadMenuData();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          _currentIndex = _tabController.index;
        });
      }
    });
  }

  Future<void> _loadMenuData() async {
    setState(() {
      breakfast = Menu.getBreakfastItems();
      lunch = Menu.getLunchItems();
      dinner = Menu.getDinnerItems();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildTabBar(),
        const SizedBox(height: 16),
        _buildMealContent(),
      ],
    );
  }

  Widget _buildTabBar() {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(
          color: Colors.white.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          borderRadius: BorderRadius.circular(25),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              _primaryColor,
              _accentColor,
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: _accentColor.withOpacity(0.4),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        labelColor: Colors.white,
        unselectedLabelColor: Colors.white.withOpacity(0.7),
        labelStyle: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
        unselectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.w500,
          fontSize: 14,
        ),
        padding: const EdgeInsets.all(4),
        labelPadding: const EdgeInsets.symmetric(horizontal: 4),
        tabs: [
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.wb_sunny_outlined, size: 18),
                SizedBox(width: 4),
                Text('Breakfast'),
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.lunch_dining_outlined, size: 18),
                SizedBox(width: 4),
                Text('Lunch'),
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.dinner_dining_outlined, size: 18),
                SizedBox(width: 4),
                Text('Dinner'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMealContent() {
    final List<Widget> mealWidgets = [
      _buildMealFutureBuilder(
          'Breakfast', breakfast, Colors.amber.shade600, 'Br'),
      _buildMealFutureBuilder('Lunch', lunch, Colors.blue.shade600, 'Lu'),
      _buildMealFutureBuilder('Dinner', dinner, Colors.purple.shade600, 'Di'),
    ];

    return SizedBox(
      height: 220,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 500),
        child: mealWidgets[_currentIndex],
        transitionBuilder: (Widget child, Animation<double> animation) {
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0.05, 0),
                end: Offset.zero,
              ).animate(animation),
              child: child,
            ),
          );
        },
      ),
    );
  }

  Widget _buildMealFutureBuilder(String mealType, Future<List<Menu>>? future,
      Color color, String shortName) {
    if (future == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              strokeWidth: 3,
            ),
            const SizedBox(height: 16),
            Text(
              'Loading $mealType...',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    return FutureBuilder<List<Menu>>(
      key: ValueKey<String>(mealType),
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  strokeWidth: 3,
                ),
                const SizedBox(height: 16),
                Text(
                  'Loading $mealType...',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          );
        } else if (snapshot.hasError) {
          return Center(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Colors.red.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline,
                      color: Colors.white, size: 48),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading $mealType',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${snapshot.error}',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return Center(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Colors.white.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.no_meals,
                      color: Colors.white.withOpacity(0.8), size: 48),
                  const SizedBox(height: 16),
                  Text(
                    'No $mealType available',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          );
        } else {
          final menuItems = snapshot.data!;
          final firstItem = menuItems.first;

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: CourseCard(
              shortName,
              firstItem.name ?? 'Unknown Item',
              firstItem.description ?? 'No description available',
              firstItem.price ?? 0.0,
              color,
              mealType,
            ),
          );
        }
      },
    );
  }
}
