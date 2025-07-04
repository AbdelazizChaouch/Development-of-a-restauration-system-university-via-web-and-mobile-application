import 'dart:convert';
import 'dart:io' show Platform;
import 'package:http/http.dart' as http;

class Menu {
  final int menuId;
  final int foodId;
  String? name;
  double? price;
  String? description;
  List<String>? ingredients;
  String? imageUrl;
  String? type;

  Menu({
    required this.menuId,
    required this.foodId,
    this.name,
    this.price,
    this.description,
    this.ingredients,
    this.imageUrl,
    this.type,
  });

  factory Menu.fromJson(Map<String, dynamic> json) {
    return Menu(
      menuId: json['menu_id'] ?? 0,
      foodId: json['food_id'] ?? 0,
      name: json['name'] ?? 'Unknown Item',
      price:
          json['price'] != null ? double.parse(json['price'].toString()) : 0.0,
      description: json['description'] ?? 'No description available',
      ingredients: json['ingredients']?.toString().split(','),
      imageUrl: json['image_url'],
      type: json['type']?.toLowerCase() ?? 'unknown',
    );
  }

  // Get formatted price with 3 decimal places
  String get formattedPrice {
    return '${price?.toStringAsFixed(3) ?? "0.000"} DT';
  }

  // Get the correct host for API calls based on platform
  static String get _apiHost {
    // Use 10.0.2.2 for Android emulators to connect to host machine's localhost
    // For iOS simulators and physical devices, use localhost
    return Platform.isAndroid ? '10.0.2.2' : 'localhost';
  }

  static Future<List<Menu>> fetchMenuWithFood() async {
    final url = 'http://$_apiHost:3000/menu/with-food';

    try {
      print('Fetching menu with food from: $url');

      final response = await http
          .get(
        Uri.parse(url),
      )
          .timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          print('Request timed out for URL: $url');
          throw Exception('Connection timed out. Is the server running?');
        },
      );

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.statusCode == 200) {
        final List<dynamic> menuJson = json.decode(response.body);
        if (menuJson.isEmpty) {
          print('No menu items found in response');
          return [];
        }
        return menuJson.map((json) => Menu.fromJson(json)).toList();
      } else {
        print('Failed to fetch menu: ${response.body}');
        return [];
      }
    } catch (e) {
      print('Error fetching menu: $e');
      return [];
    }
  }

  static Future<List<Menu>> fetchMenuByType(String type) async {
    final url = 'http://$_apiHost:3000/menu/type/$type';

    try {
      print('Fetching menu by type: $type from: $url');

      final response = await http
          .get(
        Uri.parse(url),
      )
          .timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          print('Request timed out for URL: $url');
          throw Exception('Connection timed out. Is the server running?');
        },
      );

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.statusCode == 200) {
        final List<dynamic> menuJson = json.decode(response.body);
        if (menuJson.isEmpty) {
          print('No menu items found for type: $type');
          return [];
        }
        return menuJson.map((json) => Menu.fromJson(json)).toList();
      } else {
        print('Failed to fetch menu: ${response.body}');
        return [];
      }
    } catch (e) {
      print('Error fetching menu: $e');
      return [];
    }
  }

  // Helper method to filter breakfast items
  static Future<List<Menu>> getBreakfastItems() async {
    return fetchMenuByType('breakfast');
  }

  // Helper method to filter lunch items
  static Future<List<Menu>> getLunchItems() async {
    return fetchMenuByType('lunch');
  }

  // Helper method to filter dinner items
  static Future<List<Menu>> getDinnerItems() async {
    return fetchMenuByType('dinner');
  }
}
