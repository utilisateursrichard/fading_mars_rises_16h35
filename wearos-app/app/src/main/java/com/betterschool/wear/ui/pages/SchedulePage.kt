package com.betterschool.wear.ui.pages

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.scrollBy
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.input.rotary.onRotaryScrollEvent
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.betterschool.wear.domain.WearCourseEvent
import com.betterschool.wear.ui.M3ETheme
import kotlinx.coroutines.launch

/**
 * Page 3 (Carrousel Horizontal) : HORAIRE & COURS À VENIR (M3E Pro)
 * - Affiche en haut le cours actuel (ou prochain cours immédiat).
 * - En scrollant verticalement (doigt ou couronne rotative), affiche tous les cours qui suivront
 *   jusqu'à la fin de la journée.
 * - Ultra-léger pour le mini-GPU : uniquement les cours restants du jour, sans textures ni ombres lourdes.
 */
@Composable
fun SchedulePage(
    courses: List<WearCourseEvent>,
    isLoading: Boolean,
    isPageActive: Boolean = true
) {
    val scrollState = rememberScrollState()
    val focusRequester = remember { FocusRequester() }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(isPageActive) {
        if (isPageActive) {
            runCatching { focusRequester.requestFocus() }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(M3ETheme.CanvasBg)
            .onRotaryScrollEvent { event ->
                coroutineScope.launch {
                    scrollState.scrollBy(event.verticalScrollPixels)
                }
                true
            }
            .focusRequester(focusRequester)
            .focusable()
            .verticalScroll(scrollState)
            .padding(start = 18.dp, end = 18.dp, top = 16.dp, bottom = 26.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // Badge supérieur capsule M3E Pro
        Box(
            modifier = Modifier
                .clip(CircleShape)
                .background(M3ETheme.BrandIndigoBg)
                .border(1.dp, M3ETheme.BrandIndigoBorder, CircleShape)
                .padding(horizontal = 10.dp, vertical = 3.dp)
        ) {
            val countLabel = if (courses.isNotEmpty()) "HORAIRE (${courses.size} COURS)" else "HORAIRE"
            Text(
                text = countLabel,
                color = M3ETheme.BrandIndigoText,
                fontSize = 9.sp,
                fontWeight = FontWeight.ExtraBold
            )
        }

        if (courses.isEmpty()) {
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
                    text = if (isLoading) "Synchronisation..." else "Journée terminée",
                    color = M3ETheme.TextMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            // 1. Premier élément : Cours en cours (ou prochain cours immédiat) en Carte Bento Héro M3E Pro
            val firstCourse = courses.first()
            val firstPalette = M3ETheme.getSubjectPalette(firstCourse.subject)

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .background(M3ETheme.CardBg)
                    .border(1.dp, firstPalette.border, RoundedCornerShape(22.dp))
                    .padding(11.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val statusText = when {
                        firstCourse.isCurrent -> "● EN COURS (${firstCourse.remainingMinutes ?: 0}m)"
                        firstCourse.remainingMinutes != null -> "À VENIR • ${firstCourse.startTime}"
                        else -> "${firstCourse.startTime} - ${firstCourse.endTime}"
                    }
                    Text(
                        text = statusText,
                        color = firstPalette.text,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.ExtraBold
                    )

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(firstPalette.bg)
                            .border(1.dp, firstPalette.border, RoundedCornerShape(8.dp))
                            .padding(horizontal = 7.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = firstCourse.room,
                            color = firstPalette.text,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }

                Spacer(modifier = Modifier.height(3.dp))

                Text(
                    text = firstCourse.subject,
                    color = M3ETheme.TextPrimary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Text(
                    text = "${firstCourse.startTime} - ${firstCourse.endTime} • ${firstCourse.teacher}",
                    color = M3ETheme.TextMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                if (firstCourse.isCurrent) {
                    Spacer(modifier = Modifier.height(5.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .clip(CircleShape)
                            .background(M3ETheme.SubtleSurface)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(firstCourse.progressFraction.coerceIn(0.1f, 1f))
                                .height(4.dp)
                                .clip(CircleShape)
                                .background(firstPalette.dot)
                        )
                    }
                }
            }

            // 2. En dessous : tous les cours qui suivront jusqu'à la fin de la journée
            if (courses.size > 1) {
                Text(
                    text = "COURS SUIVANTS",
                    color = M3ETheme.TextMuted,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.ExtraBold,
                    modifier = Modifier.padding(top = 2.dp)
                )

                for (i in 1 until courses.size) {
                    val nextCourse = courses[i]
                    val palette = M3ETheme.getSubjectPalette(nextCourse.subject)

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(M3ETheme.CardBg)
                            .border(1.dp, M3ETheme.CardBorder, RoundedCornerShape(16.dp))
                            .padding(horizontal = 10.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .width(3.dp)
                                .height(22.dp)
                                .clip(CircleShape)
                                .background(palette.dot)
                        )

                        Spacer(modifier = Modifier.width(8.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = nextCourse.subject,
                                color = M3ETheme.TextPrimary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "${nextCourse.startTime} - ${nextCourse.endTime} • ${nextCourse.teacher}",
                                color = M3ETheme.TextMuted,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(palette.bg)
                                .border(1.dp, palette.border, RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = nextCourse.room,
                                color = palette.text,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold
                            )
                        }
                    }
                }
            }
        }
    }
}
