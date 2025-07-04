import 'dart:convert';
import 'dart:io' show Platform;
import 'package:http/http.dart' as http;

class UniversityCard {
  final int id;
  final int studentId;
  final double sold;
  final String? history;
  final bool used;
  final int cardNumberSold;
  final String? cardNumber;

  // Modified constructor that ensures sold is always a double
  UniversityCard({
    required this.id,
    required this.studentId,
    required dynamic soldValue, // Accept any type for soldValue
    this.history,
    required this.used,
    required this.cardNumberSold,
    this.cardNumber,
  }) : sold = _convertToDouble(soldValue); // Force conversion to double

  // Static helper method to convert any value to double
  static double _convertToDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  // Factory method to create a UniversityCard object from JSON
  factory UniversityCard.fromJson(Map<String, dynamic> json) {
    print("Creating UniversityCard from JSON: $json");
    try {
      return UniversityCard(
        id: json['card_id'] ?? 0,
        studentId: json['student_id'] ?? 0,
        soldValue: json['sold'], // Pass the raw value to the constructor
        history: json['history'] as String?,
        used: json['used'] == 1,
        cardNumberSold: json['card_number_sold'] ?? 0,
        cardNumber: json['card_number'],
      );
    } catch (e) {
      print("Error in UniversityCard.fromJson: $e");
      // Return a default UniversityCard with 0 balance on error
      return UniversityCard(
        id: json['card_id'] ?? 0,
        studentId: json['student_id'] ?? 0,
        soldValue: 0.0,
        history: null,
        used: false,
        cardNumberSold: 0,
        cardNumber: null,
      );
    }
  }

  // Get the correct host for API calls based on platform
  static String get _apiHost {
    // Use 10.0.2.2 for Android emulators to connect to host machine's localhost
    // For iOS simulators and physical devices, use localhost
    return Platform.isAndroid ? '10.0.2.2' : 'localhost';
  }

  // Fetch UniversityCard Data from API using student_id
  static Future<UniversityCard?> fetchUniversityCardByStudentId(
      int studentId) async {
    final url = 'http://$_apiHost:3000/university_cards/$studentId';

    try {
      // Print before making the request
      print("Fetching university card from: $url");

      // Make the HTTP GET request
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

      // Print the status and response body for debugging
      print("Response status: ${response.statusCode}");
      print("Response body: ${response.body}");

      // If the request is successful (status 200)
      if (response.statusCode == 200) {
        // Parse the JSON into a UniversityCard object
        final universityCard =
            UniversityCard.fromJson(json.decode(response.body));

        // Print all details of the university card
        print("Fetched university card data: ");
        print("Card ID: ${universityCard.id}");
        print("Student ID: ${universityCard.studentId}");
        print("Sold: ${universityCard.sold}");
        print("History: ${universityCard.history ?? 'No history'}");
        print("Used: ${universityCard.used ? 'Yes' : 'No'}");
        print("Card Number Sold: ${universityCard.cardNumberSold}");
        print("Card Number: ${universityCard.cardNumber ?? 'No card number'}");

        return universityCard;
      } else {
        print("Error: ${response.statusCode} - ${response.body}");
        return null;
      }
    } catch (e) {
      print('Error fetching UniversityCard data: $e');
      return null;
    }
  }

  // Update the sold count of a university card
  static Future<bool> updateSold(int studentId, double newSoldAmount) async {
    final url = 'http://$_apiHost:3000/university_cards/$studentId';

    try {
      print("Updating sold amount for student $studentId to $newSoldAmount");

      // Ensure newSoldAmount is a double with 3 decimal places
      final double formattedAmount =
          double.parse(newSoldAmount.toStringAsFixed(3));

      final response = await http.put(
        Uri.parse(url),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"sold": formattedAmount}),
      );

      print("Update response: ${response.statusCode} - ${response.body}");

      if (response.statusCode != 200) {
        print("Failed to update sold amount: ${response.body}");
        throw Exception('Failed to update sold amount: ${response.body}');
      } else {
        print("Updated sold amount successfully to $formattedAmount");
        return true;
      }
    } catch (e) {
      print('Error updating sold amount: $e');
      return false;
    }
  }
}
