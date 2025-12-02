import 'package:flutter/material.dart';
import '../services/api_service.dart';

class OnboardingProvider with ChangeNotifier {
  final ApiService _apiService;
  
  bool _isLoading = true;
  bool _onboardingCompleted = false;
  String? _error;
  Map<String, dynamic>? _onboardingState;

  OnboardingProvider({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  bool get isLoading => _isLoading;
  bool get onboardingCompleted => _onboardingCompleted;
  String? get error => _error;
  Map<String, dynamic>? get onboardingState => _onboardingState;
  bool get hasBooks => _onboardingState?['hasBooks'] == true;

  Future<void> checkOnboardingState() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final state = await _apiService.getOnboardingState();
      _onboardingState = state;
      _onboardingCompleted = state['onboardingCompleted'] == true;
    } catch (e) {
      _error = e.toString();
      _onboardingCompleted = true;
    }

    _isLoading = false;
    notifyListeners();
  }

  void setOnboardingCompleted(bool value) {
    _onboardingCompleted = value;
    notifyListeners();
  }

  void reset() {
    _isLoading = true;
    _onboardingCompleted = false;
    _error = null;
    _onboardingState = null;
    notifyListeners();
  }
}
