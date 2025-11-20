import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final TextEditingController _serverUrlController = TextEditingController();
  bool _isLoading = false;
  String? _currentUrl;

  @override
  void initState() {
    super.initState();
    _loadCurrentUrl();
  }

  Future<void> _loadCurrentUrl() async {
    final apiService = ApiService();
    final url = await apiService.getServerUrl();
    setState(() {
      _currentUrl = url ?? ApiService.baseUrl;
      _serverUrlController.text = _currentUrl!;
    });
  }

  Future<void> _updateServerUrl() async {
    if (_serverUrlController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يرجى إدخال عنوان الخادم')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final apiService = ApiService();
      await apiService.setServerUrl(_serverUrlController.text);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم تحديث عنوان الخادم بنجاح')),
      );

      setState(() {
        _currentUrl = _serverUrlController.text;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل في تحديث عنوان الخادم: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _testConnection() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final apiService = ApiService();
      // Try to get sync status to test connection
      await apiService.getSyncStatus();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم الاتصال بالخادم بنجاح')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل في الاتصال بالخادم: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الإعدادات'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'إعدادات الخادم',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _serverUrlController,
              decoration: const InputDecoration(
                labelText: 'عنوان الخادم',
                hintText: 'http://192.168.1.100:3000',
                border: OutlineInputBorder(),
              ),
              enabled: !_isLoading,
            ),

            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _updateServerUrl,
                    child: _isLoading
                        ? const CircularProgressIndicator()
                        : const Text('حفظ العنوان'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isLoading ? null : _testConnection,
                    child: const Text('اختبار الاتصال'),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 32),

            const Text(
              'معلومات التطبيق',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('الإصدار: 1.0.0'),
                    const SizedBox(height: 8),
                    Text('الخادم الحالي: $_currentUrl'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _serverUrlController.dispose();
    super.dispose();
  }
}
