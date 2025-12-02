class BookTemplate {
  final String id;
  final String slug;
  final String nameFr;
  final String nameEn;
  final String? descriptionFr;
  final String? descriptionEn;
  final String? coverImage;
  final String? iconName;
  final bool isActive;
  final int sortOrder;

  BookTemplate({
    required this.id,
    required this.slug,
    required this.nameFr,
    required this.nameEn,
    this.descriptionFr,
    this.descriptionEn,
    this.coverImage,
    this.iconName,
    this.isActive = true,
    this.sortOrder = 0,
  });

  factory BookTemplate.fromJson(Map<String, dynamic> json) {
    return BookTemplate(
      id: json['id'] as String,
      slug: json['slug'] as String,
      nameFr: json['nameFr'] as String,
      nameEn: json['nameEn'] as String,
      descriptionFr: json['descriptionFr'] as String?,
      descriptionEn: json['descriptionEn'] as String?,
      coverImage: json['coverImage'] as String?,
      iconName: json['iconName'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      sortOrder: json['sortOrder'] as int? ?? 0,
    );
  }

  String getName(bool isFrench) => isFrench ? nameFr : nameEn;
  String? getDescription(bool isFrench) => isFrench ? descriptionFr : descriptionEn;

  bool get isPrebuilt => slug != 'custom';
}

class TemplateSection {
  final String id;
  final String templateId;
  final int orderIndex;
  final String titleFr;
  final String titleEn;
  final String? subtitleFr;
  final String? subtitleEn;
  final String? descriptionFr;
  final String? descriptionEn;
  final String layoutStyle;
  final String sectionType;
  final int? dateOffsetDays;
  final int? monthNumber;
  final String? iconName;
  final bool isRequired;

  TemplateSection({
    required this.id,
    required this.templateId,
    required this.orderIndex,
    required this.titleFr,
    required this.titleEn,
    this.subtitleFr,
    this.subtitleEn,
    this.descriptionFr,
    this.descriptionEn,
    this.layoutStyle = 'single',
    required this.sectionType,
    this.dateOffsetDays,
    this.monthNumber,
    this.iconName,
    this.isRequired = false,
  });

  factory TemplateSection.fromJson(Map<String, dynamic> json) {
    return TemplateSection(
      id: json['id'] as String,
      templateId: json['templateId'] as String,
      orderIndex: json['orderIndex'] as int,
      titleFr: json['titleFr'] as String,
      titleEn: json['titleEn'] as String,
      subtitleFr: json['subtitleFr'] as String?,
      subtitleEn: json['subtitleEn'] as String?,
      descriptionFr: json['descriptionFr'] as String?,
      descriptionEn: json['descriptionEn'] as String?,
      layoutStyle: json['layoutStyle'] as String? ?? 'single',
      sectionType: json['sectionType'] as String,
      dateOffsetDays: json['dateOffsetDays'] as int?,
      monthNumber: json['monthNumber'] as int?,
      iconName: json['iconName'] as String?,
      isRequired: json['isRequired'] as bool? ?? false,
    );
  }

  String getTitle(bool isFrench) => isFrench ? titleFr : titleEn;
  String? getSubtitle(bool isFrench) => isFrench ? subtitleFr : subtitleEn;
  String? getDescription(bool isFrench) => isFrench ? descriptionFr : descriptionEn;
}
