import 'package:flutter/material.dart';
import '../models/sync_status.dart';
import '../services/api_service.dart';

class SyncProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  SyncStatus? _syncStatus;
  bool _isLoading = false;
  String? _error;

  SyncStatus? get syncStatus => _syncStatus;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Load sync status
  Future<void> loadSyncStatus() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _syncStatus = await _apiService.getSyncStatus();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Check if databases are healthy
  bool get isDatabaseHealthy {
    return _syncStatus?.isHealthy ?? false;
  }

  // Get sync progress percentage
  double get syncProgress {
    if (_syncStatus == null) return 0.0;
    if (_syncStatus!.totalRecords == 0) return 1.0;
    return _syncStatus!.syncedRecords / _syncStatus!.totalRecords;
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
