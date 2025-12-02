enum BabyStatus {
  born,
  expecting,
  adoption,
}

class Book {
  final String id;
  final String userId;
  final String childName;
  final String? coverImage;
  final DateTime? birthDate;
  final DateTime? dueDate;
  final BabyStatus status;
  final bool notificationsEnabled;
  final bool emailNotifications;
  final bool pushNotifications;
  final int? notificationWeekday;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Book({
    required this.id,
    required this.userId,
    required this.childName,
    this.coverImage,
    this.birthDate,
    this.dueDate,
    this.status = BabyStatus.born,
    this.notificationsEnabled = true,
    this.emailNotifications = true,
    this.pushNotifications = false,
    this.notificationWeekday,
    this.createdAt,
    this.updatedAt,
  });

  factory Book.fromJson(Map<String, dynamic> json) {
    BabyStatus parseStatus(String? statusStr) {
      switch (statusStr) {
        case 'expecting':
          return BabyStatus.expecting;
        case 'adoption':
          return BabyStatus.adoption;
        default:
          return BabyStatus.born;
      }
    }

    return Book(
      id: json['id'].toString(),
      userId: json['userId'].toString(),
      childName: json['childName'] as String? ?? '',
      coverImage: json['coverImage'] as String?,
      birthDate: json['birthDate'] != null
          ? DateTime.parse(json['birthDate'] as String)
          : null,
      dueDate: json['dueDate'] != null
          ? DateTime.parse(json['dueDate'] as String)
          : null,
      status: parseStatus(json['status'] as String?),
      notificationsEnabled: json['notificationsEnabled'] as bool? ?? true,
      emailNotifications: json['emailNotifications'] as bool? ?? true,
      pushNotifications: json['pushNotifications'] as bool? ?? false,
      notificationWeekday: json['notificationWeekday'] as int?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    String statusToString() {
      switch (status) {
        case BabyStatus.expecting:
          return 'expecting';
        case BabyStatus.adoption:
          return 'adoption';
        default:
          return 'born';
      }
    }

    return {
      'id': id,
      'userId': userId,
      'childName': childName,
      'coverImage': coverImage,
      'birthDate': birthDate?.toIso8601String(),
      'dueDate': dueDate?.toIso8601String(),
      'status': statusToString(),
      'notificationsEnabled': notificationsEnabled,
      'emailNotifications': emailNotifications,
      'pushNotifications': pushNotifications,
      'notificationWeekday': notificationWeekday,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  Book copyWith({
    String? id,
    String? userId,
    String? childName,
    String? coverImage,
    DateTime? birthDate,
    DateTime? dueDate,
    BabyStatus? status,
    bool? notificationsEnabled,
    bool? emailNotifications,
    bool? pushNotifications,
    int? notificationWeekday,
  }) {
    return Book(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      childName: childName ?? this.childName,
      coverImage: coverImage ?? this.coverImage,
      birthDate: birthDate ?? this.birthDate,
      dueDate: dueDate ?? this.dueDate,
      status: status ?? this.status,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      emailNotifications: emailNotifications ?? this.emailNotifications,
      pushNotifications: pushNotifications ?? this.pushNotifications,
      notificationWeekday: notificationWeekday ?? this.notificationWeekday,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  String get statusLabel {
    switch (status) {
      case BabyStatus.expecting:
        return 'En attente';
      case BabyStatus.adoption:
        return 'Adoption';
      default:
        return 'Né(e)';
    }
  }

  int? get ageInMonths {
    if (birthDate == null || status != BabyStatus.born) return null;
    final now = DateTime.now();
    final difference = now.difference(birthDate!);
    return (difference.inDays / 30).floor();
  }

  int? get weeksUntilDue {
    if (dueDate == null || status != BabyStatus.expecting) return null;
    final now = DateTime.now();
    final difference = dueDate!.difference(now);
    return (difference.inDays / 7).ceil();
  }
}
