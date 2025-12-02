import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';

enum AuthStatus {
  unknown,
  authenticated,
  unauthenticated,
}

class AuthProvider with ChangeNotifier {
  final ApiService _apiService;
  
  AuthStatus _status = AuthStatus.unknown;
  User? _user;
  String? _error;
  bool _isLoading = false;

  AuthProvider({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  AuthStatus get status => _status;
  User? get user => _user;
  String? get error => _error;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  Future<void> checkAuth() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final user = await _apiService.getCurrentUser();
      if (user != null) {
        _user = user;
        _status = AuthStatus.authenticated;
      } else {
        _status = AuthStatus.unauthenticated;
      }
    } catch (e) {
      _status = AuthStatus.unauthenticated;
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _apiService.login(email, password);
      _status = AuthStatus.authenticated;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    String? fullName,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _apiService.register(
        email: email,
        password: password,
        fullName: fullName,
      );
      _status = AuthStatus.authenticated;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiService.logout();
    } catch (e) {
      // Ignore logout errors
    }

    _user = null;
    _status = AuthStatus.unauthenticated;
    _isLoading = false;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
