class User {
  final int id;
  final String? email;
  final String? fullName;
  final String? firstName;
  final String? lastName;
  final String? profileImageUrl;
  final String? address;
  final String? gender;
  final String? phone;
  final String? country;
  final String authProvider;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  User({
    required this.id,
    this.email,
    this.fullName,
    this.firstName,
    this.lastName,
    this.profileImageUrl,
    this.address,
    this.gender,
    this.phone,
    this.country,
    this.authProvider = 'email',
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      email: json['email'] as String?,
      fullName: json['fullName'] as String?,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      profileImageUrl: json['profileImageUrl'] as String?,
      address: json['address'] as String?,
      gender: json['gender'] as String?,
      phone: json['phone'] as String?,
      country: json['country'] as String?,
      authProvider: json['authProvider'] as String? ?? 'email',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'firstName': firstName,
      'lastName': lastName,
      'profileImageUrl': profileImageUrl,
      'address': address,
      'gender': gender,
      'phone': phone,
      'country': country,
      'authProvider': authProvider,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  String get displayName {
    if (fullName != null && fullName!.isNotEmpty) return fullName!;
    if (firstName != null && lastName != null) {
      return '$firstName $lastName'.trim();
    }
    if (firstName != null) return firstName!;
    if (email != null) return email!.split('@').first;
    return 'Utilisateur';
  }

  String get initials {
    final name = displayName;
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : 'U';
  }
}
