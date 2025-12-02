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
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  
  String? _selectedGender;
  String? _selectedCountry;
  bool _isLogin = true;

  final List<Map<String, String>> _genderOptions = [
    {'value': 'female', 'labelFr': 'Femme', 'labelEn': 'Female'},
    {'value': 'male', 'labelFr': 'Homme', 'labelEn': 'Male'},
    {'value': 'other', 'labelFr': 'Autre', 'labelEn': 'Other'},
    {'value': 'prefer_not_to_say', 'labelFr': 'Préfère ne pas dire', 'labelEn': 'Prefer not to say'},
  ];

  final List<Map<String, String>> _countryOptions = [
    {'value': 'CA', 'labelFr': 'Canada', 'labelEn': 'Canada'},
    {'value': 'FR', 'labelFr': 'France', 'labelEn': 'France'},
    {'value': 'BE', 'labelFr': 'Belgique', 'labelEn': 'Belgium'},
    {'value': 'CH', 'labelFr': 'Suisse', 'labelEn': 'Switzerland'},
    {'value': 'US', 'labelFr': 'États-Unis', 'labelEn': 'United States'},
    {'value': 'UK', 'labelFr': 'Royaume-Uni', 'labelEn': 'United Kingdom'},
    {'value': 'DE', 'labelFr': 'Allemagne', 'labelEn': 'Germany'},
    {'value': 'other', 'labelFr': 'Autre', 'labelEn': 'Other'},
  ];

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _fullNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
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
        fullName: _fullNameController.text.trim().isEmpty ? null : _fullNameController.text.trim(),
        gender: _selectedGender,
        country: _selectedCountry,
        phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
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
              const SizedBox(height: 20),
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
              const SizedBox(height: 10),
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
              const SizedBox(height: 32),
              
              if (!_isLogin) ...[
                _buildInputField(
                  controller: _fullNameController,
                  label: locale.translate('Nom complet', 'Full name'),
                  icon: Icons.person_outline,
                ),
                const SizedBox(height: 16),
              ],
              
              _buildInputField(
                controller: _emailController,
                label: locale.translate('Email', 'Email'),
                icon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              
              _buildInputField(
                controller: _passwordController,
                label: locale.translate('Mot de passe', 'Password'),
                icon: Icons.lock_outline,
                isPassword: true,
              ),
              
              if (!_isLogin) ...[
                const SizedBox(height: 16),
                _buildInputField(
                  controller: _phoneController,
                  label: locale.translate('Téléphone (optionnel)', 'Phone (optional)'),
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),
                _buildDropdown(
                  value: _selectedGender,
                  hint: locale.translate('Genre (optionnel)', 'Gender (optional)'),
                  icon: Icons.person_outline,
                  items: _genderOptions,
                  isFrench: locale.isFrench,
                  onChanged: (value) => setState(() => _selectedGender = value),
                ),
                const SizedBox(height: 16),
                _buildDropdown(
                  value: _selectedCountry,
                  hint: locale.translate('Pays', 'Country'),
                  icon: Icons.public,
                  items: _countryOptions,
                  isFrench: locale.isFrench,
                  onChanged: (value) => setState(() => _selectedCountry = value),
                ),
              ],
              
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
                        _emailController.clear();
                        _passwordController.clear();
                        _fullNameController.clear();
                        _phoneController.clear();
                        _selectedGender = null;
                        _selectedCountry = null;
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

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isPassword = false,
    TextInputType? keyboardType,
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
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: EditableText(
                controller: controller,
                focusNode: FocusNode(),
                style: const TextStyle(
                  fontSize: 16,
                  color: AppColors.textPrimary,
                  fontFamily: 'DM Sans',
                ),
                cursorColor: AppColors.primary,
                backgroundCursorColor: AppColors.border,
                obscureText: isPassword,
                keyboardType: keyboardType,
                onChanged: (_) => setState(() {}),
              ),
            ),
          ),
          if (controller.text.isEmpty)
            Positioned.fill(
              child: IgnorePointer(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  alignment: Alignment.centerLeft,
                  child: Text(
                    label,
                    style: TextStyle(
                      color: AppColors.textSecondary.withOpacity(0.7),
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDropdown({
    required String? value,
    required String hint,
    required IconData icon,
    required List<Map<String, String>> items,
    required bool isFrench,
    required ValueChanged<String?> onChanged,
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
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: value,
                hint: Text(
                  hint,
                  style: TextStyle(
                    color: AppColors.textSecondary.withOpacity(0.7),
                    fontSize: 16,
                  ),
                ),
                isExpanded: true,
                icon: const Icon(Icons.keyboard_arrow_down),
                style: const TextStyle(
                  fontSize: 16,
                  color: AppColors.textPrimary,
                ),
                dropdownColor: AppColors.surface,
                items: items.map((item) {
                  return DropdownMenuItem<String>(
                    value: item['value'],
                    child: Text(
                      isFrench ? item['labelFr']! : item['labelEn']!,
                      style: const TextStyle(color: AppColors.textPrimary),
                    ),
                  );
                }).toList(),
                onChanged: onChanged,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
