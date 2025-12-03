import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/locale_provider.dart';
import '../services/api_service.dart';
import '../models/book_template.dart';

class OnboardingWizardScreen extends StatefulWidget {
  final VoidCallback onComplete;

  const OnboardingWizardScreen({
    super.key,
    required this.onComplete,
  });

  @override
  State<OnboardingWizardScreen> createState() => _OnboardingWizardScreenState();
}

class _OnboardingWizardScreenState extends State<OnboardingWizardScreen> {
  final _pageController = PageController();
  int _currentPage = 0;
  bool _isLoading = false;
  bool _isLoadingTemplates = true;
  String? _error;

  String? _selectedBookType;
  String? _selectedTemplateSlug;
  List<BookTemplate> _templates = [];
  final _childNameController = TextEditingController();
  DateTime? _selectedDate;
  String? _selectedBabyGender;
  String _selectedNotificationFrequency = 'weekly';

  final List<Map<String, String>> _bookTypes = [
    {
      'value': 'born',
      'iconName': 'child_care',
      'labelFr': 'Déjà né',
      'labelEn': 'Already born',
      'descFr': 'Mon enfant est déjà né',
      'descEn': 'My child is already born',
    },
    {
      'value': 'expecting',
      'iconName': 'pregnant_woman',
      'labelFr': 'En attente',
      'labelEn': 'Expecting',
      'descFr': 'Je suis enceinte',
      'descEn': 'I am pregnant',
    },
    {
      'value': 'adoption',
      'iconName': 'favorite',
      'labelFr': 'Adoption',
      'labelEn': 'Adoption',
      'descFr': 'Parcours d\'adoption',
      'descEn': 'Adoption journey',
    },
  ];

  final List<Map<String, String>> _genderOptions = [
    {'value': 'boy', 'labelFr': 'Garçon', 'labelEn': 'Boy'},
    {'value': 'girl', 'labelFr': 'Fille', 'labelEn': 'Girl'},
    {'value': 'unknown', 'labelFr': 'Pas encore connu', 'labelEn': 'Not yet known'},
    {'value': 'prefer_not_to_say', 'labelFr': 'Préfère ne pas dire', 'labelEn': 'Prefer not to say'},
  ];

  final List<Map<String, String>> _frequencyOptions = [
    {'value': 'daily', 'labelFr': 'Quotidien', 'labelEn': 'Daily'},
    {'value': 'weekly', 'labelFr': 'Hebdomadaire', 'labelEn': 'Weekly'},
    {'value': 'monthly', 'labelFr': 'Mensuel', 'labelEn': 'Monthly'},
    {'value': 'none', 'labelFr': 'Aucune notification', 'labelEn': 'No notifications'},
  ];

  @override
  void initState() {
    super.initState();
    _loadTemplates();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _childNameController.dispose();
    super.dispose();
  }

  Future<void> _loadTemplates() async {
    try {
      final apiService = ApiService();
      final templates = await apiService.getBookTemplates();
      setState(() {
        _templates = templates;
        _isLoadingTemplates = false;
      });
    } catch (e) {
      setState(() => _isLoadingTemplates = false);
    }
  }

  IconData _getIconForBookType(String iconName) {
    switch (iconName) {
      case 'child_care':
        return Icons.child_care;
      case 'pregnant_woman':
        return Icons.pregnant_woman;
      case 'favorite':
        return Icons.favorite;
      default:
        return Icons.book;
    }
  }

