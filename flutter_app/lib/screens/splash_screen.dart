import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      await context.read<AuthProvider>().checkAuth();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: const Icon(
                Icons.auto_stories,
                size: 60,
                color: AppColors.primary,
              ),
            )
                .animate()
                .fadeIn(duration: 600.ms)
                .scale(delay: 200.ms, duration: 400.ms),
            const SizedBox(height: 32),
            Text(
              'Memoria',
              style: Theme.of(context).textTheme.displayMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
            )
                .animate()
                .fadeIn(delay: 400.ms, duration: 600.ms)
                .slideY(begin: 0.3, end: 0),
            const SizedBox(height: 8),
            Text(
              'Vos souvenirs, pour toujours',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.white.withOpacity(0.9),
                  ),
            )
                .animate()
                .fadeIn(delay: 600.ms, duration: 600.ms),
            const SizedBox(height: 48),
            const CircularProgressIndicator(
              color: Colors.white,
              strokeWidth: 2,
            ).animate().fadeIn(delay: 800.ms, duration: 400.ms),
          ],
        ),
      ),
    );
  }
}
