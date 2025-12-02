import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleProvider with ChangeNotifier {
  static const String _localeKey = 'locale';
  
  Locale _locale = const Locale('fr');
  bool _isLoading = true;

  LocaleProvider() {
    _loadLocale();
  }

  Locale get locale => _locale;
  bool get isLoading => _isLoading;
  bool get isFrench => _locale.languageCode == 'fr';
  bool get isEnglish => _locale.languageCode == 'en';

  Future<void> _loadLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final localeCode = prefs.getString(_localeKey) ?? 'fr';
      _locale = Locale(localeCode);
    } catch (e) {
      _locale = const Locale('fr');
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> setLocale(Locale locale) async {
    if (_locale == locale) return;
    
    _locale = locale;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_localeKey, locale.languageCode);
    } catch (e) {
      // Ignore storage errors
    }
  }

  void toggleLocale() {
    setLocale(_locale.languageCode == 'fr' 
        ? const Locale('en') 
        : const Locale('fr'));
  }

  String translate(String frText, String enText) {
    return _locale.languageCode == 'fr' ? frText : enText;
  }
}
