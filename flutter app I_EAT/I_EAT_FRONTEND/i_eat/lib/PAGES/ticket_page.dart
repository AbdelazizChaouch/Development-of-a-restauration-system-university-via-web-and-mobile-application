import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive/hive.dart';
import 'package:i_eat/data/ticket.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'dart:math' as math;

class TicketPage extends StatefulWidget {
  const TicketPage({super.key});

  @override
  _TicketPageState createState() => _TicketPageState();
}

class _TicketPageState extends State<TicketPage> with TickerProviderStateMixin {
  List<Ticket> tickets = [];
  List<Ticket> ensuedTickets = [];
  List<Ticket> usedTickets = [];
  bool isLoading = true;
  String? errorMessage;
  Box? studentBox;

  // Color scheme matching login page
  final Color _primaryColor = const Color(0xFF0000FF);
  final Color _accentColor = const Color(0xFF00C2FF);
  final Color _buttonColor = const Color(0xFF0057FF);

  // Animation controllers
  late AnimationController _fadeController;
  late AnimationController _rotationController;
  late AnimationController _slideController;
  late TabController _tabController;
  late Animation<Offset> _slideAnimation;

  final GlobalKey<RefreshIndicatorState> _refreshIndicatorKey =
      GlobalKey<RefreshIndicatorState>();

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('en_US', null);
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _rotationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _tabController = TabController(length: 2, vsync: this);

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _slideController,
        curve: Curves.easeOutQuint,
      ),
    );

    _initializeHive();
    _slideController.forward();
  }

  Future<void> _initializeHive() async {
    try {
      if (Hive.isBoxOpen('studentBox')) {
        studentBox = Hive.box('studentBox');
      } else {
        studentBox = await Hive.openBox('studentBox');
      }
      await _loadTickets();
    } catch (e) {
      print('Error initializing Hive: $e');
      setState(() {
        errorMessage = 'Storage initialization failed';
        isLoading = false;
      });
    }
  }

  Future<void> _loadTickets() async {
    if (!mounted) return;

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    // Start rotation animation for loading effect
    _rotationController.repeat();

    try {
      print("Started loading tickets");
      int? studentId = studentBox?.get('student_id');

      if (studentId == null) {
        throw Exception('Student ID not found');
      }

      print("Fetching tickets for student ID: $studentId");
      final fetchedTickets = await Ticket.fetchTicketsByStudentId(studentId);
      print("Received ${fetchedTickets.length} tickets from API");

      if (!mounted) return;

      setState(() {
        tickets = fetchedTickets;
        ensuedTickets = fetchedTickets.where((ticket) => !ticket.used).toList();
        usedTickets = fetchedTickets.where((ticket) => ticket.used).toList();

        print("Found ${ensuedTickets.length} ensued tickets");
        print("Found ${usedTickets.length} used tickets");
        isLoading = false;
      });

      // Stop rotation animation when done
      _rotationController.stop();
      _rotationController.reset();
    } catch (e) {
      print('Error loading tickets: $e');
      if (!mounted) return;

      setState(() {
        errorMessage = 'Failed to load tickets: $e';
        isLoading = false;
      });

      // Stop rotation animation when error
      _rotationController.stop();
      _rotationController.reset();
    }
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _rotationController.dispose();
    _slideController.dispose();
    _tabController.dispose();
    if (studentBox != null && Hive.isBoxOpen('studentBox')) {
      studentBox!.close();
    }
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
        child: RefreshIndicator(
          key: _refreshIndicatorKey,
          color: Colors.white,
          backgroundColor: _buttonColor,
          onRefresh: _loadTickets,
          child: SafeArea(
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                // Modern app bar with blue gradient and shadow
                SliverAppBar(
                  expandedHeight: 150.0,
                  floating: false,
                  pinned: true,
                  centerTitle: true,
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  flexibleSpace: FlexibleSpaceBar(
                    titlePadding: const EdgeInsets.only(bottom: 16),
                    centerTitle: true,
                    title: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      child: Container(
                        key: ValueKey<String>("title"),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20.0, vertical: 6.0),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.2),
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black26,
                              blurRadius: 3,
                              offset: Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.confirmation_number_rounded,
                              color: Colors.white,
                              size: 22,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'My Tickets',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 20,
                                letterSpacing: 0.5,
                                shadows: [
                                  Shadow(
                                    color: Colors.black26,
                                    blurRadius: 3,
                                    offset: Offset(0, 1),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
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
                      child: Center(
                        child: AnimatedBuilder(
                          animation: _rotationController,
                          builder: (context, child) {
                            return Transform.rotate(
                              angle: isLoading
                                  ? _rotationController.value * 2 * math.pi
                                  : 0,
                              child: Icon(
                                Icons.confirmation_number_rounded,
                                size: 80,
                                color: Colors.white.withOpacity(0.2),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                ),

                // Tab bar for switching between Today's Tickets and All Tickets
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _SliverTabBarDelegate(
                    TabBar(
                      controller: _tabController,
                      indicatorColor: Colors.white,
                      indicatorWeight: 3,
                      indicatorSize: TabBarIndicatorSize.label,
                      labelColor: Colors.white,
                      unselectedLabelColor: Colors.white.withOpacity(0.6),
                      tabs: [
                        Tab(
                          icon: Icon(Icons.confirmation_num_rounded),
                          text: "Ensued Tickets",
                        ),
                        Tab(
                          icon: Icon(Icons.check_circle_rounded),
                          text: "Used Tickets",
                        ),
                      ],
                    ),
                    color: _primaryColor.withOpacity(0.8),
                  ),
                ),

                // Tab content
                SliverFillRemaining(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      // Ensued Tickets tab
                      _buildEnsuedTicketsTab(),

                      // Used Tickets tab
                      _buildUsedTicketsTab(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Tab content for Ensued Tickets
  Widget _buildEnsuedTicketsTab() {
    if (isLoading) {
      return _buildLoadingIndicator();
    } else if (errorMessage != null) {
      return _buildErrorMessage();
    } else if (ensuedTickets.isEmpty) {
      return _buildEmptyState(
        icon: Icons.event_busy,
        title: 'No ensued tickets',
        subtitle: 'All your tickets have been used',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: ensuedTickets.length,
      itemBuilder: (context, index) {
        return _buildEnhancedTicketCard(
          context,
          ensuedTickets[index],
          isEnsued: true,
          index: index,
        );
      },
    );
  }

  // Tab content for Used Tickets
  Widget _buildUsedTicketsTab() {
    if (isLoading) {
      return _buildLoadingIndicator();
    } else if (errorMessage != null) {
      return _buildErrorMessage();
    } else if (usedTickets.isEmpty) {
      return _buildEmptyState(
        icon: Icons.confirmation_number_outlined,
        title: 'No used tickets',
        subtitle: 'You haven\'t used any tickets yet',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: usedTickets.length,
      itemBuilder: (context, index) {
        return _buildEnhancedTicketCard(
          context,
          usedTickets[index],
          index: index,
        );
      },
    );
  }

  Widget _buildLoadingIndicator() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedBuilder(
            animation: _rotationController,
            builder: (context, child) {
              return Transform.rotate(
                angle: _rotationController.value * 2 * math.pi,
                child: Container(
                  width: 70,
                  height: 70,
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white.withOpacity(0.2),
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 10,
                        spreadRadius: 0,
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.confirmation_number_rounded,
                    color: Colors.white,
                    size: 30,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 24),
          Text(
            'Loading your tickets...',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Please wait a moment',
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorMessage() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.red.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Icon(
                Icons.error_outline_rounded,
                color: Colors.white,
                size: 40,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Oops, something went wrong!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              errorMessage!,
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    Colors.red.shade600,
                    Colors.red.shade400,
                  ],
                ),
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: ElevatedButton.icon(
                onPressed: () async {
                  _refreshIndicatorKey.currentState?.show();
                },
                icon: Icon(Icons.refresh_rounded),
                label: Text('Try Again'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  foregroundColor: Colors.white,
                  shadowColor: Colors.transparent,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState({IconData? icon, String? title, String? subtitle}) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white.withOpacity(0.2),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    spreadRadius: 0,
                  ),
                ],
              ),
              child: Icon(
                icon ?? Icons.confirmation_number_outlined,
                size: 50,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title ?? 'No tickets found',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              subtitle ?? 'Buy a meal to start',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEnhancedTicketCard(BuildContext context, Ticket ticket,
      {bool isEnsued = false, required int index}) {
    // Determine card colors based on ticket type and usage status
    final Color baseColor = ticket.used ? Colors.grey : Colors.white;

    return AnimatedBuilder(
      animation: _fadeController,
      builder: (context, child) {
        return SlideTransition(
          position: _slideAnimation,
          child: TweenAnimationBuilder<double>(
            tween: Tween<double>(begin: 0.0, end: 1.0),
            duration: Duration(milliseconds: 300 + (index * 100)),
            curve: Curves.easeOutCubic,
            builder: (context, value, child) {
              return Transform.translate(
                offset: Offset(0, 20 * (1 - value)),
                child: Opacity(
                  opacity: value,
                  child: child,
                ),
              );
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: ticket.used
                      ? Colors.white.withOpacity(0.1)
                      : Colors.white.withOpacity(0.25),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(24),
                  onTap: () => _showTicketDetails(context, ticket),
                  splashColor: Colors.white.withOpacity(0.1),
                  highlightColor: Colors.white.withOpacity(0.05),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: Container(
                      child: Column(
                        children: [
                          // Ticket header
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: ticket.used
                                  ? Colors.white.withOpacity(0.05)
                                  : Colors.white.withOpacity(0.2),
                              border: Border(
                                bottom: BorderSide(
                                  color: ticket.used
                                      ? Colors.white.withOpacity(0.05)
                                      : Colors.white.withOpacity(0.1),
                                  width: 1,
                                ),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 18,
                                      backgroundColor: ticket.used
                                          ? Colors.white.withOpacity(0.1)
                                          : _buttonColor.withOpacity(0.6),
                                      child: Text(
                                        ticket.getShortCode(),
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      ticket.orderType,
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: Colors.white.withOpacity(0.2),
                                      width: 1,
                                    ),
                                  ),
                                  child: Text(
                                    ticket.formattedPrice,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Ticket divider with notches - perforated style
                          Stack(
                            children: [
                              Container(
                                height: 1,
                                color: Colors.white.withOpacity(0.2),
                              ),
                              Row(
                                children: List.generate(
                                  30,
                                  (i) => Expanded(
                                    child: Container(
                                      height: 4,
                                      margin: const EdgeInsets.symmetric(
                                          horizontal: 2),
                                      decoration: BoxDecoration(
                                        color: i.isEven
                                            ? Colors.white.withOpacity(0.1)
                                            : Colors.transparent,
                                        borderRadius: BorderRadius.circular(1),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),

                          // Ticket body
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Left side - Date and status
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.calendar_today_rounded,
                                            size: 14,
                                            color:
                                                Colors.white.withOpacity(0.9),
                                          ),
                                          const SizedBox(width: 6),
                                          Flexible(
                                            child: Text(
                                              ticket.formattedDate,
                                              style: TextStyle(
                                                fontSize: 14,
                                                color: Colors.white
                                                    .withOpacity(0.9),
                                                fontWeight: FontWeight.w500,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.access_time_rounded,
                                            size: 14,
                                            color:
                                                Colors.white.withOpacity(0.9),
                                          ),
                                          const SizedBox(width: 6),
                                          Flexible(
                                            child: Text(
                                              ticket.formattedTime,
                                              style: TextStyle(
                                                fontSize: 14,
                                                color: Colors.white
                                                    .withOpacity(0.9),
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 4,
                                        ),
                                        decoration: BoxDecoration(
                                          color: ticket.used
                                              ? Colors.grey.withOpacity(0.2)
                                              : _buttonColor.withOpacity(0.4),
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          border: Border.all(
                                            color: ticket.used
                                                ? Colors.white.withOpacity(0.1)
                                                : Colors.white.withOpacity(0.2),
                                            width: 1,
                                          ),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              ticket.used
                                                  ? Icons.check_circle_outline
                                                  : Icons
                                                      .radio_button_unchecked,
                                              size: 14,
                                              color: Colors.white,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              ticket.used ? 'Used' : 'Valid',
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                // QR Code preview
                                Container(
                                  width: 70,
                                  height: 70,
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.1),
                                        blurRadius: 10,
                                        spreadRadius: 0,
                                      ),
                                    ],
                                  ),
                                  child: ticket.generateQRCode(size: 60),
                                ),
                              ],
                            ),
                          ),

                          // Ticket footer
                          if (isEnsued)
                            Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: ticket.used
                                    ? Colors.white.withOpacity(0.05)
                                    : _buttonColor.withOpacity(0.4),
                                borderRadius: const BorderRadius.only(
                                  bottomLeft: Radius.circular(24),
                                  bottomRight: Radius.circular(24),
                                ),
                              ),
                              child: Center(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.confirmation_num_rounded,
                                      size: 14,
                                      color: Colors.white,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      "Ensued Ticket",
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _showTicketDetails(BuildContext context, Ticket ticket) {
    final bool isUsed = ticket.used;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                _primaryColor,
                _accentColor,
              ],
            ),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(30),
              topRight: Radius.circular(30),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black26,
                blurRadius: 10,
                spreadRadius: 0,
                offset: const Offset(0, -1),
              ),
            ],
          ),
          child: Column(
            children: [
              // Handle indicator
              Container(
                width: 50,
                height: 5,
                margin: const EdgeInsets.only(top: 16, bottom: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.confirmation_number_rounded,
                      color: Colors.white,
                      size: 24,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Ticket Details',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        shadows: [
                          Shadow(
                            color: Colors.black26,
                            blurRadius: 3,
                            offset: Offset(0, 1),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Used status badge if applicable
              if (isUsed)
                Container(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.2),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.check_circle_outline,
                        color: Colors.white,
                        size: 18,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        "This ticket has been used",
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),

              // QR Code
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      // Meal type banner
                      Container(
                        margin: const EdgeInsets.only(bottom: 24),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.2),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          ticket.orderType,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),

                      // QR Code with styled container
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 15,
                              spreadRadius: 5,
                            ),
                          ],
                          border: Border.all(
                            color: Colors.white.withOpacity(0.3),
                            width: 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            if (isUsed)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 6,
                                ),
                                margin: const EdgeInsets.only(bottom: 16),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade50,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  "This ticket cannot be scanned again",
                                  style: TextStyle(
                                    color: Colors.red.shade400,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ticket.generateQRCode(size: 250),
                            const SizedBox(height: 16),
                            Text(
                              'Scan this QR code at the cafeteria',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Ticket Details Card
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.2),
                            width: 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            _buildTicketDetailRow(
                              label: 'Ticket ID',
                              value: '#${ticket.ticketId}',
                              icon: Icons.confirmation_number_rounded,
                              isUsed: isUsed,
                            ),
                            Divider(
                                height: 24,
                                color: Colors.white.withOpacity(0.2)),
                            _buildTicketDetailRow(
                              label: 'Date',
                              value: ticket.formattedDate,
                              icon: Icons.calendar_today_rounded,
                              isUsed: isUsed,
                            ),
                            Divider(
                                height: 24,
                                color: Colors.white.withOpacity(0.2)),
                            _buildTicketDetailRow(
                              label: 'Time',
                              value: ticket.formattedTime,
                              icon: Icons.access_time_rounded,
                              isUsed: isUsed,
                            ),
                            Divider(
                                height: 24,
                                color: Colors.white.withOpacity(0.2)),
                            _buildTicketDetailRow(
                              label: 'Type',
                              value: ticket.orderType,
                              icon: Icons.restaurant_menu_rounded,
                              isUsed: isUsed,
                            ),
                            Divider(
                                height: 24,
                                color: Colors.white.withOpacity(0.2)),
                            _buildTicketDetailRow(
                              label: 'Price',
                              value: ticket.formattedPrice,
                              icon: Icons.paid_rounded,
                              isUsed: isUsed,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Bottom action buttons
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    if (!isUsed)
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                              colors: [
                                Colors.green.shade600,
                                Colors.green.shade400,
                              ],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 10,
                                offset: const Offset(0, 5),
                              ),
                            ],
                          ),
                          child: ElevatedButton.icon(
                            onPressed: () => _scanQRCode(context, ticket),
                            icon: Icon(Icons.qr_code_scanner_rounded),
                            label: Text('Scan QR'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              foregroundColor: Colors.white,
                              shadowColor: Colors.transparent,
                              padding: const EdgeInsets.symmetric(
                                vertical: 16,
                              ),
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                            ),
                          ),
                        ),
                      ),
                    if (!isUsed) const SizedBox(width: 12),
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                            colors: [
                              isUsed ? Colors.grey : _buttonColor,
                              isUsed ? Colors.grey.shade400 : _accentColor,
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 10,
                              offset: const Offset(0, 5),
                            ),
                          ],
                        ),
                        child: ElevatedButton.icon(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: Icon(Icons.close_rounded),
                          label: Text('Close'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            foregroundColor: Colors.white,
                            shadowColor: Colors.transparent,
                            padding: const EdgeInsets.symmetric(
                              vertical: 16,
                            ),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // Build a row for ticket details
  Widget _buildTicketDetailRow({
    required String label,
    required String value,
    required IconData icon,
    required bool isUsed,
  }) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Icon(
              icon,
              size: 18,
              color: Colors.white,
            ),
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
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.7),
                ),
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Scan QR code
  Future<void> _scanQRCode(BuildContext context, Ticket ticket) async {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => QRScannerPage(
          onScanSuccess: (String scannedData) async {
            if (scannedData == ticket.qrData) {
              // Show loading indicator
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (BuildContext context) {
                  return AlertDialog(
                    content: Row(
                      children: [
                        CircularProgressIndicator(
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: 16),
                        Text("Validating ticket..."),
                      ],
                    ),
                  );
                },
              );

              bool success = await Ticket.markTicketAsUsed(ticket.ticketId);

              // Close loading indicator
              Navigator.of(context).pop();

              if (success) {
                showDialog(
                  context: context,
                  builder: (BuildContext context) {
                    return AlertDialog(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      content: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.check_circle_outline,
                              color: Colors.green,
                              size: 50,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Ticket Validated!',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Your ticket has been used successfully',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                      actions: [
                        TextButton(
                          onPressed: () {
                            Navigator.of(context).pop();
                            _loadTickets(); // Refresh tickets list
                          },
                          child: Text('OK'),
                        ),
                      ],
                    );
                  },
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Failed to mark ticket as used'),
                    behavior: SnackBarBehavior.floating,
                    backgroundColor: Colors.red,
                  ),
                );
              }
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Invalid QR code'),
                  behavior: SnackBarBehavior.floating,
                  backgroundColor: Colors.red,
                ),
              );
            }
            Navigator.of(context).pop(); // Close scanner
          },
        ),
      ),
    );
  }
}

// Helper class for TabBar delegate
class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  final Color color;

  _SliverTabBarDelegate(this.tabBar, {this.color = Colors.white});

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      decoration: BoxDecoration(
        color: color,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            spreadRadius: 0,
          ),
        ],
      ),
      child: tabBar,
    );
  }

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return tabBar != oldDelegate.tabBar;
  }
}

// Modern QR Scanner Page
class QRScannerPage extends StatefulWidget {
  final Function(String) onScanSuccess;

  const QRScannerPage({super.key, required this.onScanSuccess});

  @override
  State<QRScannerPage> createState() => _QRScannerPageState();
}

class _QRScannerPageState extends State<QRScannerPage>
    with SingleTickerProviderStateMixin {
  MobileScannerController controller = MobileScannerController();
  bool hasScanned = false;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  final Color _primaryColor = const Color(0xFF0000FF);
  final Color _accentColor = const Color(0xFF00C2FF);

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    controller.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Scan QR Code'),
        backgroundColor: _primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: (capture) {
              final List<Barcode> barcodes = capture.barcodes;
              if (!hasScanned &&
                  barcodes.isNotEmpty &&
                  barcodes.first.rawValue != null) {
                setState(() {
                  hasScanned = true;
                });

                // Haptic feedback
                HapticFeedback.mediumImpact();

                widget.onScanSuccess(barcodes.first.rawValue!);
              }
            },
          ),

          // Animated scanner overlay
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return CustomPaint(
                painter: EnhancedScannerOverlay(
                  pulseValue: _pulseAnimation.value,
                  primaryColor: _accentColor,
                ),
                child: SizedBox(
                  width: MediaQuery.of(context).size.width,
                  height: MediaQuery.of(context).size.height,
                ),
              );
            },
          ),

          // Bottom instructions
          Positioned(
            bottom: 50,
            left: 20,
            right: 20,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(
                    color: _accentColor.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.info_outline_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                    const SizedBox(width: 10),
                    Flexible(
                      child: Text(
                        'Position QR code within the frame',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Enhanced scanner overlay with animation
class EnhancedScannerOverlay extends CustomPainter {
  final double pulseValue;
  final Color primaryColor;

  EnhancedScannerOverlay({
    required this.pulseValue,
    required this.primaryColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final double scanAreaSize = 280;
    final Rect outerRect = Rect.fromLTWH(0, 0, size.width, size.height);

    // Calculate center position
    final double centerX = size.width / 2;
    final double centerY = size.height / 2;

    // Create scan area rect
    final Rect innerRect = Rect.fromCenter(
      center: Offset(centerX, centerY),
      width: scanAreaSize,
      height: scanAreaSize,
    );

    // Draw the semi-transparent overlay outside the scan area
    Path path = Path()
      ..addRect(outerRect)
      ..addRect(innerRect);

    canvas.drawPath(
      path,
      Paint()
        ..color = Colors.black.withOpacity(0.6)
        ..blendMode = BlendMode.srcOut,
    );

    // Draw animated scan line
    final scanLinePaint = Paint()
      ..color = primaryColor.withOpacity(0.8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    final scanLineY =
        innerRect.top + innerRect.height * (0.1 + pulseValue * 0.8);

    canvas.drawLine(
      Offset(innerRect.left + 10, scanLineY),
      Offset(innerRect.right - 10, scanLineY),
      scanLinePaint,
    );

    // Draw corner markers
    final cornerPaint = Paint()
      ..color = primaryColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5;

    // Top left corner
    canvas.drawLine(
      innerRect.topLeft,
      Offset(innerRect.left + 30, innerRect.top),
      cornerPaint,
    );
    canvas.drawLine(
      innerRect.topLeft,
      Offset(innerRect.left, innerRect.top + 30),
      cornerPaint,
    );

    // Top right corner
    canvas.drawLine(
      Offset(innerRect.right, innerRect.top),
      Offset(innerRect.right - 30, innerRect.top),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(innerRect.right, innerRect.top),
      Offset(innerRect.right, innerRect.top + 30),
      cornerPaint,
    );

    // Bottom left corner
    canvas.drawLine(
      Offset(innerRect.left, innerRect.bottom),
      Offset(innerRect.left + 30, innerRect.bottom),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(innerRect.left, innerRect.bottom),
      Offset(innerRect.left, innerRect.bottom - 30),
      cornerPaint,
    );

    // Bottom right corner
    canvas.drawLine(
      innerRect.bottomRight,
      Offset(innerRect.right - 30, innerRect.bottom),
      cornerPaint,
    );
    canvas.drawLine(
      innerRect.bottomRight,
      Offset(innerRect.right, innerRect.bottom - 30),
      cornerPaint,
    );

    // Draw pulse effect around scan area
    final pulsePaint = Paint()
      ..color = primaryColor.withOpacity(0.1 * pulseValue)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    canvas.drawRect(
      Rect.fromCenter(
        center: Offset(centerX, centerY),
        width: scanAreaSize + 20 * pulseValue,
        height: scanAreaSize + 20 * pulseValue,
      ),
      pulsePaint,
    );
  }

  @override
  bool shouldRepaint(covariant EnhancedScannerOverlay oldDelegate) {
    return oldDelegate.pulseValue != pulseValue;
  }
}
