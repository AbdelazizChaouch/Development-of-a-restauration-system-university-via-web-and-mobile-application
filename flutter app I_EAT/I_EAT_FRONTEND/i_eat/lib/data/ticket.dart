import 'dart:convert';
import 'dart:io' show Platform;
import 'package:http/http.dart' as http;
import 'package:qr_flutter/qr_flutter.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class Ticket {
  final int ticketId;
  final int? orderId; // Make orderId nullable
  final String issueDate;
  final double price;
  final String orderType;
  final bool used;
  final int studentId;
  final String qrData; // Add QR data field

  Ticket({
    required this.ticketId,
    this.orderId, // Make orderId optional
    required this.issueDate,
    required this.price,
    required this.orderType,
    required this.used,
    required this.studentId,
    required this.qrData, // Add QR data to constructor
  });

  // Get the correct host for API calls based on platform
  static String get _apiHost {
    // Use 10.0.2.2 for Android emulators to connect to host machine's localhost
    // For iOS simulators and physical devices, use localhost
    return Platform.isAndroid ? '10.0.2.2' : 'localhost';
  }

  // Format the date nicely
  String get formattedDate {
    try {
      final DateTime date = DateTime.parse(issueDate);

      // Check if the date is in the future
      final DateTime now = DateTime.now();
      if (date.isAfter(now)) {
        print('Future date detected: $issueDate, using today\'s date instead');
        final DateFormat formatter = DateFormat('EEEE, MMMM d, yyyy', 'en_US');
        return formatter.format(now);
      }

      final DateFormat formatter = DateFormat('EEEE, MMMM d, yyyy', 'en_US');
      final String formatted = formatter.format(date);
      return formatted;
    } catch (e) {
      print('Error formatting date: $e');
      print('Issue date was: $issueDate');
      try {
        // Try alternative format
        final parts = issueDate.split(' ')[0].split('-');
        if (parts.length == 3) {
          // Make sure we're using valid date components and not a future date
          final int year = int.parse(parts[0]);
          final int month = int.parse(parts[1]);
          final int day = int.parse(parts[2]);

          // Check if the date is in the future
          final DateTime now = DateTime.now();
          final DateTime alternativeDate = DateTime(year, month, day);

          // If date is in the future, use today's date instead
          final DateTime dateToFormat =
              alternativeDate.isAfter(now) ? now : alternativeDate;

          final DateFormat formatter =
              DateFormat('EEEE, MMMM d, yyyy', 'en_US');
          return formatter.format(dateToFormat);
        }
      } catch (e2) {
        print('Secondary date parsing error: $e2');
      }
      return 'Today';
    }
  }

  // Format the time nicely
  String get formattedTime {
    try {
      final DateTime date = DateTime.parse(issueDate);
      return DateFormat('HH:mm').format(date);
    } catch (e) {
      print('Error formatting time: $e');
      try {
        // Try alternative format
        final timePart = issueDate.split(' ');
        if (timePart.length > 1) {
          final timePieces = timePart[1].split(':');
          if (timePieces.length >= 2) {
            return "${timePieces[0]}:${timePieces[1]}";
          }
        }
      } catch (e2) {
        print('Secondary time parsing error: $e2');
      }
      // Return current time if we can't parse
      return DateFormat('HH:mm').format(DateTime.now());
    }
  }

  // Format price with currency symbol
  String get formattedPrice {
    return '${price.toStringAsFixed(3)} DT';
  }

  // Get meal emoji based on order type

  // Get color based on order type with more attractive colors
  Color getTicketColor() {
    switch (orderType.toLowerCase()) {
      case 'breakfast':
        return Color(0xFFFFB300); // Warm yellow
      case 'lunch':
        return Color(0xFF2196F3); // Material blue
      case 'dinner':
        return Color(0xFFE91E63); // Pink
      default:
        return Color(0xFF9E9E9E); // Grey
    }
  }

  // Get gradient colors for ticket background
  List<Color> getGradientColors() {
    Color baseColor = getTicketColor();
    return [
      baseColor,
      baseColor.withOpacity(0.8),
      baseColor.withOpacity(0.6),
    ];
  }

  // Get short code with emoji
  String getShortCode() {
    switch (orderType.toLowerCase()) {
      case 'breakfast':
        return '🍳 Br';
      case 'lunch':
        return '🍱 Lu';
      case 'dinner':
        return '🍽️ Di';
      default:
        return '🎫 ??';
    }
  }

  // Get status with icon
  Widget getStatusWidget() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color:
            used ? Colors.red.withOpacity(0.1) : Colors.green.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: used ? Colors.red : Colors.green,
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(width: 4),
          Text(
            used ? 'Used' : 'Valid',
            style: TextStyle(
              color: used ? Colors.red : Colors.green,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  // Check if ticket is from today
  bool isFromToday() {
    try {
      final today = DateTime.now();
      DateTime ticketDate;

      try {
        ticketDate = DateTime.parse(issueDate);

        // Check if date is in the future, if so consider it as today
        if (ticketDate.isAfter(today)) {
          print("Future date detected: $issueDate, treating as today");
          return true;
        }
      } catch (e) {
        // Try alternative format if standard parsing fails
        final datePart = issueDate.split(' ')[0].split('-');
        if (datePart.length == 3) {
          ticketDate = DateTime(int.parse(datePart[0]), int.parse(datePart[1]),
              int.parse(datePart[2]));

          // Check if date is in the future, if so consider it as today
          if (ticketDate.isAfter(today)) {
            print("Future date detected: $issueDate, treating as today");
            return true;
          }
        } else {
          // Can't parse the date, assume it's from today
          print("Can't parse date for comparison: $issueDate");
          return true;
        }
      }

      return today.year == ticketDate.year &&
          today.month == ticketDate.month &&
          today.day == ticketDate.day;
    } catch (e) {
      print("Error checking if ticket is from today: $e");
      // Default to showing the ticket if there's an error
      return true;
    }
  }

  // Factory method to create a Ticket object from JSON
  factory Ticket.fromJson(Map<String, dynamic> json) {
    try {
      // Helper function to safely convert to int
      int safeInt(dynamic value, String fieldName) {
        if (value == null) {
          print('Warning: $fieldName is null');
          return 0;
        }
        if (value is int) return value;
        if (value is String) {
          int? parsed = int.tryParse(value);
          if (parsed != null) return parsed;
        }
        print(
            'Warning: Could not convert $fieldName ($value) to int, defaulting to 0');
        return 0;
      }

      // Helper function to safely convert to double
      double safeDouble(dynamic value, String fieldName) {
        if (value == null) {
          print('Warning: $fieldName is null');
          return 0.0;
        }
        if (value is double) return value;
        if (value is int) return value.toDouble();
        if (value is String) {
          double? parsed = double.tryParse(value);
          if (parsed != null) return parsed;
        }
        print(
            'Warning: Could not convert $fieldName ($value) to double, defaulting to 0.0');
        return 0.0;
      }

      // Extract values with proper type conversion
      int ticketId = safeInt(json['ticket_id'], 'ticket_id');
      int? orderId = json['order_id'] != null
          ? safeInt(json['order_id'], 'order_id')
          : null;
      String issueDate =
          json['issue_date']?.toString() ?? DateTime.now().toString();
      double price = safeDouble(json['price'], 'price');
      String orderType = json['order_type']?.toString() ?? 'Unknown';
      bool used = json['used'] == 1 || json['used'] == true;
      int studentId = safeInt(json['student_id'], 'student_id');
      String qrData = json['qr_data']?.toString() ?? '';

      return Ticket(
        ticketId: ticketId,
        orderId: orderId,
        issueDate: issueDate,
        price: price,
        orderType: orderType,
        used: used,
        studentId: studentId,
        qrData: qrData,
      );
    } catch (e) {
      print('Error in Ticket.fromJson: $e');
      print('Problem JSON data: $json');

      // Return a fallback ticket to prevent app crashes
      return Ticket(
        ticketId: 0,
        issueDate: DateTime.now().toString(),
        price: 0.0,
        orderType: 'Unknown',
        used: false,
        studentId: 0,
        qrData: '',
      );
    }
  }

  // Fetch ticket by orderId from the backend
  static Future<Ticket?> fetchTicketByOrderId(int orderId) async {
    final url = 'http://$_apiHost:3000/tickets/$orderId';

    try {
      print("Fetching ticket for order ID: $orderId from $url");

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
        return Ticket.fromJson(json.decode(response.body));
      } else {
        print('Failed to fetch ticket');
        return null;
      }
    } catch (e) {
      print('Error fetching ticket: $e');
      return null;
    }
  }

  // Fetch tickets by student ID
  static Future<List<Ticket>> fetchTicketsByStudentId(int studentId) async {
    final url = 'http://$_apiHost:3000/tickets/student/$studentId';

    try {
      print('Fetching tickets for student $studentId from $url');

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

      print('Tickets response status: ${response.statusCode}');
      print('Tickets response body: ${response.body}');

      if (response.statusCode == 200) {
        try {
          final List<dynamic> ticketsJson = json.decode(response.body);
          print('Parsed ${ticketsJson.length} tickets from response');

          final tickets = ticketsJson
              .map((json) {
                try {
                  return Ticket.fromJson(json);
                } catch (e) {
                  print('Error parsing individual ticket: $e');
                  print('Problem ticket data: $json');
                  return null;
                }
              })
              .where((ticket) => ticket != null)
              .cast<Ticket>()
              .toList();

          print('Successfully processed ${tickets.length} valid tickets');
          return tickets;
        } catch (e) {
          print('Error parsing tickets JSON: $e');
          return [];
        }
      } else {
        print('Failed to fetch tickets: ${response.body}');
        return [];
      }
    } catch (e) {
      print('Error fetching tickets: $e');
      return [];
    }
  }

  // Helper method to filter breakfast items
  static Future<List<Ticket>> getBreakfastItems() async {
    return fetchMenuByType('breakfast');
  }

  // Helper method to filter lunch items
  static Future<List<Ticket>> getLunchItems() async {
    return fetchMenuByType('lunch');
  }

  // Helper method to filter dinner items
  static Future<List<Ticket>> getDinnerItems() async {
    return fetchMenuByType('dinner');
  }

  // A method to match fetchMenuByType pattern used in the helper methods
  static Future<List<Ticket>> fetchMenuByType(String type) async {
    // Implementation would be similar to fetchTicketsByStudentId with type filtering
    // For now, just return an empty list as a placeholder
    return [];
  }

  // Generate QR code widget with better styling
  Widget generateQRCode({double size = 200}) {
    try {
      if (qrData.isEmpty) {
        return Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.qr_code_2, size: 48, color: Colors.grey),
                SizedBox(height: 8),
                Text(
                  'No QR Code\nAvailable',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        );
      }

      return Container(
        width: size,
        height: size,
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              spreadRadius: 2,
            ),
          ],
        ),
        child: QrImageView(
          data: qrData,
          version: QrVersions.auto,
          size: size - 24,
          backgroundColor: Colors.white,
          errorStateBuilder: (context, error) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 48, color: Colors.red),
                SizedBox(height: 8),
                Text(
                  'Error generating\nQR code',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.red),
                ),
              ],
            ),
          ),
        ),
      );
    } catch (e) {
      print('Error generating QR code: $e');
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Colors.red[100],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: Colors.red),
              SizedBox(height: 8),
              Text(
                'Error',
                style: TextStyle(color: Colors.red),
              ),
            ],
          ),
        ),
      );
    }
  }

  // Create a new ticket in the backend
  static Future<Ticket?> createTicket(
    String orderType,
    double price,
    int studentId,
  ) async {
    final url = 'http://$_apiHost:3000/tickets';

    try {
      print('\n=== Creating Ticket ===');
      print('Parameters:');
      print('- orderType: $orderType (${orderType.runtimeType})');
      print('- price: $price (${price.runtimeType})');
      print('- studentId: $studentId (${studentId.runtimeType})');
      print('- URL: $url');

      // Validate parameters
      if (orderType.isEmpty) throw Exception('orderType cannot be empty');
      if (price <= 0) throw Exception('price must be greater than 0');
      if (studentId <= 0) throw Exception('studentId must be greater than 0');

      // Create the current date in the correct format with time included
      final now = DateTime.now();
      final formattedDate =
          "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')} ${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}";
      print('- issue_date: $formattedDate');

      final requestBody = {
        'order_type': orderType,
        'price': price, // Ensure this is sent as a number
        'student_id': studentId, // Ensure this is sent as a number
        'issue_date': formattedDate // Send current date with time
      };

      print('\nRequest details:');
      print('URL: $url');
      print('Headers: ${{'Content-Type': 'application/json'}}');
      print('Body: ${json.encode(requestBody)}');

      final response = await http
          .post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(requestBody),
      )
          .timeout(
        const Duration(seconds: 15), // Longer timeout for create operations
        onTimeout: () {
          print('Request timed out for URL: $url');
          throw Exception('Connection timed out. Is the server running?');
        },
      );

      print('\nResponse details:');
      print('Status code: ${response.statusCode}');
      print('Headers: ${response.headers}');
      print('Body: ${response.body}');

      if (response.statusCode == 201) {
        print('\nParsing successful response...');
        final responseData = json.decode(response.body);
        print('Parsed response data: $responseData');

        // Ensure the response preserves the full datetime with time
        if (responseData['issue_date'] != null &&
            !responseData['issue_date'].toString().contains(':')) {
          // If backend returns date without time, add the current time
          final responseDate = responseData['issue_date'].toString();
          final currentTime =
              "${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}";
          responseData['issue_date'] = "$responseDate $currentTime";
          print(
              'Added time component to response date: ${responseData['issue_date']}');
        }

        final ticket = Ticket.fromJson(responseData);
        print('Created ticket object: $ticket');
        return ticket;
      } else {
        print('\nHandling error response...');
        String errorMessage;

        try {
          final errorData = json.decode(response.body);
          errorMessage =
              errorData['message'] ?? errorData['error'] ?? 'Unknown error';
          print('Parsed error data: $errorData');
        } catch (e) {
          errorMessage = response.body;
          print('Failed to parse error response: $e');
        }

        throw Exception('Failed to create ticket: $errorMessage');
      }
    } catch (e) {
      print('\nError in createTicket: $e');
      rethrow;
    }
  }

  // Add static method to get today's tickets
  static Future<List<Ticket>> getTodayTickets(int studentId) async {
    try {
      final tickets = await fetchTicketsByStudentId(studentId);
      final today = DateTime.now();
      return tickets.where((ticket) => ticket.isFromToday()).toList();
    } catch (e) {
      print('Error getting today tickets: $e');
      return [];
    }
  }

  // Check if student has specific ticket type for today
  static Future<bool> hasTicketForToday(int studentId, String orderType) async {
    try {
      final todayTickets = await getTodayTickets(studentId);
      return todayTickets.any((ticket) =>
          ticket.orderType.toLowerCase() == orderType.toLowerCase());
    } catch (e) {
      print('Error checking today ticket: $e');
      return false;
    }
  }

  // Get all ticket types for today
  static Future<List<String>> getTodayTicketTypes(int studentId) async {
    try {
      final todayTickets = await getTodayTickets(studentId);
      return todayTickets.map((ticket) => ticket.orderType).toList();
    } catch (e) {
      print('Error getting today ticket types: $e');
      return [];
    }
  }

  // Update ticket status to used
  static Future<bool> markTicketAsUsed(int ticketId) async {
    final url = 'http://$_apiHost:3000/tickets/$ticketId/use';

    try {
      print('Marking ticket $ticketId as used at $url');

      final response = await http.put(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          print('Request timed out for URL: $url');
          throw Exception('Connection timed out. Is the server running?');
        },
      );

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.statusCode == 200) {
        return true;
      } else {
        print('Failed to mark ticket as used: ${response.body}');
        return false;
      }
    } catch (e) {
      print('Error marking ticket as used: $e');
      return false;
    }
  }

  @override
  String toString() {
    return '''Ticket {
      ID: $ticketId
      Type: $orderType 
      Date: $formattedDate
      Time: $formattedTime
      Price: $formattedPrice
      Status: ${used ? 'Used ❌' : 'Valid ✅'}
    }''';
  }
}
