import 'package:flutter/material.dart';
import 'package:i_eat/data/student.dart';
import 'dart:io' show Platform;
import 'package:hive/hive.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

class OverallProgressSection extends StatefulWidget {
  const OverallProgressSection({super.key});

  @override
  _OverallProgressSectionState createState() => _OverallProgressSectionState();
}

class _OverallProgressSectionState extends State<OverallProgressSection>
    with SingleTickerProviderStateMixin {
  String studentName = "Loading...";
  String cardNumber = "********";
  double progress = 0.0;
  String daysLeft = "Loading...";
  bool isLoading = true;
  late AnimationController _rotationController;

  // Get the correct host for API calls based on platform
  String get _apiHost {
    // Use 10.0.2.2 for Android emulators to connect to host machine's localhost
    // For iOS simulators and physical devices, use localhost
    return Platform.isAndroid ? '10.0.2.2' : 'localhost';
  }

  @override
  void initState() {
    super.initState();
    _rotationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );
    _fetchUniversityCard();
  }

  @override
  void dispose() {
    _rotationController.dispose();
    super.dispose();
  }

  Future<void> _fetchUniversityCard() async {
    setState(() {
      isLoading = true;
    });

    final studentId = await getStudentId();
    if (studentId == null) {
      print("No student ID found in Hive");
      setState(() {
        studentName = "Unknown";
        cardNumber = "N/A";
        isLoading = false;
      });
      return;
    }

    try {
      _rotationController.repeat();
      final student = await Student.fetchStudentByStudentId(studentId);
      if (student != null) {
        setState(() {
          studentName =
              student.full_name.isNotEmpty ? student.full_name : "Unknown";
        });
      }

      final url = 'http://$_apiHost:3000/university_cards/$studentId';
      print("Fetching university card from: $url");

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
        final data = json.decode(response.body);
        setState(() {
          isLoading = false;
          cardNumber = data['cardNumber'] ?? data['card_number'] ?? "N/A";
          progress = (data['sold'] is int)
              ? (data['sold'] as int).toDouble()
              : (data['sold'] ?? 0.0).toDouble();
          daysLeft = "${data['history'] ?? 'N/A'} D";
        });
      }
      _rotationController.stop();
    } catch (e) {
      print("Error fetching university card: $e");
      setState(() {
        isLoading = false;
      });
      _rotationController.stop();
    }
  }

  Future<int?> getStudentId() async {
    try {
      Box box;
      // Check if box is already open
      if (Hive.isBoxOpen('studentBox')) {
        box = Hive.box('studentBox');
      } else {
        box = await Hive.openBox('studentBox');
      }

      return box.get('student_id');
    } catch (e) {
      print("Error getting student ID: $e");
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final Color baseColor = const Color(0xFF0000FF);
    final currencyFormat = NumberFormat.currency(symbol: '', decimalDigits: 3);

    return Container(
      height: 210,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: baseColor.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Card Background with gradient and pattern
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  baseColor,
                  const Color(0xFF3030FF),
                  const Color(0xFF4040FF),
                ],
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Stack(
                children: [
                  // Decorative circles
                  Positioned(
                    top: -50,
                    left: -20,
                    child: Container(
                      width: 150,
                      height: 150,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(0.1),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -70,
                    right: -30,
                    child: Container(
                      width: 180,
                      height: 180,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(0.1),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Card Content
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: isLoading
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        RotationTransition(
                          turns: _rotationController,
                          child: Icon(
                            Icons.refresh,
                            color: Colors.white.withOpacity(0.7),
                            size: 40,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Loading your card...',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Card Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.credit_card,
                                color: Colors.white,
                                size: 20,
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'I·EAT CARD',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1,
                                ),
                              ),
                            ],
                          ),
                          Image.asset(
                            'assets/images/chip.png',
                            height: 32,
                            errorBuilder: (context, error, stackTrace) =>
                                Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.credit_card_rounded,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const Spacer(),

                      // Balance - Bold & Prominent
                      Center(
                        child: Column(
                          children: [
                            Text(
                              progress.toStringAsFixed(3),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 40,
                                fontWeight: FontWeight.bold,
                                letterSpacing: -1,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'DT',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const Spacer(),

                      // Card Details - Bottom row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Cardholder Name
                          Expanded(
                            flex: 3,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'CARD HOLDER',
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.7),
                                    fontSize: 10,
                                    letterSpacing: 1,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  studentName.toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    letterSpacing: 0.5,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Card Number
                          Expanded(
                            flex: 2,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  'CARD NUMBER',
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.7),
                                    fontSize: 10,
                                    letterSpacing: 1,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  cardNumber.length > 8
                                      ? '${cardNumber.substring(0, 4)} ${cardNumber.substring(4, 8)}...'
                                      : cardNumber,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    letterSpacing: 1,
                                    fontFamily: 'monospace',
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
