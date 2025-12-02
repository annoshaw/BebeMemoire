import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/books_provider.dart';
import 'providers/locale_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

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
            home: Consumer<AuthProvider>(
              builder: (context, authProvider, child) {
                switch (authProvider.status) {
                  case AuthStatus.unknown:
                    return const SplashScreen();
                  case AuthStatus.authenticated:
                    return const HomeScreen();
                  case AuthStatus.unauthenticated:
                    return const LoginScreen();
                }
              },
            ),
          );
        },
      ),
    );
  }
}
