import 'dart:convert';
import 'package:http/http.dart' as http;

class Order {
  final int orderId;
  final int studentId;
  final int? breakfastId;
  final int? lunchId;
  final int? dinnerId;
  final DateTime? purchaseDate; // Explicitly use DateTime for purchaseDate

  Order({
    required this.orderId,
    required this.studentId,
    this.breakfastId,
    this.lunchId,
    this.dinnerId,
    this.purchaseDate,
  });

  // Fetch orders for a specific student
  static Future<List<Order>> fetchOrdersForStudent(int studentId) async {
    try {
      final response = await http.get(
        Uri.parse('http://localhost:3000/orders/student/$studentId'),
      );

      if (response.statusCode == 200) {
        final List<dynamic> orders = json.decode(response.body);
        return orders.map((order) => Order.fromJson(order)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error fetching orders: $e');
      return [];
    }
  }

  // Create a new order
  static Future<Order> createOrder(
      int studentId, int? breakfastId, int? lunchId, int? dinnerId) async {
    try {
      final response = await http.post(
        Uri.parse('http://localhost:3000/orders'),
        body: {
          'student_id': studentId.toString(),
          'breakfast_id': breakfastId?.toString() ?? '',
          'lunch_id': lunchId?.toString() ?? '',
          'dinner_id': dinnerId?.toString() ?? '',
        },
      );

      if (response.statusCode == 200) {
        return Order.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to create order');
      }
    } catch (e) {
      print('Error creating order: $e');
      rethrow;
    }
  }

  // Convert JSON response to Order object
  static Order fromJson(Map<String, dynamic> json) {
    // Convert purchaseDate from string to DateTime
    DateTime? parsedDate;
    if (json['issue_date'] != null) {
      parsedDate = DateTime.tryParse(json['issue_date']);
    }

    return Order(
      orderId: json['order_id'],
      studentId: json['student_id'],
      breakfastId: json['breakfast_id'],
      lunchId: json['lunch_id'],
      dinnerId: json['dinner_id'],
      purchaseDate: parsedDate, // Return DateTime for purchaseDate
    );
  }
}
