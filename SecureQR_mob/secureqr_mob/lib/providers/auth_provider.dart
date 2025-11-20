import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  User? _user;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  // Initialize auth state
  Future<void> initializeAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _apiService.getToken();
      if (token != null) {
        _user = await _apiService.getCurrentUser();
      }
    } catch (e) {
      _error = e.toString();
      await _apiService.removeToken();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Login
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.login(email, password);
      print('Login response: $response');
      _user = await _apiService.getCurrentUser();
      print('User fetched: $_user');
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      print('Login error: $e');
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Register
  Future<bool> register(String name, String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.register(name, email, password);
      // After registration, login automatically
      return await login(email, password);
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiService.logout();
    } catch (e) {
      // Even if logout fails, clear local state
    } finally {
      _user = null;
      await _apiService.removeToken();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Update user settings
  Future<bool> updateSettings(Map<String, dynamic> settings) async {
    try {
      await _apiService.updateUserSettings(settings);
      // Refresh user data
      _user = await _apiService.getCurrentUser();
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
