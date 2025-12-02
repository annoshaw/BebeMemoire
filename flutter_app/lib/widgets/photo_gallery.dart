import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../models/memory.dart';
import '../providers/locale_provider.dart';

class PhotoGallery extends StatelessWidget {
  final List<Memory> memories;
  final Function(Memory)? onMemoryTap;
  final Function()? onAddMemory;

  const PhotoGallery({
    super.key,
    required this.memories,
    this.onMemoryTap,
    this.onAddMemory,
  });

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleProvider>();

    if (memories.isEmpty) {
      return _EmptyGallery(onAddMemory: onAddMemory, locale: locale);
    }

    final groupedMemories = _groupMemoriesByMonth(memories);

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: groupedMemories.length,
      itemBuilder: (context, index) {
        final group = groupedMemories[index];
        return _TimelineSection(
          month: group.month,
          year: group.year,
          memories: group.memories,
          onMemoryTap: onMemoryTap,
          index: index,
          locale: locale,
        );
      },
    );
  }

  List<_MemoryGroup> _groupMemoriesByMonth(List<Memory> memories) {
    final Map<String, List<Memory>> grouped = {};

    for (final memory in memories) {
      final date = memory.memoryDate ?? memory.createdAt ?? DateTime.now();
      final key = '${date.year}-${date.month.toString().padLeft(2, '0')}';

      if (!grouped.containsKey(key)) {
        grouped[key] = [];
      }
      grouped[key]!.add(memory);
    }

    final sortedKeys = grouped.keys.toList()..sort((a, b) => b.compareTo(a));

    return sortedKeys.map((key) {
      final parts = key.split('-');
      return _MemoryGroup(
        year: int.parse(parts[0]),
        month: int.parse(parts[1]),
        memories: grouped[key]!,
      );
    }).toList();
  }
}

class _MemoryGroup {
  final int year;
  final int month;
  final List<Memory> memories;

  _MemoryGroup({
    required this.year,
    required this.month,
    required this.memories,
  });
}

class _TimelineSection extends StatelessWidget {
  final int month;
  final int year;
  final List<Memory> memories;
  final Function(Memory)? onMemoryTap;
  final int index;
  final LocaleProvider locale;

  const _TimelineSection({
    required this.month,
    required this.year,
    required this.memories,
    this.onMemoryTap,
    required this.index,
    required this.locale,
  });

  String get _monthName {
    const monthsFr = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const monthsEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return locale.isFrench ? monthsFr[month - 1] : monthsEn[month - 1];
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 40,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [AppColors.primary, AppColors.primaryLight],
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _monthName,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    '$year',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  locale.translate(
                    '${memories.length} souvenir${memories.length > 1 ? 's' : ''}',
                    '${memories.length} ${memories.length > 1 ? 'memories' : 'memory'}',
                  ),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ).animate(delay: (index * 100).ms).fadeIn().slideX(begin: -0.1),
          const SizedBox(height: 16),
          _buildPhotoGrid(context),
        ],
      ),
    );
  }

  Widget _buildPhotoGrid(BuildContext context) {
    final photosWithImages = memories.where((m) => m.photoUrl != null).toList();
    final textsOnly = memories.where((m) => m.photoUrl == null).toList();

    return Column(
      children: [
        if (photosWithImages.isNotEmpty)
          _PhotoCollage(
            memories: photosWithImages,
            onMemoryTap: onMemoryTap,
            sectionIndex: index,
          ),
        ...textsOnly.asMap().entries.map((entry) => 
          _TextMemoryCard(
            memory: entry.value,
            onTap: onMemoryTap,
            index: entry.key,
            sectionIndex: index,
          ),
        ),
      ],
    );
  }
}

class _PhotoCollage extends StatelessWidget {
  final List<Memory> memories;
  final Function(Memory)? onMemoryTap;
  final int sectionIndex;

  const _PhotoCollage({
    required this.memories,
    this.onMemoryTap,
    required this.sectionIndex,
  });

