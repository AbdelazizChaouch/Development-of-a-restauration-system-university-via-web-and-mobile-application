import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:i_eat/data/student.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:i_eat/data/universityCard.dart'; // Import to get balance

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage>
    with TickerProviderStateMixin {
  File? _image;
  late Future<Student?> studentData = _initializeStudentData();
  bool isUploadingImage = false;
  String? uploadErrorMessage;

  // Colors matching login page style
  final Color _primaryColor = const Color(0xFF0000FF);
  final Color _accentColor = const Color(0xFF00C2FF);
  final Color _buttonColor = const Color(0xFF0057FF);

  // Animation controllers
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // Balance info
  double _balance = 0.0;
  bool _loadingBalance = true;

  Future<Student?> _initializeStudentData() async {
    try {
      Box box;
      // Check if box is already open
      if (Hive.isBoxOpen('studentBox')) {
        box = Hive.box('studentBox');
      } else {
        box = await Hive.openBox('studentBox');
      }

      int studentId = box.get('student_id', defaultValue: 0);

      if (studentId != 0) {
        // Also fetch balance
        _fetchBalance(studentId);
        return await Student.fetchStudentByStudentId(studentId);
      }
      return null;
    } catch (e) {
      print('Error initializing student data: $e');
      return null;
    }
  }

  Future<void> _fetchBalance(int studentId) async {
    try {
      final sold = await Student.getSoldAmount(studentId);
      setState(() {
        _balance = sold;
        _loadingBalance = false;
      });
    } catch (e) {
      print('Error fetching balance: $e');
      setState(() {
        _loadingBalance = false;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _slideController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _fadeController,
        curve: Curves.easeOut,
      ),
    );

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _slideController,
        curve: Curves.easeOutQuint,
      ),
    );

    _fadeController.forward();
    _slideController.forward();
  }

  Future<void> _fetchStudentData() async {
    setState(() {
      studentData = _initializeStudentData();
      uploadErrorMessage = null;
    });
  }

  Future<void> _pickImage(Student student) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80, // Reduce quality to keep file size manageable
    );

    if (pickedFile != null) {
      final imageFile = File(pickedFile.path);

      setState(() {
        _image = imageFile;
        isUploadingImage = true;
        uploadErrorMessage = null;
      });

      try {
        // Upload image to server
        final success =
            await Student.uploadProfileImage(student.student_id, imageFile);

        if (success) {
          // Refresh student data to get updated profile image URL
          await _fetchStudentData();

          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Profile image updated successfully'),
            backgroundColor: Colors.green,
          ));
        } else {
          setState(() {
            uploadErrorMessage = 'Failed to upload image to server';
          });
        }
      } catch (e) {
        setState(() {
          uploadErrorMessage = 'Error: ${e.toString()}';
        });
        print('Error uploading image: $e');
      } finally {
        setState(() {
          isUploadingImage = false;
        });
      }
    }
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
          child: FutureBuilder<Student?>(
            future: studentData,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return _buildLoadingState();
              } else if (snapshot.hasError) {
                return _buildErrorState(snapshot.error);
              } else if (!snapshot.hasData || snapshot.data == null) {
                return _buildNoDataState();
              }

              final student = snapshot.data!;
              return RefreshIndicator(
                color: _buttonColor,
                onRefresh: () async {
                  await _fetchStudentData();
                },
                child: CustomScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  slivers: [
                    _buildAppBar(),
                    SliverToBoxAdapter(
                      child: AnimatedBuilder(
                        animation: _slideController,
                        builder: (context, child) {
                          return FadeTransition(
                            opacity: _fadeAnimation,
                            child: SlideTransition(
                              position: _slideAnimation,
                              child: child,
                            ),
                          );
                        },
                        child: _buildProfileContent(student),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      expandedHeight: 120,
      floating: false,
      pinned: true,
      backgroundColor: Colors.transparent,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        title: Text(
          'My Profile',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 22,
            shadows: [
              Shadow(
                color: Colors.black26,
                blurRadius: 5,
                offset: const Offset(0, 2),
              ),
            ],
          ),
        ),
        centerTitle: true,
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.2),
                Colors.transparent,
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProfileContent(Student student) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          // Profile Picture and Quick Stats
          _buildProfileHeader(student),

          const SizedBox(height: 32),

          // Balance Card
          _buildBalanceCard(),

          const SizedBox(height: 24),

          // Personal Information
          _buildInfoCard(
            'Personal Information',
            [
              _buildInfoRow(Icons.person, 'Full Name', student.full_name),
              _buildInfoRow(
                  Icons.badge, 'Student ID', student.student_id.toString()),
              _buildInfoRow(Icons.school, 'University',
                  student.university_description ?? 'Unknown'),
            ],
          ),

          const SizedBox(height: 24),

          // Actions
          _buildActionButtons(),
        ],
      ),
    );
  }

  Widget _buildProfileHeader(Student student) {
    return Stack(
      alignment: Alignment.center,
      clipBehavior: Clip.none,
      children: [
        // Background Element
        Positioned(
          top: -20,
          right: -20,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.1),
            ),
          ),
        ),

        Column(
          children: [
            // Profile Picture
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.white,
                        _accentColor.withOpacity(0.5),
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 15,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: CircleAvatar(
                    radius: 60,
                    backgroundColor: Colors.white.withOpacity(0.9),
                    child: isUploadingImage
                        ? CircularProgressIndicator(
                            color: _primaryColor,
                            strokeWidth: 3,
                          )
                        : _image != null
                            ? ClipOval(
                                child: Image.file(
                                  _image!,
                                  width: 120,
                                  height: 120,
                                  fit: BoxFit.cover,
                                ),
                              )
                            : student.profile_image != null
                                ? ClipOval(
                                    child: Image.network(
                                      'http://192.168.1.22:3000/images/${student.profile_image}',
                                      width: 120,
                                      height: 120,
                                      fit: BoxFit.cover,
                                      errorBuilder:
                                          (context, error, stackTrace) {
                                        return Icon(
                                          Icons.person,
                                          size: 60,
                                          color: _primaryColor.withOpacity(0.7),
                                        );
                                      },
                                      loadingBuilder:
                                          (context, child, loadingProgress) {
                                        if (loadingProgress == null) {
                                          return child;
                                        }
                                        return CircularProgressIndicator(
                                          color: _primaryColor,
                                          value: loadingProgress
                                                      .expectedTotalBytes !=
                                                  null
                                              ? loadingProgress
                                                      .cumulativeBytesLoaded /
                                                  loadingProgress
                                                      .expectedTotalBytes!
                                              : null,
                                        );
                                      },
                                    ),
                                  )
                                : Icon(
                                    Icons.person,
                                    size: 60,
                                    color: _primaryColor.withOpacity(0.7),
                                  ),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: -5,
                  child: GestureDetector(
                    onTap: () => _pickImage(student),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            _buttonColor,
                            _accentColor,
                          ],
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 5,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.camera_alt,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Display error message if upload fails
            if (uploadErrorMessage != null) ...[
              const SizedBox(height: 12),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Colors.red.withOpacity(0.5),
                    width: 1,
                  ),
                ),
                child: Text(
                  uploadErrorMessage!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],

            const SizedBox(height: 16),

            // Name and ID Badge
            Text(
              student.full_name,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                letterSpacing: 0.5,
                shadows: [
                  Shadow(
                    color: Colors.black26,
                    blurRadius: 3,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBalanceCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white.withOpacity(0.15),
            Colors.white.withOpacity(0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            spreadRadius: 0,
          ),
        ],
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.account_balance_wallet,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Text(
                    'Current Balance',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(30),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.sync,
                      color: Colors.white,
                      size: 14,
                    ),
                    SizedBox(width: 4),
                    Text(
                      'Updated',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _loadingBalance
              ? Container(
                  height: 40,
                  alignment: Alignment.center,
                  child: const CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 3,
                  ),
                )
              : Center(
                  child: Column(
                    children: [
                      Text(
                        '${_balance.toStringAsFixed(3)} DT',
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Available',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            spreadRadius: 0,
          ),
        ],
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.person_pin,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 14,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        _buildGradientButton(
          icon: Icons.logout,
          label: 'Logout',
          gradient: LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: [
              Colors.red.shade800,
              Colors.red.shade500,
            ],
          ),
          onPressed: () async {
            // Clear saved data
            Box box;
            if (Hive.isBoxOpen('studentBox')) {
              box = Hive.box('studentBox');
            } else {
              box = await Hive.openBox('studentBox');
            }
            await box.put('is_logged_in', false); // Set logged out state
            await box.clear();

            // Navigate to login page
            if (context.mounted) {
              Navigator.of(context)
                  .pushNamedAndRemoveUntil('/login', (route) => false);
            }
          },
        ),
      ],
    );
  }

  Widget _buildGradientButton({
    required IconData icon,
    required String label,
    required Gradient gradient,
    required VoidCallback onPressed,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: gradient,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, color: Colors.white, size: 20),
        label: Text(
          label,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
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
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const CircularProgressIndicator(
              color: Colors.white,
              strokeWidth: 3,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Loading profile...',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(Object? error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline,
                color: Colors.white,
                size: 48,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Error Loading Profile',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error?.toString() ?? 'Unknown error',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            _buildGradientButton(
              icon: Icons.refresh,
              label: 'Try Again',
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  _buttonColor,
                  _accentColor,
                ],
              ),
              onPressed: _fetchStudentData,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoDataState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.person_off,
                color: Colors.white.withOpacity(0.8),
                size: 48,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Profile Not Found',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Unable to find your student profile',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            _buildGradientButton(
              icon: Icons.login,
              label: 'Return to Login',
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  _buttonColor,
                  _accentColor,
                ],
              ),
              onPressed: () {
                Navigator.of(context)
                    .pushNamedAndRemoveUntil('/login', (route) => false);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    // Safely close the box only if it's open
    if (Hive.isBoxOpen('studentBox')) {
      Hive.box('studentBox').close();
    }
    super.dispose();
  }
}
