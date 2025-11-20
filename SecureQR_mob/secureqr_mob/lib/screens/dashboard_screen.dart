import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../providers/auth_provider.dart';
import '../providers/qr_provider.dart';
import '../providers/sync_provider.dart';
import '../widgets/qr_code_card.dart';
import '../widgets/stats_card.dart';
import '../widgets/sync_status_widget.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Load data when screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final qrProvider = Provider.of<QRProvider>(context, listen: false);
      final syncProvider = Provider.of<SyncProvider>(context, listen: false);
      qrProvider.loadQRCodes();
      syncProvider.loadSyncStatus();
    });
  }

  void _showQRScannerDialog(BuildContext context, QRProvider qrProvider) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('مسح رمز QR'),
          content: SizedBox(
            width: 300,
            height: 400,
            child: MobileScanner(
              onDetect: (capture) {
                qrProvider.onQRCodeScanned(capture);
                context.pop(); // Close the dialog after scanning
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                qrProvider.stopScanning();
                Navigator.of(context).pop();
              },
              child: const Text('إلغاء'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final qrProvider = Provider.of<QRProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('لوحة التحكم'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () {
              _showQRScannerDialog(context, qrProvider);
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              context.go('/settings');
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authProvider.logout();
              if (mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await qrProvider.loadQRCodes();
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome message
              Text(
                'مرحباً، ${authProvider.user?.name ?? 'المستخدم'}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),

              // Stats cards
              Row(
                children: [
                  Expanded(
                    child: StatsCard(
                      title: 'إجمالي رموز QR',
                      value: qrProvider.qrCodes.length.toString(),
                      icon: Icons.qr_code,
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: StatsCard(
                      title: 'رموز نشطة',
                      value: qrProvider.activeQRCodes.length.toString(),
                      icon: Icons.check_circle,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: StatsCard(
                      title: 'رموز منتهية',
                      value: qrProvider.expiredQRCodes.length.toString(),
                      icon: Icons.cancel,
                      color: Colors.red,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: StatsCard(
                      title: 'إجمالي الاستخدامات',
                      value: qrProvider.qrCodes.fold<int>(
                        0,
                        (sum, qr) => sum + qr.useCount,
                      ).toString(),
                      icon: Icons.analytics,
                      color: Colors.purple,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Sync Status Widget
              const Text(
                'حالة التزامن',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              const SyncStatusWidget(),
              const SizedBox(height: 32),

              // QR Codes section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'رموز QR الخاصة بك',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      context.go('/create-qr');
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('إنشاء QR جديد'),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // QR Codes list
              if (qrProvider.isLoading)
                const Center(child: CircularProgressIndicator())
              else if (qrProvider.qrCodes.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32.0),
                    child: Text(
                      'لا توجد رموز QR بعد. اضغط على "إنشاء QR جديد" لبدء إنشاء رموزك الأولى.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: qrProvider.qrCodes.length,
                  itemBuilder: (context, index) {
                    final qrCode = qrProvider.qrCodes[index];
                    return QRCodeCard(qrCode: qrCode);
                  },
                ),

              // Scanned QR data display
              if (qrProvider.scannedData != null)
                Padding(
                  padding: const EdgeInsets.only(top: 16.0),
                  child: Card(
                    color: Colors.green[50],
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'البيانات الممسوحة:',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(qrProvider.scannedData!),
                          const SizedBox(height: 8),
                          ElevatedButton(
                            onPressed: () {
                              qrProvider.clearScannedData();
                            },
                            child: const Text('مسح'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

              // Error message
              if (qrProvider.error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 16.0),
                  child: Text(
                    qrProvider.error!,
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
