class User {
  final String id;
  final String name;
  final String email;
  final String? role;
  final Map<String, dynamic>? subscription;
  final Map<String, dynamic>? apiKeys;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.role,
    this.subscription,
    this.apiKeys,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'],
      subscription: json['subscription'],
      apiKeys: json['apiKeys'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'role': role,
      'subscription': subscription,
      'apiKeys': apiKeys,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
