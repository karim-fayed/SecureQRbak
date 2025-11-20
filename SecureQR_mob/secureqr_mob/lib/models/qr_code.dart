class QRCode {
  final String id;
  final String name;
  final String? description;
  final String verificationCode;
  final int useCount;
  final int? useLimit;
  final DateTime? expiresAt;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final String status; // 'نشط' or 'منتهي'

  QRCode({
    required this.id,
    required this.name,
    this.description,
    required this.verificationCode,
    required this.useCount,
    this.useLimit,
    this.expiresAt,
    required this.createdAt,
    this.updatedAt,
    required this.status,
  });

  factory QRCode.fromJson(Map<String, dynamic> json) {
    return QRCode(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      verificationCode: json['verificationCode'] ?? '',
      useCount: json['useCount'] ?? 0,
      useLimit: json['useLimit'],
      expiresAt: json['expiresAt'] != null ? DateTime.parse(json['expiresAt']) : null,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      status: json['status'] ?? 'نشط',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'verificationCode': verificationCode,
      'useCount': useCount,
      'useLimit': useLimit,
      'expiresAt': expiresAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'status': status,
    };
  }

  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }

  bool get isActive => !isExpired && status == 'نشط';
}
