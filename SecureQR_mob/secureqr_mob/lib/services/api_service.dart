import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user.dart';
import '../models/qr_code.dart';
import '../models/verification_log.dart';
import '../models/sync_status.dart';

class ApiService {
  static String baseUrl = 'https://your-online-server.com'; // Replace with your deployed backend URL
  static const String _tokenKey = 'auth_token';
  static const String _appVersionKey = 'app_version';
  static const String _serverUrlKey = 'server_url';

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Get stored token
  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  // Store token
  Future<void> setToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  // Remove token
  Future<void> removeToken() async {
    await _storage.delete(key: _tokenKey);
  }

  // Generic GET request
  Future<Map<String, dynamic>> _get(String endpoint) async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Cookie': 'auth-token=$token',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load data: ${response.statusCode}');
    }
  }

  // Generic POST request
  Future<Map<String, dynamic>> _post(String endpoint, Map<String, dynamic> data) async {
    final token = await getToken();
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Cookie': 'auth-token=$token',
      },
      body: json.encode(data),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      final errorBody = json.decode(response.body);
      throw Exception(errorBody['error'] ?? 'Failed to post data: ${response.statusCode}');
    }
  }

  // Generic PUT request
  Future<Map<String, dynamic>> _put(String endpoint, Map<String, dynamic> data) async {
    final token = await getToken();
    final response = await http.put(
      Uri.parse('$baseUrl$endpoint'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Cookie': 'auth-token=$token',
      },
      body: json.encode(data),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final errorBody = json.decode(response.body);
      throw Exception(errorBody['error'] ?? 'Failed to update data: ${response.statusCode}');
    }
  }

  // Generic DELETE request
  Future<void> _delete(String endpoint) async {
    final token = await getToken();
    final response = await http.delete(
      Uri.parse('$baseUrl$endpoint'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Cookie': 'auth-token=$token',
      },
    );

    if (response.statusCode != 200) {
      final errorBody = json.decode(response.body);
      throw Exception(errorBody['error'] ?? 'Failed to delete data: ${response.statusCode}');
    }
  }

  // Authentication methods
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _post('/api/login', {
      'email': email,
      'password': password,
    });

    // Store token if login successful
    if (response.containsKey('token')) {
      await setToken(response['token']);
    }

    return response;
  }

  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    return await _post('/api/register', {
      'name': name,
      'email': email,
      'password': password,
    });
  }

  Future<void> logout() async {
    await _post('/api/logout', {});
    await removeToken();
  }

  // User methods
  Future<User> getCurrentUser() async {
    final response = await _get('/api/user/me');
    return User.fromJson(response['user']);
  }

  Future<Map<String, dynamic>> getUserStats() async {
    final response = await _get('/api/user/me');
    return response['stats'];
  }

  Future<void> updateUserSettings(Map<String, dynamic> settings) async {
    await _put('/api/user/settings', settings);
  }

  // QR Code methods
  Future<List<QRCode>> getQRCodes() async {
    final response = await _get('/api/qrcodes');
    final List<dynamic> qrCodesJson = response['qrCodes'] ?? [];
    return qrCodesJson.map((json) => QRCode.fromJson(json)).toList();
  }

  Future<QRCode> getQRCode(String id) async {
    final response = await _get('/api/qrcodes/$id');
    return QRCode.fromJson(response['qrCode']);
  }

  Future<Map<String, dynamic>> createQRCode(Map<String, dynamic> qrData) async {
    return await _post('/api/generate', qrData);
  }

  Future<void> deleteQRCode(String id) async {
    await _delete('/api/qrcodes/$id');
  }

  Future<Map<String, dynamic>> verifyQRCode(String encryptedData, String signature, [String? verificationCode]) async {
    return await _post('/api/verify', {
      'encryptedData': encryptedData,
      'signature': signature,
      if (verificationCode != null) 'verificationCode': verificationCode,
    });
  }

  // Verification logs
  Future<List<VerificationLog>> getVerificationLogs() async {
    // This would need to be implemented in the backend
    // For now, return empty list
    return [];
  }

  // Sync status methods
  Future<SyncStatus> getSyncStatus() async {
    final response = await _get('/api/sync-status');
    return SyncStatus.fromJson(response);
  }

  // App update methods
  Future<Map<String, dynamic>> checkForUpdates() async {
    final currentVersion = await getAppVersion() ?? '1.0.0';
    final response = await _get('/api/app-updates?current_version=$currentVersion');
    return response;
  }

  Future<void> downloadUpdate(String updateUrl) async {
    // This would handle downloading and applying updates
    // For now, just simulate the process
    await Future.delayed(const Duration(seconds: 2));
  }

  // Get app version
  Future<String?> getAppVersion() async {
    return await _storage.read(key: _appVersionKey);
  }

  // Store app version
  Future<void> setAppVersion(String version) async {
    await _storage.write(key: _appVersionKey, value: version);
  }

  // Server URL management
  Future<String?> getServerUrl() async {
    return await _storage.read(key: _serverUrlKey);
  }

  Future<void> setServerUrl(String url) async {
    await _storage.write(key: _serverUrlKey, value: url);
    baseUrl = url; // Update the static baseUrl
  }

  // Initialize server URL from storage or use default
  Future<void> initializeServerUrl() async {
    final storedUrl = await getServerUrl();
    if (storedUrl != null && storedUrl.isNotEmpty) {
      baseUrl = storedUrl;
    }
  }
}
