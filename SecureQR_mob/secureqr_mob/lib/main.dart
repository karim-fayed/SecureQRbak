import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'providers/auth_provider.dart';
import 'providers/qr_provider.dart';
import 'providers/sync_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/settings_screen.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize API service with stored server URL
  final apiService = ApiService();
  await apiService.initializeServerUrl();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => QRProvider()),
        ChangeNotifierProvider(create: (_) => SyncProvider()),
      ],
      child: MaterialApp.router(
        title: 'SecureQR Mobile',
        theme: ThemeData(
          primaryColor: const Color(0xFF2563EB),
          scaffoldBackgroundColor: Colors.grey[50],
          fontFamily: 'Roboto',
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF2563EB),
            foregroundColor: Colors.white,
            elevation: 0,
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            focusedBorder: const OutlineInputBorder(
              borderSide: BorderSide(color: Color(0xFF2563EB), width: 2),
              borderRadius: BorderRadius.all(Radius.circular(12)),
            ),
          ),
        ),
        routerConfig: _router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

final GoRouter _router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      redirect: (context, state) => '/login',
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const DashboardScreen(),
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsScreen(),
    ),
  ],
  redirect: (context, state) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final isAuthenticated = authProvider.isAuthenticated;
    final isLoginRoute = state.matchedLocation == '/login';

    if (!isAuthenticated && !isLoginRoute) {
      return '/login';
    }

    if (isAuthenticated && isLoginRoute) {
      return '/dashboard';
    }

    return null;
  },
);
