import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/locale_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLogin = true;
  final _fullNameController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _fullNameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = context.read<AuthProvider>();
    
    bool success;
    if (_isLogin) {
      success = await authProvider.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
    } else {
      success = await authProvider.register(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        fullName: _fullNameController.text.trim().isEmpty 
            ? null 
            : _fullNameController.text.trim(),
      );
    }

    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error ?? 'Une erreur est survenue'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>();
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => locale.toggleLocale(),
                    child: Text(
                      locale.isFrench ? 'EN' : 'FR',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 40),
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.auto_stories,
                  size: 40,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Memoria',
                style: Theme.of(context).textTheme.displaySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                locale.translate(
                  'Créez des souvenirs inoubliables',
                  'Create unforgettable memories',
                ),
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (!_isLogin) ...[
                      TextFormField(
                        controller: _fullNameController,
                        decoration: InputDecoration(
                          labelText: locale.translate('Nom complet', 'Full name'),
                          prefixIcon: const Icon(Icons.person_outline),
                        ),
                        textCapitalization: TextCapitalization.words,
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _emailController,
                      decoration: InputDecoration(
                        labelText: locale.translate('Email', 'Email'),
                        prefixIcon: const Icon(Icons.email_outlined),
                      ),
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return locale.translate(
                            'Veuillez entrer votre email',
                            'Please enter your email',
                          );
                        }
                        if (!value.contains('@')) {
                          return locale.translate(
                            'Email invalide',
                            'Invalid email',
                          );
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      decoration: InputDecoration(
                        labelText: locale.translate('Mot de passe', 'Password'),
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                      ),
                      obscureText: _obscurePassword,
                      textInputAction: TextInputAction.done,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return locale.translate(
                            'Veuillez entrer votre mot de passe',
                            'Please enter your password',
                          );
                        }
                        if (!_isLogin && value.length < 6) {
                          return locale.translate(
                            'Le mot de passe doit contenir au moins 6 caractères',
                            'Password must be at least 6 characters',
                          );
                        }
                        return null;
                      },
                      onFieldSubmitted: (_) => _submit(),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: authProvider.isLoading ? null : _submit,
                      child: authProvider.isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : Text(
                              _isLogin
                                  ? locale.translate('Se connecter', 'Sign in')
                                  : locale.translate('S\'inscrire', 'Sign up'),
                            ),
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _isLogin = !_isLogin;
                        });
                      },
                      child: Text(
                        _isLogin
                            ? locale.translate(
                                'Pas encore de compte ? S\'inscrire',
                                'No account yet? Sign up',
                              )
                            : locale.translate(
                                'Déjà un compte ? Se connecter',
                                'Already have an account? Sign in',
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
