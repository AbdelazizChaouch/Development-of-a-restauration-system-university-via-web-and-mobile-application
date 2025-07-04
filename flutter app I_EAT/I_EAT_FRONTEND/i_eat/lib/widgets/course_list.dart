import 'package:flutter/material.dart';
import 'package:i_eat/widgets/course_card.dart';

class CourseList extends StatelessWidget {
  const CourseList({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        CourseCard(
          courseName: "Introduction to Computer Science",
          courseCode: "CS101",
          instructor: "Dr. John Doe",
          progress: 0.75,
        ),
        const SizedBox(height: 16),
        CourseCard(
          courseName: "Data Structures and Algorithms",
          courseCode: "CS201",
          instructor: "Dr. Jane Smith",
          progress: 0.60,
          baseColor: const Color(0xFF2124F1), // Slightly different blue
        ),
        const SizedBox(height: 16),
        CourseCard(
          courseName: "Database Management Systems",
          courseCode: "CS301",
          instructor: "Prof. Robert Johnson",
          progress: 0.90,
          baseColor: const Color(0xFF0057FF), // Login button blue
        ),
      ],
    );
  }
}
