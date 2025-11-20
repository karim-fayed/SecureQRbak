import 'package:flutter/foundation.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../models/qr_code.dart';
import '../models/verification_log.dart';
import '../services/api_service.dart';

class QRProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<QRCode> _qrCodes = [];
  List<VerificationLog> _verificationLogs = [];
  bool _isLoading = false;
  String? _error;
  bool _isScanning = false;
  String? _scannedData;

  List<QRCode> get qrCodes => _qrCodes;
  List<VerificationLog> get verificationLogs => _verificationLogs;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isScanning => _isScanning;
  String? get scannedData => _scannedData;

  // Load QR codes
  Future<void> loadQRCodes() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _qrCodes = await _apiService.getQRCodes();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Load verification logs
  Future<void> loadVerificationLogs() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _verificationLogs = await _apiService.getVerificationLogs();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Create QR code
  Future<bool> createQRCode(Map<String, dynamic> qrData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.createQRCode(qrData);
      // Reload QR codes after creation
      await loadQRCodes();
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

  // Delete QR code
  Future<bool> deleteQRCode(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.deleteQRCode(id);
      // Remove from local list
      _qrCodes.removeWhere((qr) => qr.id == id);
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

  // Verify QR code
  Future<Map<String, dynamic>?> verifyQRCode(String encryptedData, String signature, [String? verificationCode]) async {
    try {
      return await _apiService.verifyQRCode(encryptedData, signature, verificationCode);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  // Get QR code by ID
  QRCode? getQRCodeById(String id) {
    return _qrCodes.firstWhere((qr) => qr.id == id);
  }

  // Get active QR codes
  List<QRCode> get activeQRCodes => _qrCodes.where((qr) => qr.isActive).toList();

  // Get expired QR codes
  List<QRCode> get expiredQRCodes => _qrCodes.where((qr) => qr.isExpired).toList();

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Start QR scanning
  void startScanning() {
    _isScanning = true;
    _scannedData = null;
    _error = null;
    notifyListeners();
  }

  // Stop QR scanning
  void stopScanning() {
    _isScanning = false;
    notifyListeners();
  }

  // Handle scanned QR code
  void onQRCodeScanned(BarcodeCapture capture) {
    final barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final barcode = barcodes.first;
      if (barcode.rawValue != null) {
        _scannedData = barcode.rawValue!;
        _isScanning = false;
        notifyListeners();
        // Optionally, verify the scanned QR code
        verifyScannedQRCode(_scannedData!);
      }
    }
  }

  // Verify scanned QR code
  Future<void> verifyScannedQRCode(String data) async {
    _isLoading = true;
    notifyListeners();

    try {
      // Assuming the QR data contains encrypted data and signature separated by '|'
      final parts = data.split('|');
      if (parts.length >= 2) {
        final encryptedData = parts[0];
        final signature = parts[1];
        final verificationCode = parts.length > 2 ? parts[2] : null;

        final result = await verifyQRCode(encryptedData, signature, verificationCode);
        if (result != null) {
          // Handle successful verification
          _error = null;
        } else {
          _error = 'فشل في التحقق من رمز QR';
        }
      } else {
        _error = 'بيانات رمز QR غير صالحة';
      }
    } catch (e) {
      _error = 'خطأ في التحقق: ${e.toString()}';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Clear scanned data
  void clearScannedData() {
    _scannedData = null;
    _error = null;
    notifyListeners();
  }
}
