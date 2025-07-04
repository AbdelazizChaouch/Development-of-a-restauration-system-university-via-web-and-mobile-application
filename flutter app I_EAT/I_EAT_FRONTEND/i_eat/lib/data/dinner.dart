import 'dart:convert';
import 'dart:io' show Platform;
import 'package:http/http.dart' as http;

class Dinner {
  final int id;
  final String name;
  final String description;
  final int menuId;
  final double price;
  final int ticketId;

  Dinner({
    required this.id,
    required this.name,
    required this.description,
    required this.menuId,
    required this.price,
    required this.ticketId,
  });

  factory Dinner.fromJson(Map<String, dynamic> json) {
    return Dinner(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      menuId: json['menu_id'] ?? 0,
      price: json['price']?.toDouble() ?? 0.0,
      ticketId: json['ticket_id'] ?? 0,
    );
  }

  // Get the correct host for API calls based on platform
  static String get _apiHost {
    // Use 10.0.2.2 for Android emulators to connect to host machine's localhost
    // For iOS simulators and physical devices, use localhost
    return Platform.isAndroid ? '10.0.2.2' : 'localhost';
  }

  // Make this method static
  static Future<Dinner?> fetchDinnerById(int id) async {
    final url = 'http://$_apiHost:3000/dinner/$id';

    try {
      print("Fetching dinner from: $url");

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

      print("Response status: ${response.statusCode}");
      print("Response body: ${response.body}");

      if (response.statusCode == 200) {
        return Dinner.fromJson(jsonDecode(response.body));
      } else {
        print("Error: ${response.statusCode} - ${response.body}");
        return null;
      }
    } catch (e) {
      print("Failed to fetch dinner: $e");
      return null;
    }
  }
}