  @override
  Widget build(BuildContext context) {
    final photoCount = memories.length;

    if (photoCount == 1) {
      return _SinglePhoto(
        memory: memories[0],
        onTap: onMemoryTap,
        index: sectionIndex,
      );
    } else if (photoCount == 2) {
      return _TwoPhotos(
        memories: memories,
        onTap: onMemoryTap,
        index: sectionIndex,
      );
    } else if (photoCount == 3) {
      return _ThreePhotos(
        memories: memories,
        onTap: onMemoryTap,
        index: sectionIndex,
      );
    } else {
      return _GridPhotos(
        memories: memories,
        onTap: onMemoryTap,
        index: sectionIndex,
      );
    }
  }
}

class _SinglePhoto extends StatelessWidget {
  final Memory memory;
  final Function(Memory)? onTap;
  final int index;

  const _SinglePhoto({
    required this.memory,
    this.onTap,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onTap?.call(memory),
      child: Container(
        height: 280,
        margin: const EdgeInsets.only(bottom: 12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.network(
                memory.photoUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _PhotoPlaceholder(),
              ),
              _PhotoOverlay(memory: memory),
              if (memory.hasVideo) _VideoIndicator(),
            ],
          ),
        ),
      ),
    ).animate(delay: (index * 50).ms).fadeIn().scale(begin: const Offset(0.95, 0.95));
  }
}

class _TwoPhotos extends StatelessWidget {
  final List<Memory> memories;
  final Function(Memory)? onTap;
  final int index;

  const _TwoPhotos({
    required this.memories,
    this.onTap,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: Row(
        children: [
          Expanded(
            child: _PhotoTile(
              memory: memories[0],
              onTap: onTap,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                bottomLeft: Radius.circular(20),
              ),
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: _PhotoTile(
              memory: memories[1],
              onTap: onTap,
              borderRadius: const BorderRadius.only(
                topRight: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
            ),
          ),
        ],
      ),
    ).animate(delay: (index * 50).ms).fadeIn().scale(begin: const Offset(0.95, 0.95));
  }
}

class _ThreePhotos extends StatelessWidget {
  final List<Memory> memories;
  final Function(Memory)? onTap;
  final int index;

