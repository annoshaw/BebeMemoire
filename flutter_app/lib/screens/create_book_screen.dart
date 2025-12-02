import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../providers/locale_provider.dart';
import '../models/book.dart';
import '../models/book_template.dart';
import '../services/api_service.dart';
import 'book_detail_screen.dart';

class CreateBookScreen extends StatefulWidget {
  const CreateBookScreen({super.key});

  @override
  State<CreateBookScreen> createState() => _CreateBookScreenState();
}

class _CreateBookScreenState extends State<CreateBookScreen> {
  final ApiService _apiService = ApiService();
  List<BookTemplate> _templates = [];
  bool _isLoading = true;
  String? _selectedTemplateSlug;
  int _currentStep = 0;

  final _formKey = GlobalKey<FormState>();
  final _childNameController = TextEditingController();
  DateTime? _birthDate;
  String _babyStatus = 'born';

  @override
  void initState() {
    super.initState();
    _loadTemplates();
  }

  @override
  void dispose() {
    _childNameController.dispose();
    super.dispose();
  }

  Future<void> _loadTemplates() async {
    try {
      final templates = await _apiService.getBookTemplates();
      setState(() {
        _templates = templates;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8F6F3),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          locale.translate('Créer un livre', 'Create a Book'),
          style: const TextStyle(color: AppColors.textPrimary),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _currentStep == 0
              ? _buildTemplateSelection(locale)
              : _buildBookForm(locale),
    );
  }

  Widget _buildTemplateSelection(LocaleProvider locale) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              locale.translate(
                'Choisissez votre type de livre',
                'Choose your book type',
              ),
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ).animate().fadeIn().slideY(begin: -0.2),
            const SizedBox(height: 8),
            Text(
              locale.translate(
                'Sélectionnez un modèle pour commencer',
                'Select a template to get started',
              ),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textMuted,
              ),
            ).animate().fadeIn(delay: 100.ms).slideY(begin: -0.2),
            const SizedBox(height: 32),
            Expanded(
              child: ListView.builder(
                itemCount: _templates.length,
                itemBuilder: (context, index) {
                  final template = _templates[index];
                  return _TemplateCard(
                    template: template,
                    isSelected: _selectedTemplateSlug == template.slug,
                    locale: locale,
                    onTap: () {
                      setState(() => _selectedTemplateSlug = template.slug);
                    },
                    index: index,
                  );
                },
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _selectedTemplateSlug != null
                    ? () => setState(() => _currentStep = 1)
                    : null,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Text(
                  locale.translate('Continuer', 'Continue'),
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
            ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2),
          ],
        ),
      ),
    );
  }

  Widget _buildBookForm(LocaleProvider locale) {
    final selectedTemplate = _templates.firstWhere(
      (t) => t.slug == _selectedTemplateSlug,
      orElse: () => _templates.first,
    );

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Icon(
                      selectedTemplate.isPrebuilt
                          ? Icons.auto_awesome
                          : Icons.edit_note,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            selectedTemplate.getName(locale.isFrench),
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            locale.translate('Modèle sélectionné', 'Selected template'),
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () => setState(() => _currentStep = 0),
                      child: Text(locale.translate('Changer', 'Change')),
                    ),
                  ],
                ),
              ).animate().fadeIn(),
              const SizedBox(height: 32),
              Text(
                locale.translate('Informations sur l\'enfant', 'Child Information'),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _childNameController,
                decoration: InputDecoration(
                  labelText: locale.translate('Prénom de l\'enfant', 'Child\'s first name'),
                  hintText: locale.translate('Ex: Emma', 'e.g., Emma'),
                  prefixIcon: const Icon(Icons.child_care),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return locale.translate(
                      'Veuillez entrer le prénom',
                      'Please enter the first name',
                    );
                  }
                  return null;
                },
              ).animate().fadeIn(delay: 100.ms).slideX(begin: -0.1),
              const SizedBox(height: 20),
              Text(
                locale.translate('Statut', 'Status'),
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                children: [
                  _StatusChip(
                    label: locale.translate('Né(e)', 'Born'),
                    icon: Icons.cake,
                    isSelected: _babyStatus == 'born',
                    onTap: () => setState(() => _babyStatus = 'born'),
                  ),
                  _StatusChip(
                    label: locale.translate('En attente', 'Expecting'),
                    icon: Icons.favorite,
                    isSelected: _babyStatus == 'expecting',
                    onTap: () => setState(() => _babyStatus = 'expecting'),
                  ),
                  _StatusChip(
                    label: locale.translate('Adoption', 'Adoption'),
                    icon: Icons.volunteer_activism,
                    isSelected: _babyStatus == 'adoption',
                    onTap: () => setState(() => _babyStatus = 'adoption'),
                  ),
                ],
              ).animate().fadeIn(delay: 200.ms).slideX(begin: -0.1),
              const SizedBox(height: 20),
              InkWell(
                onTap: _selectDate,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today, color: AppColors.textMuted),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _babyStatus == 'expecting'
                                  ? locale.translate('Date prévue', 'Due date')
                                  : locale.translate('Date de naissance', 'Birth date'),
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textMuted,
                              ),
                            ),
                            Text(
                              _birthDate != null
                                  ? '${_birthDate!.day}/${_birthDate!.month}/${_birthDate!.year}'
                                  : locale.translate('Sélectionner', 'Select'),
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: AppColors.textMuted),
                    ],
                  ),
                ),
              ).animate().fadeIn(delay: 300.ms).slideX(begin: -0.1),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _createBook,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    locale.translate('Créer le livre', 'Create the book'),
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _selectDate() async {
    final now = DateTime.now();
    final firstDate = _babyStatus == 'expecting'
        ? now
        : DateTime(now.year - 5);
    final lastDate = _babyStatus == 'expecting'
        ? DateTime(now.year + 1)
        : now;

    final picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? now,
      firstDate: firstDate,
      lastDate: lastDate,
    );

    if (picked != null) {
      setState(() => _birthDate = picked);
    }
  }

  Future<void> _createBook() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedTemplateSlug == null) return;

    final locale = context.read<LocaleProvider>();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final bookData = {
        'childName': _childNameController.text.trim(),
        'babyStatus': _babyStatus,
        if (_birthDate != null) 'birthDate': _birthDate!.toIso8601String(),
      };

      late final Book book;
      if (_selectedTemplateSlug == 'custom') {
        book = await _apiService.createCustomBook(bookData);
      } else {
        book = await _apiService.createBookWithTemplate(bookData, _selectedTemplateSlug!);
      }

      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => BookDetailScreen(book: book),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog
      
      String errorMessage = locale.translate(
        'Erreur lors de la création du livre',
        'Error creating book',
      );
      
      if (e is ApiException) {
        errorMessage = e.message;
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }
}

