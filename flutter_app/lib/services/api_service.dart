import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:http/browser_client.dart';
import '../models/user.dart';
import '../models/book.dart';
import '../models/memory.dart';
import '../models/book_template.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class NotificationSettings {
  final bool notificationsEnabled;
  final bool emailNotifications;
  final bool pushNotifications;
  final int reminderDays;
  final int? notificationWeekday;

  NotificationSettings({
    this.notificationsEnabled = true,
    this.emailNotifications = true,
    this.pushNotifications = false,
    this.reminderDays = 1,
    this.notificationWeekday,
  });

  factory NotificationSettings.fromJson(Map<String, dynamic> json) {
    return NotificationSettings(
      notificationsEnabled: json['notificationsEnabled'] as bool? ?? true,
      emailNotifications: json['emailNotifications'] as bool? ?? true,
      pushNotifications: json['pushNotifications'] as bool? ?? false,
      reminderDays: json['reminderDays'] as int? ?? 1,
      notificationWeekday: json['notificationWeekday'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'notificationsEnabled': notificationsEnabled,
      'emailNotifications': emailNotifications,
      'pushNotifications': pushNotifications,
      'reminderDays': reminderDays,
      'notificationWeekday': notificationWeekday,
    };
  }
}

class ApiService {
  static const String baseUrl = '/api';
  late final http.Client _client;

  ApiService({http.Client? client}) {
    if (client != null) {
      _client = client;
    } else if (kIsWeb) {
      final browserClient = BrowserClient();
      browserClient.withCredentials = true;
      _client = browserClient;
    } else {
      _client = http.Client();
    }
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  Future<User?> getCurrentUser() async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/auth/user'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['user'] != null) {
          return User.fromJson(data['user']);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<User> login(String email, String password) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: _headers,
        body: json.encode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return User.fromJson(data['user']);
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['message'] ?? 'Login error',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Connection error');
    }
  }

  Future<User> register({
    required String email,
    required String password,
    String? fullName,
    String? gender,
    String? country,
    String? phone,
  }) async {
    try {
      final body = <String, dynamic>{
        'email': email,
        'password': password,
      };
      if (fullName != null) body['fullName'] = fullName;
      if (gender != null) body['gender'] = gender;
      if (country != null) body['country'] = country;
      if (phone != null) body['phone'] = phone;
      
      final response = await _client.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: _headers,
        body: json.encode(body),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        return User.fromJson(data['user']);
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['message'] ?? 'Registration error',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Registration error');
    }
  }

  Future<void> logout() async {
    try {
      await _client.post(
        Uri.parse('$baseUrl/auth/logout'),
        headers: _headers,
      );
    } catch (e) {
      // Ignore logout errors
    }
  }

  Future<Map<String, dynamic>> getOnboardingState() async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/onboarding/state'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return json.decode(response.body) as Map<String, dynamic>;
      } else {
        throw ApiException(
          'Failed to get onboarding state',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to get onboarding state');
    }
  }

  Future<Map<String, dynamic>> completeOnboarding({
    required String bookType, // 'born', 'expecting', 'adoption'
    required String childName,
    required DateTime date,
    required String notificationFrequency, // 'daily', 'weekly', 'monthly', 'none'
    String? babyGender,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/onboarding'),
        headers: _headers,
        body: json.encode({
          'bookType': bookType,
          'childName': childName,
          'date': date.toIso8601String(),
          'notificationFrequency': notificationFrequency,
          if (babyGender != null) 'babyGender': babyGender,
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return json.decode(response.body) as Map<String, dynamic>;
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['message'] ?? 'Failed to complete onboarding',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to complete onboarding');
    }
  }

  Future<User> updateUserProfile({
    String? gender,
    String? country,
    String? phone,
    String? fullName,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (gender != null) body['gender'] = gender;
      if (country != null) body['country'] = country;
      if (phone != null) body['phone'] = phone;
      if (fullName != null) body['fullName'] = fullName;

      final response = await _client.patch(
        Uri.parse('$baseUrl/auth/user'),
        headers: _headers,
        body: json.encode(body),
      );

      if (response.statusCode == 200) {
        return User.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['message'] ?? 'Failed to update profile',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to update profile');
    }
  }

  Future<List<Book>> getBooks() async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/books'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Book.fromJson(json)).toList();
      } else {
        throw ApiException(
          'Failed to load books',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to load books');
    }
  }

  Future<Book> getBook(dynamic id) async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/books/$id'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return Book.fromJson(json.decode(response.body));
      } else {
        throw ApiException(
          'Book not found',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to load book');
    }
  }

  Future<Book> createBook(Map<String, dynamic> bookData) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/books'),
        headers: _headers,
        body: json.encode(bookData),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return Book.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['message'] ?? 'Failed to create book',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to create book');
    }
  }

  Future<Book> updateBook(dynamic id, Map<String, dynamic> bookData) async {
    try {
      final response = await _client.patch(
        Uri.parse('$baseUrl/books/$id'),
        headers: _headers,
        body: json.encode(bookData),
      );

      if (response.statusCode == 200) {
        return Book.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['message'] ?? 'Failed to update book',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to update book');
    }
  }

  Future<void> deleteBook(dynamic id) async {
    try {
      final response = await _client.delete(
        Uri.parse('$baseUrl/books/$id'),
        headers: _headers,
      );

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          'Failed to delete book',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to delete book');
    }
  }

  Future<List<Memory>> getMemories(dynamic bookId) async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/books/$bookId/memories'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Memory.fromJson(json)).toList();
      } else {
        throw ApiException(
          'Failed to load memories',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to load memories');
    }
  }

  Future<Memory> createMemory(dynamic bookId, Map<String, dynamic> memoryData) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/books/$bookId/memories'),
        headers: _headers,
        body: json.encode(memoryData),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return Memory.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['message'] ?? 'Failed to create memory',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to create memory');
    }
  }

  Future<Memory> updateMemory(dynamic memoryId, Map<String, dynamic> memoryData) async {
    try {
      final response = await _client.patch(
        Uri.parse('$baseUrl/memories/$memoryId'),
        headers: _headers,
        body: json.encode(memoryData),
      );

      if (response.statusCode == 200) {
        return Memory.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['message'] ?? 'Failed to update memory',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to update memory');
    }
  }

  Future<void> deleteMemory(dynamic memoryId) async {
    try {
      final response = await _client.delete(
        Uri.parse('$baseUrl/memories/$memoryId'),
        headers: _headers,
      );

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          'Failed to delete memory',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to delete memory');
    }
  }

  Future<NotificationSettings> getNotificationSettings(dynamic bookId) async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/books/$bookId/notification-settings'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return NotificationSettings.fromJson(data['settings'] ?? data);
      } else {
        throw ApiException(
          'Failed to load notification settings',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to load notification settings');
    }
  }

  Future<NotificationSettings> updateNotificationSettings(
    dynamic bookId,
    NotificationSettings settings,
  ) async {
    try {
      final response = await _client.patch(
        Uri.parse('$baseUrl/books/$bookId/notification-settings'),
        headers: _headers,
        body: json.encode(settings.toJson()),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return NotificationSettings.fromJson(data['settings'] ?? data);
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['message'] ?? 'Failed to update notification settings',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to update notification settings');
    }
  }

  Future<List<Map<String, dynamic>>> getUpcomingMilestones(dynamic bookId) async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/books/$bookId/milestones'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          'Failed to load milestones',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to load milestones');
    }
  }

  Future<List<Map<String, dynamic>>> generateNotifications(dynamic bookId) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/books/$bookId/generate-notifications'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return (data['notifications'] as List? ?? []).cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          'Failed to generate notifications',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to generate notifications');
    }
  }

  Future<AgeInfo> getBookAge(String bookId) async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/books/$bookId/age'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return AgeInfo.fromJson(data['age'] ?? data);
      } else {
        throw ApiException(
          'Failed to get age info',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to get age info');
    }
  }

  Future<List<BookTemplate>> getBookTemplates() async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/book-templates'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> templates = data['templates'] ?? [];
        return templates.map((t) => BookTemplate.fromJson(t)).toList();
      } else {
        throw ApiException(
          'Failed to load templates',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to load templates');
    }
  }

  Future<List<TemplateSection>> getTemplateSections(String templateSlug) async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/book-templates/$templateSlug/sections'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> sections = data['sections'] ?? [];
        return sections.map((s) => TemplateSection.fromJson(s)).toList();
      } else {
        throw ApiException(
          'Failed to load template sections',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to load template sections');
    }
  }

  Future<Book> createBookWithTemplate(Map<String, dynamic> bookData, String templateSlug) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/books'),
        headers: _headers,
        body: json.encode({
          ...bookData,
          'templateSlug': templateSlug,
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        return Book.fromJson(data['book']);
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['message'] ?? 'Failed to create book with template',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to create book with template');
    }
  }

  Future<Book> createCustomBook(Map<String, dynamic> bookData) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/books'),
        headers: _headers,
        body: json.encode({
          ...bookData,
          'templateSlug': 'custom',
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        return Book.fromJson(data['book']);
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['message'] ?? 'Failed to create custom book',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Failed to create custom book');
    }
  }
}