  const _ThreePhotos({
    required this.memories,
    this.onTap,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 240,
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: _PhotoTile(
              memory: memories[0],
              onTap: onTap,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                bottomLeft: Radius.circular(20),
              ),
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              children: [
                Expanded(
                  child: _PhotoTile(
                    memory: memories[1],
                    onTap: onTap,
                    borderRadius: const BorderRadius.only(
                      topRight: Radius.circular(20),
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Expanded(
                  child: _PhotoTile(
                    memory: memories[2],
                    onTap: onTap,
                    borderRadius: const BorderRadius.only(
                      bottomRight: Radius.circular(20),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate(delay: (index * 50).ms).fadeIn().scale(begin: const Offset(0.95, 0.95));
  }
}

class _GridPhotos extends StatelessWidget {
  final List<Memory> memories;
  final Function(Memory)? onTap;
  final int index;

  const _GridPhotos({
    required this.memories,
    this.onTap,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final int visibleCount = 6;
    final int extraCount = memories.length > visibleCount ? memories.length - visibleCount : 0;
    final bool showOverlay = extraCount > 0;

    return SizedBox(
      height: 280,
      child: Row(
        children: [
          Expanded(
            child: _PhotoTile(
              memory: memories[0],
              onTap: onTap,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                bottomLeft: Radius.circular(20),
              ),
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        child: _PhotoTile(
                          memory: memories[1],
                          onTap: onTap,
                          borderRadius: BorderRadius.zero,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: _PhotoTile(
                          memory: memories[2],
                          onTap: onTap,
                          borderRadius: const BorderRadius.only(
                            topRight: Radius.circular(20),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        child: _PhotoTile(
                          memory: memories[3],
                          onTap: onTap,
                          borderRadius: BorderRadius.zero,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: memories.length > 4
                            ? _PhotoTile(
                                memory: memories[4],
                                onTap: onTap,
                                borderRadius: BorderRadius.zero,
                              )
                            : const SizedBox(),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            if (memories.length > 5)
                              _PhotoTile(
                                memory: memories[5],
                                onTap: onTap,
                                borderRadius: const BorderRadius.only(
                                  bottomRight: Radius.circular(20),
                                ),
                              )
                            else
                              Container(
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withOpacity(0.1),
                                  borderRadius: const BorderRadius.only(
                                    bottomRight: Radius.circular(20),
                                  ),
                                ),
                              ),
                            if (showOverlay)
                              Container(
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.6),
                                  borderRadius: const BorderRadius.only(
                                    bottomRight: Radius.circular(20),
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    '+$extraCount',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate(delay: (index * 50).ms).fadeIn().scale(begin: const Offset(0.95, 0.95));
  }
}

class _PhotoTile extends StatelessWidget {
  final Memory memory;
  final Function(Memory)? onTap;
  final BorderRadius borderRadius;

  const _PhotoTile({
    required this.memory,
    this.onTap,
    required this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onTap?.call(memory),
      child: ClipRRect(
        borderRadius: borderRadius,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              memory.photoUrl!,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _PhotoPlaceholder(),
            ),
            if (memory.hasVideo) _VideoIndicator(),
          ],
        ),
      ),
    );
  }
}

class _PhotoOverlay extends StatelessWidget {
  final Memory memory;

  const _PhotoOverlay({required this.memory});

  @override
  Widget build(BuildContext context) {
    if (memory.title == null && memory.content == null) return const SizedBox();

    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              Colors.black.withOpacity(0.7),
            ],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (memory.title != null)
              Text(
                memory.title!,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            if (memory.content != null) ...[
              const SizedBox(height: 4),
              Text(
                memory.content!,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.9),
                  fontSize: 14,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _VideoIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 12,
      right: 12,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Icon(
          Icons.play_arrow,
          color: Colors.white,
          size: 20,
        ),
      ),
    );
  }
}

class _PhotoPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.primary.withOpacity(0.1),
      child: const Center(
        child: Icon(
          Icons.image,
          color: AppColors.primary,
          size: 32,
        ),
      ),
    );
  }
}

class _TextMemoryCard extends StatelessWidget {
  final Memory memory;
  final Function(Memory)? onTap;
  final int index;
  final int sectionIndex;

  const _TextMemoryCard({
    required this.memory,
    this.onTap,
    required this.index,
    required this.sectionIndex,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onTap?.call(memory),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryLight],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.format_quote,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                if (memory.memoryDate != null)
                  Text(
                    '${memory.memoryDate!.day}/${memory.memoryDate!.month}/${memory.memoryDate!.year}',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textMuted,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            if (memory.title != null)
              Text(
                memory.title!,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            if (memory.content != null) ...[
              const SizedBox(height: 8),
              Text(
                memory.content!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
            ],
          ],
        ),
      ),
    ).animate(delay: ((sectionIndex * 100) + (index * 50)).ms).fadeIn().slideY(begin: 0.1);
  }
}

class _EmptyGallery extends StatelessWidget {
  final Function()? onAddMemory;
  final LocaleProvider locale;

  const _EmptyGallery({this.onAddMemory, required this.locale});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withOpacity(0.1),
                  AppColors.secondary.withOpacity(0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(30),
            ),
            child: const Icon(
              Icons.photo_library_outlined,
              color: AppColors.primary,
              size: 48,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            locale.translate(
              'Commencez votre histoire',
              'Start your story',
            ),
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            locale.translate(
              'Capturez les moments précieux de votre enfant.\nChaque photo raconte une histoire unique.',
              'Capture your child\'s precious moments.\nEvery photo tells a unique story.',
            ),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textMuted,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: onAddMemory,
            icon: const Icon(Icons.add_photo_alternate),
            label: Text(locale.translate('Ajouter un souvenir', 'Add a memory')),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).scale(begin: const Offset(0.9, 0.9));
  }
}
