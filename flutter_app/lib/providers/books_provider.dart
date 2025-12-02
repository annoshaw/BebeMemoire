import 'package:flutter/foundation.dart';
import '../models/book.dart';
import '../services/api_service.dart';

class BooksProvider with ChangeNotifier {
  final ApiService _apiService;
  
  List<Book> _books = [];
  Book? _selectedBook;
  bool _isLoading = false;
  String? _error;

  BooksProvider({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  List<Book> get books => _books;
  Book? get selectedBook => _selectedBook;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadBooks() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _books = await _apiService.getBooks();
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadBook(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _selectedBook = await _apiService.getBook(id);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Book?> createBook(Map<String, dynamic> bookData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final book = await _apiService.createBook(bookData);
      _books.add(book);
      _selectedBook = book;
      _isLoading = false;
      notifyListeners();
      return book;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> updateBook(int id, Map<String, dynamic> bookData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final updatedBook = await _apiService.updateBook(id, bookData);
      final index = _books.indexWhere((b) => b.id == id);
      if (index != -1) {
        _books[index] = updatedBook;
      }
      if (_selectedBook?.id == id) {
        _selectedBook = updatedBook;
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteBook(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _apiService.deleteBook(id);
      _books.removeWhere((b) => b.id == id);
      if (_selectedBook?.id == id) {
        _selectedBook = null;
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void selectBook(Book book) {
    _selectedBook = book;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
