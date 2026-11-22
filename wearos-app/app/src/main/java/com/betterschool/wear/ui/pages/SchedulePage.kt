package com.betterschool.wear.ui.pages

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.betterschool.wear.domain.WearCourseEvent
import com.betterschool.wear.ui.M3ETheme

/**
 * Page 3 (Carrousel Horizontal) : PROCHAIN COURS & HORAIRE (M3E Pro)
 * Affiche le cours en cours ou à venir avec la salle en évidence et permet de parcourir la journée via ‹ / ›.
 */
@Composable
fun SchedulePage(
    courses: List<WearCourseEvent>,
    isLoading: Boolean
) {
    val defaultIdx = remember(courses) {
        val currentIdx = courses.indexOfFirst { it.isCurrent }
        if (currentIdx >= 0) currentIdx else courses.indexOfFirst { it.isUpcoming }.coerceAtLeast(0)
    }
    var index by remember(courses.size, defaultIdx) { mutableIntStateOf(defaultIdx) }
    val safeIndex = if (courses.isEmpty()) 0 else index.coerceIn(0, courses.lastIndex)
    val course = courses.getOrNull(safeIndex)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(M3ETheme.CanvasBg)
            .padding(horizontal = 20.dp, vertical = 18.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                if (courses.size > 1) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(CircleShape)
                            .background(M3ETheme.SubtleSurface)
                            .border(1.dp, M3ETheme.CardBorder, CircleShape)
                            .clickable {
                                index = if (safeIndex > 0) safeIndex - 1 else courses.lastIndex
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("‹", color = M3ETheme.TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(M3ETheme.BrandIndigoBg)
                        .border(1.dp, M3ETheme.BrandIndigoBorder, CircleShape)
                        .padding(horizontal = 10.dp, vertical = 3.dp)
                ) {
                    val label = if (courses.size > 1) "COURS ${safeIndex + 1}/${courses.size}" else "HORAIRE"
                    Text(
                        text = label,
                        color = M3ETheme.BrandIndigoText,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }

                if (courses.size > 1) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(CircleShape)
                            .background(M3ETheme.SubtleSurface)
                            .border(1.dp, M3ETheme.CardBorder, CircleShape)
                            .clickable {
                                index = if (safeIndex < courses.lastIndex) safeIndex + 1 else 0
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("›", color = M3ETheme.TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            if (course == null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(22.dp))
                        .background(M3ETheme.CardBg)
                        .border(1.dp, M3ETheme.CardBorder, RoundedCornerShape(22.dp))
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (isLoading) "Synchronisation..." else "Aucun cours aujourd'hui",
                        color = M3ETheme.TextMuted,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                val palette = M3ETheme.getSubjectPalette(course.subject)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(22.dp))
                        .background(M3ETheme.CardBg)
                        .border(1.dp, M3ETheme.CardBorder, RoundedCornerShape(22.dp))
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Statut temporel
                        val statusText = when {
                            course.isCurrent -> "EN COURS • ${course.remainingMinutes ?: 0}m"
                            course.isUpcoming && course.remainingMinutes != null -> "DANS ${course.remainingMinutes} MIN"
                            else -> "${course.startTime} - ${course.endTime}"
                        }
                        Text(
                            text = statusText,
                            color = palette.text,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold
                        )

                        // Badge Salle M3E Pro WCAG AA
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(palette.bg)
                                .border(1.dp, palette.border, RoundedCornerShape(8.dp))
                                .padding(horizontal = 7.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = course.room,
                                color = palette.text,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = course.subject,
                        color = M3ETheme.TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    Text(
                        text = "${course.startTime} - ${course.endTime} • ${course.teacher}",
                        color = M3ETheme.TextMuted,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    if (course.isCurrent) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(4.dp)
                                .clip(CircleShape)
                                .background(M3ETheme.SubtleSurface)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(course.progressFraction.coerceIn(0.1f, 1f))
                                    .height(4.dp)
                                    .clip(CircleShape)
                                    .background(palette.dot)
                            )
                        }
                    }
                }
            }
        }
    }
}
