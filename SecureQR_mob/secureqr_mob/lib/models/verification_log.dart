class VerificationLog {
  final String id;
  final String qrName;
  final DateTime verifiedAt;
  final String status; // 'ناجح', 'فاشل', 'منتهي'
  final String? location;
  final String? ipAddress;
  final String? userAgent;

  VerificationLog({
    required this.id,
    required this.qrName,
    required this.verifiedAt,
    required this.status,
    this.location,
    this.ipAddress,
    this.userAgent,
  });

  factory VerificationLog.fromJson(Map<String, dynamic> json) {
    return VerificationLog(
      id: json['_id'] ?? json['id'] ?? '',
      qrName: json['qrName'] ?? '',
      verifiedAt: json['verifiedAt'] != null ? DateTime.parse(json['verifiedAt']) : DateTime.now(),
      status: json['status'] ?? 'فاشل',
      location: json['location'],
      ipAddress: json['ipAddress'],
      userAgent: json['userAgent'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'qrName': qrName,
      'verifiedAt': verifiedAt.toIso8601String(),
      'status': status,
      'location': location,
      'ipAddress': ipAddress,
      'userAgent': userAgent,
    };
  }
}
