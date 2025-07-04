import 'package:flutter/material.dart';
import 'package:hive/hive.dart';

import 'package:i_eat/data/student.dart';
import 'package:i_eat/data/universityCard.dart';
import 'package:i_eat/data/ticket.dart'; // Import Ticket class

class CourseCard extends StatefulWidget {
  final String shortName, title, subtitle;
  final double price;
  final Color color;
  final String orderType; // Add orderType parameter

  const CourseCard(this.shortName, this.title, this.subtitle, this.price,
      this.color, this.orderType,
      {super.key});

  @override
  _CourseCardState createState() => _CourseCardState();
}

class _CourseCardState extends State<CourseCard> {
  DateTime? purchaseDate; // Variable to hold the date of purchase

  void _showQRCodeDialog(BuildContext context, Ticket ticket) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          elevation: 12,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.white,
                  Colors.white.withOpacity(0.95),
                  Colors.white.withOpacity(0.9),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: widget.color.withOpacity(0.3),
                  blurRadius: 20,
                  spreadRadius: 0,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        'Your ${widget.title} Ticket',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: widget.color,
                          letterSpacing: 0.5,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: widget.color.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        widget.orderType,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: widget.color,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 10,
                        spreadRadius: 0,
                      ),
                    ],
                    border: Border.all(
                      color: widget.color.withOpacity(0.3),
                      width: 2,
                    ),
                  ),
                  child: ticket.generateQRCode(size: 220),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: widget.color.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: widget.color.withOpacity(0.2),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    children: [
                      _buildTicketDetail(
                          'Ticket ID',
                          ticket.ticketId.toString(),
                          Icons.confirmation_number_outlined),
                      const SizedBox(height: 12),
                      _buildTicketDetail('Date', ticket.issueDate,
                          Icons.calendar_today_outlined),
                      const SizedBox(height: 12),
                      _buildTicketDetail(
                          'Type', ticket.orderType, Icons.fastfood_outlined),
                      const SizedBox(height: 12),
                      _buildTicketDetail(
                          'Price',
                          '${ticket.price.toStringAsFixed(3)} DT',
                          Icons.attach_money_outlined),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: widget.color,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 40, vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    elevation: 5,
                    shadowColor: widget.color.withOpacity(0.5),
                  ),
                  child: const Text(
                    'Close',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTicketDetail(String label, String value, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: widget.color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon,
            color: widget.color,
            size: 20,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: widget.color.withOpacity(0.8),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showDetailsDialog(BuildContext context) async {
    try {
      // Open the Hive box to retrieve the student ID
      var box = await Hive.openBox('studentBox');
      int? studentId = await box.get('student_id');

      // If the student ID is null, show an error message
      if (studentId == null) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Student ID not found')));
        return;
      }

      // Fetch current sold amount
      final sold = await Student.getSoldAmount(studentId);

      // Ensure price is treated as a double and handle decimal places
      final mealPrice = double.parse(widget.price.toStringAsFixed(3));

      print("Checking purchase: Balance=$sold, Price=$mealPrice");

      // Compare as doubles with a small tolerance for floating point comparisons
      if (sold >= mealPrice - 0.001) {
        try {
          // If sufficient funds, deduct price and update the sold value
          final newSoldAmount = sold - mealPrice;
          print("New balance after purchase will be: $newSoldAmount");

          // Create the ticket first
          final newTicket =
              await Ticket.createTicket(widget.orderType, mealPrice, studentId);

          if (newTicket == null) {
            throw Exception('Failed to create ticket');
          }

          // If ticket creation was successful, update the sold value
          await UniversityCard.updateSold(studentId, newSoldAmount);

          // Set the purchase date to the current date and time
          setState(() {
            purchaseDate = DateTime.now();
          });

          // Show success message
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('${widget.title} purchased successfully!'),
            duration: Duration(seconds: 2),
          ));

          // Show QR code dialog
          _showQRCodeDialog(context, newTicket);
        } catch (e) {
          String errorMessage = e.toString();

          // Check if the error is about duplicate ticket
          if (errorMessage.contains('already have a')) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(errorMessage.replaceAll(
                  'Exception: Failed to create ticket: ', '')),
              backgroundColor: Colors.orange,
            ));
          } else {
            // Show general error message
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              content: Text(
                  'An error occurred while processing your order: $errorMessage'),
              backgroundColor: Colors.red,
            ));
          }
          print('Error: $e');
        }
      } else {
        // Show error message if insufficient funds
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(
              'Insufficient funds to purchase ${widget.title}. You have ${sold.toStringAsFixed(3)} DT but need ${mealPrice.toStringAsFixed(3)} DT.'),
          backgroundColor: Colors.red,
        ));
      }
    } catch (e) {
      // Handle any errors that occur during the async operations
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('An error occurred while processing your order: $e'),
        backgroundColor: Colors.red,
      ));
      print('Error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showDetailsDialog(context),
      child: Container(
        width: double.infinity,
        height: 220,
        child: Card(
          elevation: 12,
          shadowColor: widget.color.withOpacity(0.3),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  widget.color,
                  Color.lerp(widget.color, Colors.black, 0.3)!,
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: widget.color.withOpacity(0.4),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Stack(
                children: [
                  // Background decorative elements
                  Positioned(
                    top: -20,
                    right: -20,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(0.1),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -50,
                    left: -30,
                    child: Container(
                      width: 150,
                      height: 150,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(0.1),
                      ),
                    ),
                  ),

                  // Main content
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.max,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(15),
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.3),
                                  width: 1,
                                ),
                              ),
                              child: Text(
                                widget.shortName,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.3),
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.attach_money,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${widget.price.toStringAsFixed(3)} DT',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        Expanded(
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.title,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    height: 1.2,
                                    letterSpacing: 0.5,
                                    shadows: [
                                      Shadow(
                                        color: Colors.black45,
                                        blurRadius: 5,
                                        offset: Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  widget.subtitle,
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.8),
                                    fontSize: 14,
                                    height: 1.3,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ),
                        if (purchaseDate != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.green.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: Colors.green.withOpacity(0.3),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.check_circle,
                                  color: Colors.white,
                                  size: 16,
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'Purchased',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          )
                        else
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: Colors.white.withOpacity(0.3),
                                width: 1,
                              ),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.shopping_cart_outlined,
                                  color: Colors.white,
                                  size: 16,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Buy Now',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
