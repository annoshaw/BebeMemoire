class Memory {
  final int id;
  final int bookId;
  final String? title;
  final String? content;
  final DateTime? memoryDate;
  final String? photoUrl;
  final String? videoUrl;
  final String? qrCodeUrl;
  final String? category;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Memory({
    required this.id,
    required this.bookId,
    this.title,
    this.content,
    this.memoryDate,
    this.photoUrl,
    this.videoUrl,
    this.qrCodeUrl,
    this.category,
    this.createdAt,
    this.updatedAt,
  });

  factory Memory.fromJson(Map<String, dynamic> json) {
    return Memory(
      id: json['id'] as int,
      bookId: json['bookId'] as int,
      title: json['title'] as String?,
      content: json['content'] as String?,
      memoryDate: json['memoryDate'] != null
          ? DateTime.parse(json['memoryDate'] as String)
          : null,
      photoUrl: json['photoUrl'] as String?,
      videoUrl: json['videoUrl'] as String?,
      qrCodeUrl: json['qrCodeUrl'] as String?,
      category: json['category'] as String?,
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
      'bookId': bookId,
      'title': title,
      'content': content,
      'memoryDate': memoryDate?.toIso8601String(),
      'photoUrl': photoUrl,
      'videoUrl': videoUrl,
      'qrCodeUrl': qrCodeUrl,
      'category': category,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  Memory copyWith({
    int? id,
    int? bookId,
    String? title,
    String? content,
    DateTime? memoryDate,
    String? photoUrl,
    String? videoUrl,
    String? qrCodeUrl,
    String? category,
  }) {
    return Memory(
      id: id ?? this.id,
      bookId: bookId ?? this.bookId,
      title: title ?? this.title,
      content: content ?? this.content,
      memoryDate: memoryDate ?? this.memoryDate,
      photoUrl: photoUrl ?? this.photoUrl,
      videoUrl: videoUrl ?? this.videoUrl,
      qrCodeUrl: qrCodeUrl ?? this.qrCodeUrl,
      category: category ?? this.category,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  bool get hasMedia => photoUrl != null || videoUrl != null;
  bool get hasVideo => videoUrl != null;
}
