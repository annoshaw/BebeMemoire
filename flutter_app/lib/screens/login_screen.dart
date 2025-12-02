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
  String _email = '';
  String _password = '';
  String _fullName = '';
  bool _isLogin = true;

  Future<void> _submit() async {
    final authProvider = context.read<AuthProvider>();
    
    bool success;
    if (_isLogin) {
      success = await authProvider.login(
        _email.trim(),
        _password,
      );
    } else {
      success = await authProvider.register(
        email: _email.trim(),
        password: _password,
        fullName: _fullName.trim().isEmpty ? null : _fullName.trim(),
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
                  TextButton.icon(
                    onPressed: () => locale.toggleLocale(),
                    icon: const Icon(Icons.language, size: 20),
                    label: Text(locale.isFrench ? 'EN' : 'FR'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(
                    Icons.auto_stories,
                    size: 40,
                    color: AppColors.primary,
                  ),
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
              
              if (!_isLogin) ...[
                _buildSimpleTextField(
                  label: locale.translate('Nom complet', 'Full name'),
                  icon: Icons.person_outline,
                  onChanged: (v) => setState(() => _fullName = v),
                ),
                const SizedBox(height: 16),
              ],
              
              _buildSimpleTextField(
                label: locale.translate('Email', 'Email'),
                icon: Icons.email_outlined,
                onChanged: (v) => setState(() => _email = v),
              ),
              const SizedBox(height: 16),
              
              _buildSimpleTextField(
                label: locale.translate('Mot de passe', 'Password'),
                icon: Icons.lock_outline,
                isPassword: true,
                onChanged: (v) => setState(() => _password = v),
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
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        _isLogin
                            ? locale.translate('Se connecter', 'Sign in')
                            : locale.translate('S\'inscrire', 'Sign up'),
                      ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _isLogin
                        ? locale.translate('Pas encore de compte ?', 'No account yet?')
                        : locale.translate('Déjà un compte ?', 'Already have an account?'),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _isLogin = !_isLogin;
                      });
                    },
                    child: Text(
                      _isLogin
                          ? locale.translate('S\'inscrire', 'Sign up')
                          : locale.translate('Se connecter', 'Sign in'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSimpleTextField({
    required String label,
    required IconData icon,
    bool isPassword = false,
    required ValueChanged<String> onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Icon(icon, color: AppColors.textSecondary),
          ),
          Expanded(
            child: EditableText(
              controller: TextEditingController(),
              focusNode: FocusNode(),
              style: const TextStyle(
                fontSize: 16,
                color: AppColors.textPrimary,
              ),
              cursorColor: AppColors.primary,
              backgroundCursorColor: AppColors.border,
              onChanged: onChanged,
              obscureText: isPassword,
            ),
          ),
        ],
      ),
    );
  }
}
