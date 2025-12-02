import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../providers/locale_provider.dart';
import '../models/book.dart';
import '../models/memory.dart';
import '../services/api_service.dart';

class BookDetailScreen extends StatefulWidget {
  final Book book;

  const BookDetailScreen({super.key, required this.book});

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  final ApiService _apiService = ApiService();
  List<Memory> _memories = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMemories();
  }

  Future<void> _loadMemories() async {
    setState(() => _isLoading = true);
    try {
      _memories = await _apiService.getMemories(widget.book.id);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading memories: $e')),
        );
      }
    }
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>();

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(widget.book.childName),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      AppColors.primary,
                      AppColors.primaryDark,
                    ],
                  ),
                ),
                child: widget.book.coverImage != null
                    ? Image.network(
                        widget.book.coverImage!,
                        fit: BoxFit.cover,
                        color: Colors.black.withOpacity(0.3),
                        colorBlendMode: BlendMode.darken,
                      )
                    : Center(
                        child: Icon(
                          Icons.auto_stories,
                          size: 80,
                          color: Colors.white.withOpacity(0.5),
                        ),
                      ),
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.settings),
                onPressed: () {
                  // TODO: Navigate to book settings
                },
              ),
            ],
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatusCard(locale),
                  const SizedBox(height: 24),
                  _buildMilestonesSection(locale),
                  const SizedBox(height: 24),
                  _buildMemoriesSection(locale),
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Add memory
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(locale.translate(
                'Ajout de souvenir à venir',
                'Add memory coming soon',
              )),
            ),
          );
        },
        icon: const Icon(Icons.add),
        label: Text(locale.translate('Ajouter', 'Add')),
      ),
    );
  }

  Widget _buildStatusCard(LocaleProvider locale) {
    String statusInfo = '';
    IconData statusIcon = Icons.info;
    
    switch (widget.book.status) {
      case BabyStatus.born:
        final months = widget.book.ageInMonths;
        if (months != null) {
          statusInfo = locale.translate(
            '$months mois',
            '$months months old',
          );
        }
        statusIcon = Icons.cake;
        break;
      case BabyStatus.expecting:
        final weeks = widget.book.weeksUntilDue;
        if (weeks != null) {
          statusInfo = locale.translate(
            '$weeks semaines avant l\'arrivée',
            '$weeks weeks until arrival',
          );
        }
        statusIcon = Icons.pregnant_woman;
        break;
      case BabyStatus.adoption:
        statusInfo = locale.translate(
          'En cours d\'adoption',
          'Adoption in progress',
        );
        statusIcon = Icons.favorite;
        break;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                statusIcon,
                color: AppColors.primary,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.book.statusLabel,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  if (statusInfo.isNotEmpty)
                    Text(
                      statusInfo,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms).slideX(begin: -0.1, end: 0);
  }

  Widget _buildMilestonesSection(LocaleProvider locale) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              locale.translate('Prochaines étapes', 'Upcoming milestones'),
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            TextButton(
              onPressed: () {
                // TODO: Show all milestones
              },
              child: Text(locale.translate('Voir tout', 'See all')),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: 3,
            itemBuilder: (context, index) {
              return Card(
                margin: const EdgeInsets.only(right: 12),
                child: Container(
                  width: 160,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: AppColors.secondary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.star,
                          color: AppColors.secondary,
                          size: 18,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        locale.translate('Étape $index', 'Milestone $index'),
                        style: Theme.of(context).textTheme.titleSmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ).animate(delay: (index * 100).ms).fadeIn().slideX(begin: 0.2, end: 0);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildMemoriesSection(LocaleProvider locale) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          locale.translate('Souvenirs', 'Memories'),
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        if (_isLoading)
          const Center(child: CircularProgressIndicator())
        else if (_memories.isEmpty)
          _buildEmptyMemories(locale)
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _memories.length,
            itemBuilder: (context, index) {
              final memory = _memories[index];
              return _MemoryCard(memory: memory, locale: locale);
            },
          ),
      ],
    );
  }

  Widget _buildEmptyMemories(LocaleProvider locale) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.photo_library_outlined,
                color: AppColors.primary,
                size: 32,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              locale.translate(
                'Aucun souvenir pour le moment',
                'No memories yet',
              ),
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              locale.translate(
                'Commencez à capturer les moments précieux',
                'Start capturing precious moments',
              ),
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms);
  }
}

class _MemoryCard extends StatelessWidget {
  final Memory memory;
  final LocaleProvider locale;

  const _MemoryCard({
    required this.memory,
    required this.locale,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          // TODO: View memory details
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              if (memory.photoUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    memory.photoUrl!,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      width: 80,
                      height: 80,
                      color: AppColors.primary.withOpacity(0.1),
                      child: const Icon(
                        Icons.image,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                )
              else
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.note,
                    color: AppColors.primary,
                  ),
                ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (memory.title != null)
                      Text(
                        memory.title!,
                        style: Theme.of(context).textTheme.titleMedium,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    if (memory.content != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        memory.content!,
                        style: Theme.of(context).textTheme.bodySmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    if (memory.memoryDate != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(
                            Icons.calendar_today,
                            size: 14,
                            color: AppColors.textMuted,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${memory.memoryDate!.day}/${memory.memoryDate!.month}/${memory.memoryDate!.year}',
                            style: Theme.of(context).textTheme.labelSmall,
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              if (memory.hasVideo)
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.videocam,
                    color: AppColors.secondary,
                    size: 20,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