  void _nextPage() {
    if (_currentPage < 4) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  bool _canProceed() {
    switch (_currentPage) {
      case 0:
        return _selectedTemplateSlug != null;
      case 1:
        return _selectedBookType != null;
      case 2:
        return _childNameController.text.trim().isNotEmpty;
      case 3:
        return _selectedDate != null;
      case 4:
        return true;
      default:
        return false;
    }
  }

  Future<void> _completeOnboarding() async {
    if (_isLoading) return;
    
    final locale = context.read<LocaleProvider>();
    
    if (_selectedBookType == null || 
        _selectedDate == null || 
        _childNameController.text.trim().isEmpty) {
      setState(() {
        _error = locale.isFrench 
            ? 'Veuillez remplir tous les champs requis'
            : 'Please fill in all required fields';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final apiService = ApiService();
      final result = await apiService.completeOnboarding(
        bookType: _selectedBookType!,
        childName: _childNameController.text.trim(),
        date: _selectedDate!,
        notificationFrequency: _selectedNotificationFrequency,
        babyGender: _selectedBabyGender,
      );

      if (result['onboardingCompleted'] == true) {
        widget.onComplete();
      } else {
        setState(() {
          _error = locale.isFrench 
              ? 'Erreur lors de la création du livre'
              : 'Error creating book';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _selectDate(BuildContext context, bool isFrench) async {
    final now = DateTime.now();
    DateTime initialDate;
    DateTime firstDate;
    DateTime lastDate;

    if (_selectedBookType == 'expecting') {
      initialDate = now.add(const Duration(days: 180));
      firstDate = now;
      lastDate = now.add(const Duration(days: 300));
    } else {
      initialDate = now;
      firstDate = DateTime(2000);
      lastDate = now;
    }

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: lastDate,
      locale: isFrench ? const Locale('fr') : const Locale('en'),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: AppColors.surface,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>();
    final isFrench = locale.isFrench;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(isFrench),
            _buildProgressIndicator(),
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (index) => setState(() => _currentPage = index),
                children: [
                  _buildTemplateSelectionPage(isFrench),
                  _buildBookTypePage(isFrench),
                  _buildChildNamePage(isFrench),
                  _buildDatePage(isFrench),
                  _buildNotificationPage(isFrench),
                ],
              ),
            ),
            if (_error != null) _buildErrorMessage(),
            _buildNavigationButtons(isFrench),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isFrench) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.auto_stories,
              size: 32,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            isFrench ? 'Créons votre livre' : 'Let\'s create your book',
            style: Theme.of(context).textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 48),
      child: Row(
        children: List.generate(5, (index) {
          final isActive = index <= _currentPage;
          return Expanded(
            child: Container(
              height: 4,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                color: isActive ? AppColors.primary : AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildTemplateSelectionPage(bool isFrench) {
    if (_isLoadingTemplates) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isFrench
                ? 'Quel type de livre souhaitez-vous créer ?'
                : 'What type of book would you like to create?',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            isFrench
                ? 'Choisissez entre un modèle pré-construit ou créez le vôtre'
                : 'Choose between a pre-built template or create your own',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 24),
          ...(_templates.map((template) => _buildTemplateCard(template, isFrench))),
        ],
      ),
    );
  }

  Widget _buildTemplateCard(BookTemplate template, bool isFrench) {
    final isSelected = _selectedTemplateSlug == template.slug;
    final isPrebuilt = template.isPrebuilt;
    
    return GestureDetector(
      onTap: () => setState(() => _selectedTemplateSlug = template.slug),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryLight.withOpacity(0.15) : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isPrebuilt
                      ? [AppColors.primary, AppColors.primaryLight]
                      : [AppColors.secondary, AppColors.secondaryLight],
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                isPrebuilt ? Icons.auto_awesome : Icons.edit_note,
                color: Colors.white,
                size: 26,
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
                          template.getName(isFrench),
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ),
                      if (isPrebuilt)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            isFrench ? 'Recommandé' : 'Recommended',
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    template.getDescription(isFrench) ?? '',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                          height: 1.4,
                        ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (isPrebuilt) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        _buildFeatureChip(Icons.favorite, isFrench ? 'Grossesse' : 'Pregnancy'),
                        _buildFeatureChip(Icons.people, isFrench ? 'Famille' : 'Family'),
                        _buildFeatureChip(Icons.cake, isFrench ? 'Jalons' : 'Milestones'),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 12),
            Container(
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
    );
  }

  Widget _buildFeatureChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppColors.textSecondary),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookTypePage(bool isFrench) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isFrench
                ? 'Quelle est votre situation ?'
                : 'What is your situation?',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 24),
          ...(_bookTypes.map((type) => _buildBookTypeCard(type, isFrench))),
        ],
      ),
    );
  }

  Widget _buildBookTypeCard(Map<String, String> type, bool isFrench) {
    final isSelected = _selectedBookType == type['value'];
    return GestureDetector(
      onTap: () => setState(() => _selectedBookType = type['value']),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryLight.withOpacity(0.15) : AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.primary.withOpacity(0.15)
                    : AppColors.background,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                _getIconForBookType(type['iconName']!),
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isFrench ? type['labelFr']! : type['labelEn']!,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isFrench ? type['descFr']! : type['descEn']!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Container(
                width: 24,
                height: 24,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Colors.white, size: 16),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildChildNamePage(bool isFrench) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _selectedBookType == 'expecting'
                ? (isFrench ? 'Comment s\'appellera votre bébé ?' : 'What will your baby be called?')
                : (isFrench ? 'Comment s\'appelle votre enfant ?' : 'What is your child\'s name?'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            isFrench
                ? 'Vous pourrez le modifier plus tard'
                : 'You can change this later',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 24),
          _buildInputField(
            controller: _childNameController,
            label: isFrench ? 'Prénom ou surnom' : 'First name or nickname',
            icon: Icons.child_care,
          ),
          const SizedBox(height: 24),
          Text(
            isFrench ? 'Genre (optionnel)' : 'Gender (optional)',
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _genderOptions.map((option) {
              final isSelected = _selectedBabyGender == option['value'];
              return ChoiceChip(
                label: Text(isFrench ? option['labelFr']! : option['labelEn']!),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() => _selectedBabyGender = selected ? option['value'] : null);
                },
                selectedColor: AppColors.primaryLight.withOpacity(0.3),
                backgroundColor: AppColors.surface,
                labelStyle: TextStyle(
                  color: isSelected ? AppColors.primary : AppColors.textPrimary,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildDatePage(bool isFrench) {
    String title;
    String subtitle;

    switch (_selectedBookType) {
      case 'expecting':
        title = isFrench ? 'Date prévue d\'accouchement' : 'Expected due date';
        subtitle = isFrench
            ? 'Quand est prévu l\'arrivée de votre bébé ?'
            : 'When is your baby due?';
        break;
      case 'adoption':
        title = isFrench ? 'Date d\'adoption' : 'Adoption date';
        subtitle = isFrench
            ? 'Quand avez-vous accueilli votre enfant ?'
            : 'When did you welcome your child?';
        break;
      default:
        title = isFrench ? 'Date de naissance' : 'Birth date';
        subtitle = isFrench
            ? 'Quand est né votre enfant ?'
            : 'When was your child born?';
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 24),
          GestureDetector(
            onTap: () => _selectDate(context, isFrench),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(Icons.calendar_today, color: AppColors.textSecondary),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      _selectedDate != null
                          ? _formatDate(_selectedDate!, isFrench)
                          : (isFrench ? 'Sélectionner une date' : 'Select a date'),
                      style: TextStyle(
                        fontSize: 16,
                        color: _selectedDate != null
                            ? AppColors.textPrimary
                            : AppColors.textSecondary,
                      ),
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.textSecondary),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationPage(bool isFrench) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isFrench
                ? 'À quelle fréquence souhaitez-vous recevoir des rappels ?'
                : 'How often would you like to receive reminders?',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            isFrench
                ? 'Nous vous rappellerons de capturer des moments précieux'
                : 'We\'ll remind you to capture precious moments',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 24),
          ...(_frequencyOptions.map((option) => _buildFrequencyOption(option, isFrench))),
        ],
      ),
    );
  }

  Widget _buildFrequencyOption(Map<String, String> option, bool isFrench) {
    final isSelected = _selectedNotificationFrequency == option['value'];
    return GestureDetector(
      onTap: () => setState(() => _selectedNotificationFrequency = option['value']!),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryLight.withOpacity(0.15) : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.textSecondary,
                  width: 2,
                ),
                color: isSelected ? AppColors.primary : Colors.transparent,
              ),
              child: isSelected
                  ? const Icon(Icons.check, color: Colors.white, size: 12)
                  : null,
            ),
            const SizedBox(width: 16),
            Text(
              isFrench ? option['labelFr']! : option['labelEn']!,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
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
                onChanged: (_) => setState(() {}),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorMessage() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.error, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _error!,
              style: const TextStyle(color: AppColors.error, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationButtons(bool isFrench) {
    final isLastPage = _currentPage == 4;

    return Container(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          if (_currentPage > 0)
            TextButton(
              onPressed: _previousPage,
              child: Text(isFrench ? 'Retour' : 'Back'),
            ),
          const Spacer(),
          ElevatedButton(
            onPressed: (_canProceed() && !_isLoading)
                ? (isLastPage ? _completeOnboarding : _nextPage)
                : null,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Text(
                    isLastPage
                        ? (isFrench ? 'Terminer' : 'Finish')
                        : (isFrench ? 'Continuer' : 'Continue'),
                  ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date, bool isFrench) {
    final months = isFrench
        ? [
            'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
            'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
          ]
        : [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }
}
