import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/books_provider.dart';
import 'providers/locale_provider.dart';
import 'providers/onboarding_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/onboarding_wizard_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MemoriaApp());
}

class MemoriaApp extends StatelessWidget {
  const MemoriaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LocaleProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => BooksProvider()),
        ChangeNotifierProvider(create: (_) => OnboardingProvider()),
      ],
      child: Consumer<LocaleProvider>(
        builder: (context, localeProvider, child) {
          return MaterialApp(
            title: 'Memoria',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            locale: localeProvider.locale,
            supportedLocales: const [
              Locale('fr'),
              Locale('en'),
            ],
            home: const AuthGate(),
          );
        },
      ),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        switch (authProvider.status) {
          case AuthStatus.unknown:
            return const SplashScreen();
          case AuthStatus.authenticated:
            return const OnboardingGate();
          case AuthStatus.unauthenticated:
            return const LoginScreen();
        }
      },
    );
  }
}

class OnboardingGate extends StatefulWidget {
  const OnboardingGate({super.key});

  @override
  State<OnboardingGate> createState() => _OnboardingGateState();
}

class _OnboardingGateState extends State<OnboardingGate> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OnboardingProvider>().checkOnboardingState();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<OnboardingProvider>(
      builder: (context, onboardingProvider, child) {
        if (onboardingProvider.isLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(
                color: AppColors.primary,
              ),
            ),
          );
        }

        if (!onboardingProvider.onboardingCompleted) {
          return OnboardingWizardScreen(
            onComplete: () {
              onboardingProvider.setOnboardingCompleted(true);
              context.read<BooksProvider>().loadBooks();
            },
          );
        }

        return const HomeScreen();
      },
    );
  }
}
