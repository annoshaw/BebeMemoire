import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../models/book.dart';
import '../models/memory.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiService {
  static const String baseUrl = '/api';
  final http.Client _client;

  ApiService({http.Client? client}) : _client = client ?? http.Client();

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
      throw ApiException('Erreur de connexion: $e');
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
          error['message'] ?? 'Erreur de connexion',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur de connexion: $e');
    }
  }

  Future<User> register({
    required String email,
    required String password,
    String? fullName,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: _headers,
        body: json.encode({
          'email': email,
          'password': password,
          'fullName': fullName,
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        return User.fromJson(data['user']);
      } else {
        final error = json.decode(response.body);
        throw ApiException(
          error['message'] ?? 'Erreur lors de l\'inscription',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur lors de l\'inscription: $e');
    }
  }

  Future<void> logout() async {
    try {
      await _client.post(
        Uri.parse('$baseUrl/auth/logout'),
        headers: _headers,
      );
    } catch (e) {
      throw ApiException('Erreur de déconnexion: $e');
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
          'Erreur lors du chargement des livres',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur lors du chargement des livres: $e');
    }
  }

  Future<Book> getBook(int id) async {
    try {
      final response = await _client.get(
        Uri.parse('$baseUrl/books/$id'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return Book.fromJson(json.decode(response.body));
      } else {
        throw ApiException(
          'Livre non trouvé',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur lors du chargement du livre: $e');
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
          error['message'] ?? 'Erreur lors de la création du livre',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur lors de la création du livre: $e');
    }
  }

  Future<Book> updateBook(int id, Map<String, dynamic> bookData) async {
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
          error['message'] ?? 'Erreur lors de la mise à jour du livre',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur lors de la mise à jour du livre: $e');
    }
  }

  Future<void> deleteBook(int id) async {
    try {
      final response = await _client.delete(
        Uri.parse('$baseUrl/books/$id'),
        headers: _headers,
      );

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          'Erreur lors de la suppression du livre',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur lors de la suppression du livre: $e');
    }
  }

  Future<List<Memory>> getMemories(int bookId) async {
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
          'Erreur lors du chargement des souvenirs',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur lors du chargement des souvenirs: $e');
    }
  }

  Future<Memory> createMemory(int bookId, Map<String, dynamic> memoryData) async {
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
          error['message'] ?? 'Erreur lors de la création du souvenir',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur lors de la création du souvenir: $e');
    }
  }

  Future<Memory> updateMemory(int memoryId, Map<String, dynamic> memoryData) async {
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
          error['message'] ?? 'Erreur lors de la mise à jour du souvenir',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur lors de la mise à jour du souvenir: $e');
    }
  }

  Future<void> deleteMemory(int memoryId) async {
    try {
      final response = await _client.delete(
        Uri.parse('$baseUrl/memories/$memoryId'),
        headers: _headers,
      );

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          'Erreur lors de la suppression du souvenir',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur lors de la suppression du souvenir: $e');
    }
  }
}
