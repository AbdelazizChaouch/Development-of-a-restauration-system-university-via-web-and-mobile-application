import 'dart:convert';
import 'dart:io' show Platform, File;
import 'dart:typed_data';

import 'package:i_eat/data/universityCard.dart';
import 'package:http/http.dart' as http;

class Student {
  final int student_id;
  final int cn;
  final String full_name;
  final String? profile_image;
  final int? card_id;
  final int? university_id;
  final String? university_description;
  final int? orders_id;
  final int? ticket_id;

  // Constructor
  Student({
    required this.student_id,
    required this.cn,
    required this.full_name,
    this.profile_image,
    this.card_id,
    this.university_id,
    this.university_description,
    this.orders_id,
    this.ticket_id,
  });

  // Factory method to create a Student object from JSON
  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      student_id: json['student_id'] != null ? json['student_id'] as int : 0,
      cn: json['cn'] != null ? json['cn'] as int : 0,
      full_name: json['full_name'] ?? '',
      profile_image: json['profile_img'] as String?,
      card_id: json['card_id'] != null ? json['card_id'] as int : null,
      university_id:
          json['university_id'] != null ? json['university_id'] as int : null,
      university_description: json['university_description'] as String?,
      orders_id: json['orders_id'] != null ? json['orders_id'] as int : null,
      ticket_id: json['ticket_id'] != null ? json['ticket_id'] as int : null,
    );
  }

  // Get the correct host for API calls based on platform
  static String get _apiHost {
    // Use 10.0.2.2 for Android emulators to connect to host machine's localhost
    // For iOS simulators and physical devices, use localhost
    return Platform.isAndroid ? '10.0.2.2' : 'localhost';
  }

  // Fetch Student Data from API using student_id
  static Future<Student?> fetchStudentByStudentId(int studentId) async {
    final url = 'http://$_apiHost:3000/student/$studentId';
    print('Fetching student from: $url');

    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 30), // Increased timeout to 30 seconds
        onTimeout: () {
          print('Request timed out for URL: $url');
          throw Exception(
              'Connection timed out. Please check your internet connection and try again.');
        },
      );

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        if (jsonData == null) {
          print('No data received from server');
          return null;
        }
        return Student.fromJson(jsonData);
      } else if (response.statusCode == 404) {
        print('Student not found with ID: $studentId');
        return null;
      } else {
        print("Error: ${response.statusCode} - ${response.body}");
        throw Exception('Failed to fetch student data. Please try again.');
      }
    } catch (e) {
      print('Error fetching student data: $e');
      if (e.toString().contains('timed out')) {
        throw Exception(
            'Connection timed out. Please check your internet connection and try again.');
      } else {
        throw Exception('Failed to fetch student data: ${e.toString()}');
      }
    }
  }

  // Get the "sold" value from the UniversityCard by student_id
  static Future<double> getSoldAmount(int studentId) async {
    try {
      // Make a direct API call to get the balance
      final url = 'http://$_apiHost:3000/university_cards/$studentId';
      print("Directly fetching balance for student $studentId from: $url");

      final response = await http.get(Uri.parse(url)).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          print('Balance request timed out for URL: $url');
          throw Exception('Connection timed out. Is the server running?');
        },
      );

      print("Balance response status: ${response.statusCode}");
      print("Balance response body: ${response.body}");

      if (response.statusCode == 200) {
        final data = json.decode(response.body);

        // Extract the sold value directly
        var soldValue = data['sold'];
        print("Raw sold value from API: $soldValue (${soldValue.runtimeType})");

        // Convert to double regardless of original type
        double balance = 0.0;
        if (soldValue is int) {
          balance = soldValue.toDouble();
        } else if (soldValue is double) {
          balance = soldValue;
        } else if (soldValue is String) {
          balance = double.tryParse(soldValue) ?? 0.0;
        }

        print("Converted balance: $balance");
        return balance;
      } else {
        print(
            "Error fetching balance: ${response.statusCode} - ${response.body}");
        return 0.0;
      }
    } catch (e) {
      print("Error in getSoldAmount: $e");
      return 0.0;
    }
  }

  // Upload a profile image for a student
  static Future<bool> uploadProfileImage(int studentId, File imageFile) async {
    try {
      // Read image as bytes
      List<int> imageBytes = await imageFile.readAsBytes();

      // Convert to base64 for sending to server
      String base64Image = base64Encode(imageBytes);

      // Prepare the API endpoint
      final url = 'http://$_apiHost:3000/student/$studentId/profile-image';
      print('Uploading profile image to: $url');

      // Make the API call to update the profile image
      final response = await http
          .post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'image': base64Image,
        }),
      )
          .timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          print('Upload request timed out for URL: $url');
          throw Exception('Connection timed out. Is the server running?');
        },
      );

      print('Upload response status: ${response.statusCode}');
      print('Upload response body: ${response.body}');

      return response.statusCode == 200;
    } catch (e) {
      print('Error uploading profile image: $e');
      return false;
    }
  }
}
