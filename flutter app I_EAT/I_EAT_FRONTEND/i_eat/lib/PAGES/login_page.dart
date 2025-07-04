import 'package:flutter/material.dart';
import 'package:i_eat/PAGES/QRScannerScreen.dart';
import 'package:i_eat/data/student.dart';
import 'package:hive_flutter/hive_flutter.dart'; // Import Hive
import 'dart:io' show Platform;
import 'dart:convert'; // Add this import for JSON parsing

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage>
    with SingleTickerProviderStateMixin {
  bool isApiCallProcess = false;
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  int? _userCn;
  String? _scannedCode;
  String? _errorMessage;

  // Animation controller
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  final Color _primaryColor = const Color(0xFF0000FF);
  final Color _buttonColor = const Color(0xFF0057FF);
  final Color _accentColor = const Color(0xFF00C2FF);
  final Color _inputFieldColor = Colors.white;
  final Color _buttonTextColor = Colors.white;

  String get _apiHost {
    // Use 10.0.2.2 for Android emulators to connect to host machine's localhost
    // For iOS simulators and physical devices, use localhost
    return Platform.isAndroid ? '10.0.2.2' : 'localhost';
  }

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.8, curve: Curves.easeOut),
      ),
    );

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeOutQuint,
      ),
    );

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              _primaryColor,
              _accentColor,
            ],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // Background patterns
              Positioned(
                top: -100,
                right: -100,
                child: Container(
                  width: 300,
                  height: 300,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.1),
                  ),
                ),
              ),
              Positioned(
                bottom: -80,
                left: -80,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.1),
                  ),
                ),
              ),

              // Main content
              _buildLoginUI(context),

              // Loading indicator
              if (isApiCallProcess)
                Container(
                  color: Colors.black.withOpacity(0.4),
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 3,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoginUI(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;

    return Center(
      child: SingleChildScrollView(
        padding: EdgeInsets.symmetric(
          horizontal: screenWidth * 0.08,
          vertical: screenHeight * 0.02,
        ),
        child: AnimatedBuilder(
          animation: _animationController,
          builder: (context, child) {
            return Opacity(
              opacity: _animationController.value,
              child: Transform.translate(
                offset: Offset(0, 20 * (1 - _animationController.value)),
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                    border: Border.all(
                      color: Colors.white.withOpacity(0.2),
                      width: 1,
                    ),
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        _buildLogo(screenHeight),
                        const SizedBox(height: 36),
                        _buildCnInput(),
                        const SizedBox(height: 24),
                        _buildQRScannerButton(),
                        const SizedBox(height: 24),
                        _buildLoginButton(),
                        if (_errorMessage != null) ...[
                          const SizedBox(height: 20),
                          _buildErrorMessage(),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildLogo(double screenHeight) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withOpacity(0.9),
            boxShadow: [
              BoxShadow(
                color: _primaryColor.withOpacity(0.5),
                blurRadius: 20,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Image.asset(
            'assets/images/I_eat_logo.png',
            width: 150,
            fit: BoxFit.contain,
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          "Welcome Back!",
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            letterSpacing: 0.5,
            shadows: [
              Shadow(
                color: Colors.black26,
                blurRadius: 5,
                offset: Offset(0, 2),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.15),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Text(
            "Please login to continue",
            style: TextStyle(
              fontSize: 16,
              color: Colors.white,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCnInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 8),
          child: Text(
            "User ID",
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.white.withOpacity(0.85),
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: TextFormField(
            decoration: InputDecoration(
              hintText: "Enter your User ID",
              hintStyle: TextStyle(color: Colors.grey.shade400),
              filled: true,
              fillColor: _inputFieldColor,
              prefixIcon: Icon(
                Icons.person_outline,
                color: _primaryColor,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: _accentColor, width: 2),
              ),
              contentPadding:
                  const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
            ),
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            style: const TextStyle(fontSize: 16),
            onChanged: (value) {
              setState(() {
                _userCn = int.tryParse(value.trim());
                _errorMessage = null; // Clear error message on input change
              });
            },
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter a User ID';
              }
              return null;
            },
          ),
        ),
      ],
    );
  }

  Widget _buildQRScannerButton() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
        gradient: LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [
            Colors.white.withOpacity(0.9),
            Colors.white.withOpacity(0.9),
          ],
        ),
      ),
      child: ElevatedButton.icon(
        onPressed: _scanQRCode,
        icon: const Icon(Icons.qr_code_scanner, color: Colors.black, size: 24),
        label: const Text(
          "Scan QR Code",
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginButton() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: _primaryColor.withOpacity(0.5),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
        gradient: LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [
            _buttonColor,
            _accentColor,
          ],
        ),
      ),
      child: ElevatedButton(
        onPressed: _handleLogin,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(vertical: 16),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: const Text(
          "LOGIN",
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            letterSpacing: 1.2,
          ),
        ),
      ),
    );
  }

  Widget _buildErrorMessage() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.red.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.error_outline,
            color: Colors.red,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              _errorMessage!,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _scanQRCode() async {
    try {
      print("Opening QR scanner");
      final scannedResult = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => QRScannerScreen(
            onScanned: (value) {
              print("QR value received in callback: $value");
              // Don't pop here - it's handled in the QRScannerScreen
            },
          ),
        ),
      );

      print("Scanner closed, result: $scannedResult");
      if (scannedResult != null) {
        setState(() {
          _scannedCode = scannedResult.toString();
          _errorMessage = null; // Clear error message
        });
        print("Processing QR code: $_scannedCode");

        // Try direct QR login first for more reliability
        bool success = await _directQrLogin();
        if (!success) {
          // Fall back to normal login flow
          await _handleLogin();
        }
      } else {
        print("No QR code scanned or scan was cancelled");
      }
    } catch (e) {
      print("Error in QR scanning: $e");
      setState(() {
        _errorMessage = "Error scanning QR code: $e";
      });
    }
  }

  // Direct QR login method that specifically handles JSON QR codes
  Future<bool> _directQrLogin() async {
    if (_scannedCode == null) return false;

    try {
      // Try to parse the QR code as JSON
      Map<String, dynamic> jsonData;
      try {
        jsonData = json.decode(_scannedCode!);
      } catch (e) {
        print("Not a JSON QR code: $e");
        return false;
      }

      // Check if the JSON has the student_id field
      if (!jsonData.containsKey('student_id')) {
        print("JSON QR code does not contain student_id");
        return false;
      }

      // Get the student_id from the QR JSON
      final studentId = jsonData['student_id'] as int;
      print("Extracted student_id from QR JSON: $studentId");

      // Show loading
      setState(() => isApiCallProcess = true);

      // Check if this student exists in the backend
      print("Directly checking student: $studentId");
      final student = await Student.fetchStudentByStudentId(studentId);

      if (student != null) {
        print("Student found, saving to Hive and navigating");

        // Save student_id in Hive
        Box box;
        if (Hive.isBoxOpen('studentBox')) {
          box = Hive.box('studentBox');
        } else {
          box = await Hive.openBox('studentBox');
        }
        await box.put('student_id', studentId);
        await box.put('is_logged_in', true); // Mark user as logged in
        print("Saved student_id: $studentId");

        // Navigate directly to the main page
        if (mounted) {
          Navigator.of(context).pushReplacementNamed('/home');
          return true;
        }
      } else {
        print("Student not found with ID: $studentId");
        setState(() {
          _errorMessage = "Student not found. Please try again.";
        });
      }
    } catch (e) {
      print("Error in direct QR login: $e");
      setState(() {
        _errorMessage = "Login error: $e";
      });
    } finally {
      setState(() => isApiCallProcess = false);
    }

    return false;
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      return; // If form is not valid, exit
    }

    int? studentId;

    // If we have a scanned code, try to parse it as JSON
    if (_scannedCode != null) {
      try {
        // Try to parse as JSON
        final jsonData = json.decode(_scannedCode!);

        // Check if it contains student_id
        if (jsonData.containsKey('student_id')) {
          studentId = jsonData['student_id'] as int;
          print("Successfully parsed student_id from QR code JSON: $studentId");
        } else {
          // If JSON but no student_id, try to use the input directly
          studentId = int.tryParse(_scannedCode!);
        }
      } catch (e) {
        // If not JSON, try to parse as integer
        studentId = int.tryParse(_scannedCode!);
        print("QR code was not JSON, trying direct parse: $studentId");
      }
    } else {
      // Use manual input if no QR code
      studentId = _userCn;
    }

    if (studentId == null || studentId <= 0) {
      setState(() {
        _errorMessage = "Please enter a valid User ID or scan a valid QR code.";
      });
      return;
    }

    setState(() => isApiCallProcess = true);

    try {
      print("Fetching student data for student_id: $studentId");
      final student = await Student.fetchStudentByStudentId(studentId);

      if (student != null) {
        // Save student_id in Hive
        Box box;
        if (Hive.isBoxOpen('studentBox')) {
          box = Hive.box('studentBox');
        } else {
          box = await Hive.openBox('studentBox');
        }
        await box.put('student_id', student.student_id);
        await box.put('is_logged_in', true); // Mark user as logged in

        print("Saved student_id: ${student.student_id}");
        Navigator.pushReplacementNamed(context, '/home');
      } else {
        setState(() {
          _errorMessage = "Invalid User ID or QR Code. Please try again.";
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = "Error: ${e.toString()}";
      });
      print("Login error: $e");
    } finally {
      setState(() => isApiCallProcess = false);
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Login Error"),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }
}
