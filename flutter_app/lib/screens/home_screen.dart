import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/books_provider.dart';
import '../providers/locale_provider.dart';
import '../models/book.dart';
import 'create_book_screen.dart';
import 'book_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BooksProvider>().loadBooks();
    });
  }

  void _openCreateBook() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const CreateBookScreen(),
        fullscreenDialog: true,
      ),
    );
    
    if (mounted) {
      context.read<BooksProvider>().loadBooks();
    }
  }

  void _openBookDetail(Book book) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BookDetailScreen(book: book),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>();
    final authProvider = context.watch<AuthProvider>();
    final booksProvider = context.watch<BooksProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Memoria'),
        actions: [
          IconButton(
            icon: Text(
              locale.isFrench ? 'EN' : 'FR',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
            onPressed: () => locale.toggleLocale(),
          ),
          PopupMenuButton<String>(
            icon: CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primary.withOpacity(0.1),
              child: Text(
                authProvider.user?.initials ?? 'U',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ),
            onSelected: (value) async {
              if (value == 'logout') {
                await authProvider.logout();
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'profile',
                child: Row(
                  children: [
                    const Icon(Icons.person_outline, size: 20),
                    const SizedBox(width: 12),
                    Text(locale.translate('Mon profil', 'My profile')),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'settings',
                child: Row(
                  children: [
                    const Icon(Icons.settings_outlined, size: 20),
                    const SizedBox(width: 12),
                    Text(locale.translate('Paramètres', 'Settings')),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    const Icon(Icons.logout, size: 20, color: AppColors.error),
                    const SizedBox(width: 12),
                    Text(
                      locale.translate('Déconnexion', 'Logout'),
                      style: const TextStyle(color: AppColors.error),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => booksProvider.loadBooks(),
        child: booksProvider.isLoading
            ? const Center(child: CircularProgressIndicator())
            : booksProvider.books.isEmpty
                ? _buildEmptyState(locale)
                : _buildBooksList(booksProvider.books, locale),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreateBook,
        icon: const Icon(Icons.add),
        label: Text(locale.translate('Nouveau livre', 'New book')),
      ),
    );
  }

  Widget _buildEmptyState(LocaleProvider locale) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(25),
              ),
              child: const Icon(
                Icons.auto_stories_outlined,
                size: 50,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              locale.translate(
                'Aucun livre pour le moment',
                'No books yet',
              ),
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              locale.translate(
                'Créez votre premier livre de souvenirs pour commencer à capturer les moments précieux de votre enfant.',
                'Create your first memory book to start capturing your child\'s precious moments.',
              ),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBooksList(List<Book> books, LocaleProvider locale) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: books.length,
      itemBuilder: (context, index) {
        final book = books[index];
        return _BookCard(
          book: book, 
          locale: locale,
          onTap: () => _openBookDetail(book),
        );
      },
    );
  }
}

class _BookCard extends StatelessWidget {
  final Book book;
  final LocaleProvider locale;
  final VoidCallback onTap;

  const _BookCard({
    required this.book,
    required this.locale,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 80,
                height: 100,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  image: book.coverImage != null
                      ? DecorationImage(
                          image: NetworkImage(book.coverImage!),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: book.coverImage == null
                    ? const Icon(
                        Icons.auto_stories,
                        color: AppColors.primary,
                        size: 32,
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      book.childName,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _getStatusColor(book.status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        _getStatusLabel(book.status),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: _getStatusColor(book.status),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (book.status == BabyStatus.born && book.ageInMonths != null)
                      Text(
                        locale.translate(
                          '${book.ageInMonths} mois',
                          '${book.ageInMonths} months',
                        ),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    if (book.status == BabyStatus.expecting && book.weeksUntilDue != null)
                      Text(
                        locale.translate(
                          '${book.weeksUntilDue} semaines restantes',
                          '${book.weeksUntilDue} weeks remaining',
                        ),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right,
                color: AppColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(BabyStatus status) {
    switch (status) {
      case BabyStatus.expecting:
        return AppColors.info;
      case BabyStatus.adoption:
        return AppColors.secondary;
      default:
        return AppColors.success;
    }
  }

  String _getStatusLabel(BabyStatus status) {
    switch (status) {
      case BabyStatus.expecting:
        return locale.translate('En attente', 'Expecting');
      case BabyStatus.adoption:
        return locale.translate('Adoption', 'Adoption');
      default:
        return locale.translate('Né(e)', 'Born');
    }
  }
}
