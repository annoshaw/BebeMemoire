import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../providers/books_provider.dart';
import '../providers/locale_provider.dart';
import '../models/book.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0;
  
  final _childNameController = TextEditingController();
  BabyStatus _selectedStatus = BabyStatus.born;
  DateTime? _birthDate;
  DateTime? _dueDate;
  bool _notificationsEnabled = true;
  bool _pushNotifications = false;
  int? _notificationWeekday;

  final List<String> _weekdays = [
    'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 
    'Jeudi', 'Vendredi', 'Samedi'
  ];
  final List<String> _weekdaysEn = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
    'Thursday', 'Friday', 'Saturday'
  ];

  @override
  void dispose() {
    _childNameController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context, bool isBirthDate) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isBirthDate 
          ? (_birthDate ?? DateTime.now())
          : (_dueDate ?? DateTime.now().add(const Duration(days: 180))),
      firstDate: isBirthDate 
          ? DateTime(2000)
          : DateTime.now(),
      lastDate: isBirthDate 
          ? DateTime.now()
          : DateTime.now().add(const Duration(days: 365)),
    );
    
    if (picked != null) {
      setState(() {
        if (isBirthDate) {
          _birthDate = picked;
        } else {
          _dueDate = picked;
        }
      });
    }
  }

  Future<void> _createBook() async {
    if (!_formKey.currentState!.validate()) return;

    final booksProvider = context.read<BooksProvider>();
    
    final bookData = {
      'childName': _childNameController.text.trim(),
      'status': _selectedStatus == BabyStatus.born 
          ? 'born' 
          : _selectedStatus == BabyStatus.expecting 
              ? 'expecting' 
              : 'adoption',
      'birthDate': _birthDate?.toIso8601String(),
      'dueDate': _dueDate?.toIso8601String(),
      'notificationsEnabled': _notificationsEnabled,
      'pushNotifications': _pushNotifications,
      'notificationWeekday': _notificationWeekday,
    };

    final book = await booksProvider.createBook(bookData);
    
    if (book != null && mounted) {
      Navigator.of(context).pop(book);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(booksProvider.error ?? 'Error creating book'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>();
    final booksProvider = context.watch<BooksProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(locale.translate('Créer un livre', 'Create a book')),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Form(
        key: _formKey,
        child: Stepper(
          currentStep: _currentStep,
          onStepContinue: () {
            if (_currentStep < 2) {
              setState(() => _currentStep++);
            } else {
              _createBook();
            }
          },
          onStepCancel: () {
            if (_currentStep > 0) {
              setState(() => _currentStep--);
            }
          },
          controlsBuilder: (context, details) {
            return Padding(
              padding: const EdgeInsets.only(top: 24),
              child: Row(
                children: [
                  ElevatedButton(
                    onPressed: booksProvider.isLoading 
                        ? null 
                        : details.onStepContinue,
                    child: booksProvider.isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(_currentStep < 2 
                            ? locale.translate('Suivant', 'Next')
                            : locale.translate('Créer', 'Create')),
                  ),
                  if (_currentStep > 0) ...[
                    const SizedBox(width: 12),
                    TextButton(
                      onPressed: details.onStepCancel,
                      child: Text(locale.translate('Retour', 'Back')),
                    ),
                  ],
                ],
              ),
            );
          },
          steps: [
            Step(
              title: Text(locale.translate('Informations', 'Information')),
              content: _buildInfoStep(locale),
              isActive: _currentStep >= 0,
              state: _currentStep > 0 ? StepState.complete : StepState.indexed,
            ),
            Step(
              title: Text(locale.translate('Dates', 'Dates')),
              content: _buildDatesStep(locale),
              isActive: _currentStep >= 1,
              state: _currentStep > 1 ? StepState.complete : StepState.indexed,
            ),
            Step(
              title: Text(locale.translate('Notifications', 'Notifications')),
              content: _buildNotificationsStep(locale),
              isActive: _currentStep >= 2,
              state: _currentStep > 2 ? StepState.complete : StepState.indexed,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoStep(LocaleProvider locale) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: _childNameController,
          decoration: InputDecoration(
            labelText: locale.translate('Nom de l\'enfant', 'Child\'s name'),
            prefixIcon: const Icon(Icons.child_care),
          ),
          textCapitalization: TextCapitalization.words,
          validator: (value) {
            if (value == null || value.isEmpty) {
              return locale.translate(
                'Veuillez entrer le nom de l\'enfant',
                'Please enter the child\'s name',
              );
            }
            return null;
          },
        ),
        const SizedBox(height: 24),
        Text(
          locale.translate('Situation', 'Status'),
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        _buildStatusOption(
          BabyStatus.born,
          Icons.cake,
          locale.translate('Bébé est né(e)', 'Baby is born'),
          locale.translate(
            'Votre bébé est déjà arrivé',
            'Your baby has already arrived',
          ),
          locale,
        ),
        _buildStatusOption(
          BabyStatus.expecting,
          Icons.pregnant_woman,
          locale.translate('En attente', 'Expecting'),
          locale.translate(
            'Vous attendez votre bébé',
            'You are expecting your baby',
          ),
          locale,
        ),
        _buildStatusOption(
          BabyStatus.adoption,
          Icons.favorite,
          locale.translate('Adoption', 'Adoption'),
          locale.translate(
            'Vous êtes en processus d\'adoption',
            'You are in the adoption process',
          ),
          locale,
        ),
      ],
    ).animate().fadeIn(duration: 300.ms);
  }

  Widget _buildStatusOption(
    BabyStatus status,
    IconData icon,
    String title,
    String subtitle,
    LocaleProvider locale,
  ) {
    final isSelected = _selectedStatus == status;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? AppColors.primary : AppColors.border,
          width: isSelected ? 2 : 1,
        ),
      ),
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedStatus = status;
            if (status != BabyStatus.adoption) {
              _notificationWeekday = null;
            }
          });
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isSelected 
                      ? AppColors.primary.withOpacity(0.1)
                      : AppColors.background,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: isSelected ? AppColors.primary : AppColors.textMuted,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              if (isSelected)
                const Icon(
                  Icons.check_circle,
                  color: AppColors.primary,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDatesStep(LocaleProvider locale) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_selectedStatus == BabyStatus.born) ...[
          Text(
            locale.translate('Date de naissance', 'Birth date'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          InkWell(
            onTap: () => _selectDate(context, true),
            borderRadius: BorderRadius.circular(12),
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
                  Text(
                    _birthDate != null
                        ? '${_birthDate!.day}/${_birthDate!.month}/${_birthDate!.year}'
                        : locale.translate(
                            'Sélectionner une date',
                            'Select a date',
                          ),
                    style: TextStyle(
                      color: _birthDate != null 
                          ? AppColors.textPrimary 
                          : AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        if (_selectedStatus == BabyStatus.expecting) ...[
          Text(
            locale.translate('Date prévue d\'accouchement', 'Due date'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          InkWell(
            onTap: () => _selectDate(context, false),
            borderRadius: BorderRadius.circular(12),
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
                  Text(
                    _dueDate != null
                        ? '${_dueDate!.day}/${_dueDate!.month}/${_dueDate!.year}'
                        : locale.translate(
                            'Sélectionner une date',
                            'Select a date',
                          ),
                    style: TextStyle(
                      color: _dueDate != null 
                          ? AppColors.textPrimary 
                          : AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        if (_selectedStatus == BabyStatus.adoption) ...[
          Text(
            locale.translate(
              'Jour de rappel préféré',
              'Preferred reminder day',
            ),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            locale.translate(
              'Nous vous enverrons un rappel chaque semaine pour ajouter des souvenirs.',
              'We will send you a reminder each week to add memories.',
            ),
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(7, (index) {
              final isSelected = _notificationWeekday == index;
              final dayName = locale.isFrench 
                  ? _weekdays[index] 
                  : _weekdaysEn[index];
              
              return ChoiceChip(
                label: Text(dayName),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    _notificationWeekday = selected ? index : null;
                  });
                },
                selectedColor: AppColors.primary.withOpacity(0.2),
                labelStyle: TextStyle(
                  color: isSelected ? AppColors.primary : AppColors.textPrimary,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              );
            }),
          ),
        ],
      ],
    ).animate().fadeIn(duration: 300.ms);
  }

  Widget _buildNotificationsStep(LocaleProvider locale) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          locale.translate(
            'Restez informé(e) des étapes clés de votre enfant',
            'Stay informed about your child\'s key milestones',
          ),
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 24),
        SwitchListTile(
          title: Text(locale.translate(
            'Activer les notifications',
            'Enable notifications',
          )),
          subtitle: Text(locale.translate(
            'Recevoir des rappels pour les étapes clés',
            'Receive reminders for key milestones',
          )),
          value: _notificationsEnabled,
          onChanged: (value) {
            setState(() {
              _notificationsEnabled = value;
              if (!value) {
                _pushNotifications = false;
              }
            });
          },
          activeColor: AppColors.primary,
        ),
        if (_notificationsEnabled) ...[
          const Divider(),
          SwitchListTile(
            title: Text(locale.translate(
              'Notifications push',
              'Push notifications',
            )),
            subtitle: Text(locale.translate(
              'Recevoir des notifications sur votre appareil',
              'Receive notifications on your device',
            )),
            value: _pushNotifications,
            onChanged: (value) {
              setState(() {
                _pushNotifications = value;
              });
            },
            activeColor: AppColors.primary,
          ),
        ],
      ],
    ).animate().fadeIn(duration: 300.ms);
  }
}
