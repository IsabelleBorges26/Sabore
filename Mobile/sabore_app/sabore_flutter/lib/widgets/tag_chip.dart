import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import '../theme/app_text_styles.dart';

class TagChip extends StatelessWidget {
  final String label;
  final VoidCallback? onDelete;
  final Color backgroundColor;
  final Color textColor;

  const TagChip({
    super.key,
    required this.label,
    this.onDelete,
    this.backgroundColor = AppColors.chipBackground,
    this.textColor = AppColors.textDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label,
              style: AppTextStyles.bodySmall.copyWith(color: textColor)),
          if (onDelete != null) ...[
            const SizedBox(width: 6),
            GestureDetector(
              onTap: onDelete,
              child: Icon(Icons.close_rounded, size: 15, color: textColor),
            ),
          ],
        ],
      ),
    );
  }
}