class AgeInfo {
  final String type;
  final String message;
  final String childName;
  
  final int? years;
  final int? months;
  final int? days;
  final int? totalDays;
  final int? totalWeeks;
  final int? totalMonths;
  final DateTime? birthDate;
  
  final int? weeksPregnant;
  final int? monthsPregnant;
  final int? weeksUntilDue;
  final int? daysUntilDue;
  final int? trimester;
  final bool? isPastDue;
  final DateTime? dueDate;

  AgeInfo({
    required this.type,
    required this.message,
    required this.childName,
    this.years,
    this.months,
    this.days,
    this.totalDays,
    this.totalWeeks,
    this.totalMonths,
    this.birthDate,
    this.weeksPregnant,
    this.monthsPregnant,
    this.weeksUntilDue,
    this.daysUntilDue,
    this.trimester,
    this.isPastDue,
    this.dueDate,
  });

  factory AgeInfo.fromJson(Map<String, dynamic> json) {
    return AgeInfo(
      type: json['type'] as String,
      message: json['message'] as String,
      childName: json['childName'] as String,
      years: json['years'] as int?,
      months: json['months'] as int?,
      days: json['days'] as int?,
      totalDays: json['totalDays'] as int?,
      totalWeeks: json['totalWeeks'] as int?,
      totalMonths: json['totalMonths'] as int?,
      birthDate: json['birthDate'] != null
          ? DateTime.parse(json['birthDate'] as String)
          : null,
      weeksPregnant: json['weeksPregnant'] as int?,
      monthsPregnant: json['monthsPregnant'] as int?,
      weeksUntilDue: json['weeksUntilDue'] as int?,
      daysUntilDue: json['daysUntilDue'] as int?,
      trimester: json['trimester'] as int?,
      isPastDue: json['isPastDue'] as bool?,
      dueDate: json['dueDate'] != null
          ? DateTime.parse(json['dueDate'] as String)
          : null,
    );
  }

  bool get isPregnancy => type == 'pregnancy';
  bool get isBorn => type == 'born';
  bool get isAdoption => type == 'adoption';
}
