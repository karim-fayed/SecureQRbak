import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/sync_provider.dart';

class SyncStatusWidget extends StatelessWidget {
  const SyncStatusWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SyncProvider>(
      builder: (context, syncProvider, child) {
        final syncStatus = syncProvider.syncStatus;

        if (syncProvider.isLoading) {
          return const Card(
            child: Padding(
              padding: EdgeInsets.all(16.0),
              child: Row(
                children: [
                  CircularProgressIndicator(),
                  SizedBox(width: 16),
                  Text('جاري التحقق من حالة التزامن...'),
                ],
              ),
            ),
          );
        }

        if (syncStatus == null) {
          return const Card(
            child: Padding(
              padding: EdgeInsets.all(16.0),
              child: Text('لا توجد معلومات عن حالة التزامن'),
            ),
          );
        }

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      syncStatus.isHealthy ? Icons.check_circle : Icons.error,
                      color: syncStatus.isHealthy ? Colors.green : Colors.red,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      syncStatus.isHealthy ? 'التزامن نشط' : 'مشكلة في التزامن',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: syncStatus.isHealthy ? Colors.green : Colors.red,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Database health
                _buildHealthIndicator('MongoDB', syncStatus.databaseHealth['mongodb'] ?? false),
                _buildHealthIndicator('SQL Server', syncStatus.databaseHealth['sqlserver'] ?? false),

                const SizedBox(height: 16),

                // Sync statistics
                Text('إحصائيات التزامن:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                _buildStatRow('إجمالي السجلات', syncStatus.totalRecords.toString()),
                _buildStatRow('السجلات المتزامنة', syncStatus.syncedRecords.toString()),
                _buildStatRow('السجلات الفاشلة', syncStatus.failedRecords.toString()),

                if (syncStatus.lastSync != null) ...[
                  const SizedBox(height: 8),
                  _buildStatRow('آخر تزامن', _formatDate(syncStatus.lastSync!)),
                ],

                if (syncStatus.isRunning) ...[
                  const SizedBox(height: 16),
                  LinearProgressIndicator(value: syncProvider.syncProgress),
                  const SizedBox(height: 8),
                  Text('التزامن جاري... (${(syncProvider.syncProgress * 100).toInt()}%)'),
                ],

                if (syncStatus.lastError != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red[200]!),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error, color: Colors.red[400]),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'خطأ: ${syncStatus.lastError}',
                            style: TextStyle(color: Colors.red[700]),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildHealthIndicator(String name, bool isHealthy) {
    return Row(
      children: [
        Icon(
          isHealthy ? Icons.check_circle : Icons.cancel,
          color: isHealthy ? Colors.green : Colors.red,
          size: 16,
        ),
        const SizedBox(width: 8),
        Text(name),
        const Spacer(),
        Text(
          isHealthy ? 'صحي' : 'معطل',
          style: TextStyle(
            color: isHealthy ? Colors.green : Colors.red,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}
