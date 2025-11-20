class SyncStatus {
  final bool isRunning;
  final DateTime? lastSync;
  final int totalRecords;
  final int syncedRecords;
  final int failedRecords;
  final String? lastError;
  final Map<String, dynamic> databaseHealth;

  SyncStatus({
    required this.isRunning,
    this.lastSync,
    required this.totalRecords,
    required this.syncedRecords,
    required this.failedRecords,
    this.lastError,
    required this.databaseHealth,
  });

  factory SyncStatus.fromJson(Map<String, dynamic> json) {
    return SyncStatus(
      isRunning: json['isRunning'] ?? false,
      lastSync: json['lastSync'] != null ? DateTime.parse(json['lastSync']) : null,
      totalRecords: json['totalRecords'] ?? 0,
      syncedRecords: json['syncedRecords'] ?? 0,
      failedRecords: json['failedRecords'] ?? 0,
      lastError: json['lastError'],
      databaseHealth: json['databaseHealth'] ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'isRunning': isRunning,
      'lastSync': lastSync?.toIso8601String(),
      'totalRecords': totalRecords,
      'syncedRecords': syncedRecords,
      'failedRecords': failedRecords,
      'lastError': lastError,
      'databaseHealth': databaseHealth,
    };
  }

  bool get isHealthy => databaseHealth['mongodb'] == true && databaseHealth['sqlserver'] == true;
}