class _TemplateCard extends StatelessWidget {
  final BookTemplate template;
  final bool isSelected;
  final LocaleProvider locale;
  final VoidCallback onTap;
  final int index;

  const _TemplateCard({
    required this.template,
    required this.isSelected,
    required this.locale,
    required this.onTap,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final isPrebuilt = template.isPrebuilt;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.transparent,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? AppColors.primary.withOpacity(0.2)
                  : Colors.black.withOpacity(0.05),
              blurRadius: isSelected ? 16 : 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isPrebuilt
                      ? [AppColors.primary, AppColors.primaryLight]
                      : [AppColors.secondary, AppColors.secondaryLight],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                isPrebuilt ? Icons.auto_awesome : Icons.edit_note,
                color: Colors.white,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          template.getName(locale.isFrench),
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (isPrebuilt)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            locale.translate('Recommandé', 'Recommended'),
                            style: TextStyle(
                              color: AppColors.primary,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    template.getDescription(locale.isFrench) ?? '',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textMuted,
                      height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (isPrebuilt) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        _FeatureChip(
                          icon: Icons.favorite,
                          label: locale.translate('Grossesse', 'Pregnancy'),
                        ),
                        _FeatureChip(
                          icon: Icons.people,
                          label: locale.translate('Famille', 'Family'),
                        ),
                        _FeatureChip(
                          icon: Icons.cake,
                          label: locale.translate('Moisnniversaires', 'Milestones'),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.primary : Colors.transparent,
                border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.border,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, color: Colors.white, size: 16)
                  : null,
            ),
          ],
        ),
      ),
    ).animate(delay: (index * 100).ms).fadeIn().slideX(begin: 0.1);
  }
}

class _FeatureChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _FeatureChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppColors.textMuted),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _StatusChip({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? Colors.white : AppColors.textSecondary,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : AppColors.textSecondary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
