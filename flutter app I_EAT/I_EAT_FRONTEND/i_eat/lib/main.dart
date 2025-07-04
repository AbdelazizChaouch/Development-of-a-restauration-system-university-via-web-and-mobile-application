import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart'; // Import Hive
import 'package:i_eat/PAGES/home_page.dart';
import 'package:i_eat/PAGES/login_page.dart';
import 'package:i_eat/PAGES/menu_page.dart';
import 'package:i_eat/PAGES/ticket_page.dart';
import 'package:i_eat/PAGES/profile_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter(); // Initialize Hive

  await Hive.openBox('studentBox'); // Open a Hive box for student data
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'I·EAT App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0000FF)),
        useMaterial3: true,
        fontFamily: 'Poppins',
      ),
      home: const LoginPage(),
      routes: {
        '/login': (context) => const LoginPage(),
        '/home': (context) => const HomePage(),
        '/menu': (context) => const MenuPage(),
        '/profil': (context) => const ProfilePage(),
        '/other': (context) => const TicketPage(),
      },
    );
  }

  Future<bool> _checkIfLoggedIn() async {
    final box = Hive.box('studentBox');
    final studentId = box.get('student_id');
    final isLoggedIn = box.get('is_logged_in', defaultValue: false);
    // User is logged in if both student_id exists and is_logged_in is true
    return studentId != null && isLoggedIn == true;
  }
}
