import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/qr_code.dart';

class QRCodeCard extends StatelessWidget {
  final QRCode qrCode;

  const QRCodeCard({super.key, required this.qrCode});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with name and status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    qrCode.name,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: qrCode.isActive ? Colors.green[100] : Colors.red[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    qrCode.status,
                    style: TextStyle(
                      color: qrCode.isActive ? Colors.green[800] : Colors.red[800],
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),

            if (qrCode.description != null && qrCode.description!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                qrCode.description!,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 14,
                ),
              ),
            ],

            const SizedBox(height: 16),

            // QR Code display
            Center(
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: QrImageView(
                  data: qrCode.verificationCode,
                  version: QrVersions.auto,
                  size: 100,
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Stats
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStat('الاستخدامات', qrCode.useCount.toString()),
                if (qrCode.useLimit != null)
                  _buildStat('الحد الأقصى', qrCode.useLimit.toString()),
                if (qrCode.expiresAt != null)
                  _buildStat(
                    'ينتهي',
                    '${qrCode.expiresAt!.day}/${qrCode.expiresAt!.month}/${qrCode.expiresAt!.year}',
                  ),
              ],
            ),

            const SizedBox(height: 16),

            // Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      // Share QR code
                      _shareQRCode(context);
                    },
                    icon: const Icon(Icons.share),
                    label: const Text('مشاركة'),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // View details
                      _showQRDetails(context);
                    },
                    icon: const Icon(Icons.info),
                    label: const Text('التفاصيل'),
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  void _shareQRCode(BuildContext context) {
    // Implement share functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('مشاركة QR قيد التطوير')),
    );
  }

  void _showQRDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              qrCode.name,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildDetailRow('الرمز التحققي', qrCode.verificationCode),
            _buildDetailRow('عدد الاستخدامات', qrCode.useCount.toString()),
            if (qrCode.useLimit != null)
              _buildDetailRow('الحد الأقصى للاستخدام', qrCode.useLimit.toString()),
            if (qrCode.expiresAt != null)
              _buildDetailRow('تاريخ الانتهاء', qrCode.expiresAt!.toString()),
            _buildDetailRow('تاريخ الإنشاء', qrCode.createdAt.toString()),
            if (qrCode.updatedAt != null)
              _buildDetailRow('آخر تحديث', qrCode.updatedAt!.toString()),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }
}
