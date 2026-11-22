package com.betterschool.wear.ui

import androidx.compose.ui.graphics.Color

/**
 * Thème officiel M3E Pro adapté aux écrans ronds de montres Wear OS.
 * Respecte strictement la spécification fermée documentation/M3E Pro.md :
 * - Axiome 1 : Zero Information Overflow (Lisibilité en 3 secondes)
 * - Axiome 4 : Executive Calm (Surfaces #F8FAFC / #FFFFFF, bordures #E2E8F0, textes #0F172A et #64748B)
 * - Matrice officielle des badges de matières WCAG AA / AAA
 */
object M3ETheme {
    val CanvasBg = Color(0xFFF8FAFC)
    val CardBg = Color(0xFFFFFFFF)
    val SubtleSurface = Color(0xFFF1F5F9)
    val CardBorder = Color(0xFFE2E8F0)

    val TextPrimary = Color(0xFF0F172A)   // slate-900
    val TextSecondary = Color(0xFF475569) // slate-600
    val TextMuted = Color(0xFF64748B)     // slate-500

    val BrandIndigo = Color(0xFF4F46E5)   // brand-600
    val BrandIndigoBg = Color(0xFFEEF2FF) // brand-50
    val BrandIndigoBorder = Color(0xFFC7D2FE) // brand-200
    val BrandIndigoText = Color(0xFF3730A3) // brand-800

    val EmeraldBg = Color(0xFFECFDF5)
    val EmeraldBorder = Color(0xFFA7F3D0)
    val EmeraldText = Color(0xFF065F46)
    val EmeraldDot = Color(0xFF10B981)

    val AmberBg = Color(0xFFFFFBEB)
    val AmberBorder = Color(0xFFFDE68A)
    val AmberText = Color(0xFF92400E)

    val RoseBg = Color(0xFFFFF1F2)
    val RoseBorder = Color(0xFFFECDD3)
    val RoseText = Color(0xFF9F1239)

    data class SubjectPalette(
        val bg: Color,
        val text: Color,
        val border: Color,
        val dot: Color
    )

    /**
     * Implémentation exacte de getSubjectTheme() de la section 5.3 de documentation/M3E Pro.md
     */
    fun getSubjectPalette(subjectName: String): SubjectPalette {
        val norm = subjectName.lowercase()
        return when {
            norm.contains("math") -> SubjectPalette(
                bg = Color(0xFFF0F9FF),
                text = Color(0xFF075985),
                border = Color(0xFFBAE6FD),
                dot = Color(0xFF0284C7)
            )
            norm.contains("physiq") || norm.contains("chimi") || norm.contains("nsi") || norm.contains("techno") -> SubjectPalette(
                bg = Color(0xFFECFDF5),
                text = Color(0xFF065F46),
                border = Color(0xFFA7F3D0),
                dot = Color(0xFF059669)
            )
            norm.contains("scien") || norm.contains("bio") -> SubjectPalette(
                bg = Color(0xFFEEF2FF),
                text = Color(0xFF4338CA),
                border = Color(0xFFC7D2FE),
                dot = Color(0xFF4F46E5)
            )
            norm.contains("hist") || norm.contains("géo") || norm.contains("geo") || norm.contains("ses") -> SubjectPalette(
                bg = Color(0xFFFFF7ED),
                text = Color(0xFF9A3412),
                border = Color(0xFFFED7AA),
                dot = Color(0xFFEA580C)
            )
            norm.contains("angl") || norm.contains("lang") || norm.contains("néerl") || norm.contains("espag") || norm.contains("fran") -> SubjectPalette(
                bg = Color(0xFFFFF1F2),
                text = Color(0xFF9F1239),
                border = Color(0xFFFECDD3),
                dot = Color(0xFFE11D48)
            )
            norm.contains("philo") -> SubjectPalette(
                bg = Color(0xFFFFFBEB),
                text = Color(0xFF92400E),
                border = Color(0xFFFDE68A),
                dot = Color(0xFFD97706)
            )
            norm.contains("sport") || norm.contains("eps") || norm.contains("art") -> SubjectPalette(
                bg = Color(0xFFFAF5FF),
                text = Color(0xFF6B21A8),
                border = Color(0xFFE9D5FF),
                dot = Color(0xFF9333EA)
            )
            else -> SubjectPalette(
                bg = Color(0xFFF1F5F9),
                text = Color(0xFF1E293B),
                border = Color(0xFFE2E8F0),
                dot = Color(0xFF475569)
            )
        }
    }
}
