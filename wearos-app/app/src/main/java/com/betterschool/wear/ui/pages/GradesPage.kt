package com.betterschool.wear.ui.pages

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.rotary.onRotaryScrollEvent
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.betterschool.wear.domain.WearGrade
import com.betterschool.wear.ui.M3ETheme
import kotlin.math.roundToInt

/**
 * Page 2 (Carrousel Horizontal) : DERNIÈRE NOTE & MOYENNE (M3E Pro)
 * Supporte la couronne rotative et les boutons ‹ / › pour parcourir les évaluations.
 */
@Composable
fun GradesPage(
    grades: List<WearGrade>,
    weightedAverage: Double?,
    isPageActive: Boolean = true
) {
    var index by remember(grades.size) { mutableIntStateOf(0) }
    var rotaryAccum by remember { mutableFloatStateOf(0f) }
    val focusRequester = remember { FocusRequester() }
    val haptic = LocalHapticFeedback.current

    val safeIndex = if (grades.isEmpty()) 0 else index.coerceIn(0, grades.lastIndex)
    val grade = grades.getOrNull(safeIndex)

    LaunchedEffect(isPageActive) {
        if (isPageActive) {
            runCatching { focusRequester.requestFocus() }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(M3ETheme.CanvasBg)
            .onRotaryScrollEvent { event ->
                if (grades.size > 1) {
                    rotaryAccum += event.verticalScrollPixels
                    if (rotaryAccum > 48f) {
                        val next = (safeIndex + 1).coerceAtMost(grades.lastIndex)
                        if (next != safeIndex) {
                            index = next
                            haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        }
                        rotaryAccum = 0f
                    } else if (rotaryAccum < -48f) {
                        val prev = (safeIndex - 1).coerceAtLeast(0)
                        if (prev != safeIndex) {
                            index = prev
                            haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        }
                        rotaryAccum = 0f
                    }
                }
                true
            }
            .focusRequester(focusRequester)
            .focusable()
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
                if (grades.size > 1) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(CircleShape)
                            .background(M3ETheme.SubtleSurface)
                            .border(1.dp, M3ETheme.CardBorder, CircleShape)
                            .clickable {
                                index = if (safeIndex > 0) safeIndex - 1 else grades.lastIndex
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("‹", color = M3ETheme.TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(M3ETheme.EmeraldBg)
                        .border(1.dp, M3ETheme.EmeraldBorder, CircleShape)
                        .padding(horizontal = 10.dp, vertical = 3.dp)
                ) {
                    val headerText = if (weightedAverage != null) "MOY. $weightedAverage%" else "RÉSULTATS"
                    Text(
                        text = headerText,
                        color = M3ETheme.EmeraldText,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }

                if (grades.size > 1) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(CircleShape)
                            .background(M3ETheme.SubtleSurface)
                            .border(1.dp, M3ETheme.CardBorder, CircleShape)
                            .clickable {
                                index = if (safeIndex < grades.lastIndex) safeIndex + 1 else 0
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("›", color = M3ETheme.TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            if (grade == null) {
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
                        text = "Aucune note publiée",
                        color = M3ETheme.TextMuted,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                val palette = M3ETheme.getSubjectPalette(grade.subject)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(22.dp))
                        .background(M3ETheme.CardBg)
                        .border(1.dp, M3ETheme.CardBorder, RoundedCornerShape(22.dp))
                        .padding(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(palette.bg)
                            .border(1.dp, palette.border, RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = grade.subject.uppercase(),
                            color = palette.text,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = grade.title,
                        color = M3ETheme.TextPrimary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = grade.scoreText,
                            color = M3ETheme.TextPrimary,
                            fontSize = 21.sp,
                            fontWeight = FontWeight.Black
                        )

                        val isGood = grade.percentage >= 50.0
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(if (isGood) M3ETheme.EmeraldBg else M3ETheme.RoseBg)
                                .border(1.dp, if (isGood) M3ETheme.EmeraldBorder else M3ETheme.RoseBorder, CircleShape)
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "${grade.percentage.roundToInt()}%",
                                color = if (isGood) M3ETheme.EmeraldText else M3ETheme.RoseText,
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
