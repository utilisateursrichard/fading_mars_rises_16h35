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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.rotary.onRotaryScrollEvent
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.betterschool.wear.domain.WearHomework
import com.betterschool.wear.ui.M3ETheme

/**
 * Page 4 (Carrousel Horizontal) : DEVOIRS TRIÉS PAR IMPORTANCE (M3E Pro)
 * - Les devoirs sont classés par score d'importance décroissant (0 à 10).
 * - Supporte la couronne rotative et les boutons ‹ / › pour passer d'un devoir à l'autre.
 */
@Composable
fun HomeworkPage(
    homeworks: List<WearHomework>,
    onToggleHomework: (WearHomework) -> Unit,
    isPageActive: Boolean = true
) {
    var index by remember(homeworks.size) { mutableIntStateOf(0) }
    var rotaryAccum by remember { mutableFloatStateOf(0f) }
    val focusRequester = remember { FocusRequester() }
    val haptic = LocalHapticFeedback.current

    val safeIndex = if (homeworks.isEmpty()) 0 else index.coerceIn(0, homeworks.lastIndex)
    val hw = homeworks.getOrNull(safeIndex)
    val pendingCount = homeworks.count { !it.isCompleted }

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
                if (homeworks.size > 1) {
                    rotaryAccum += event.verticalScrollPixels
                    if (rotaryAccum > 48f) {
                        val next = (safeIndex + 1).coerceAtMost(homeworks.lastIndex)
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
                if (homeworks.size > 1) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(CircleShape)
                            .background(M3ETheme.SubtleSurface)
                            .border(1.dp, M3ETheme.CardBorder, CircleShape)
                            .clickable {
                                index = if (safeIndex > 0) safeIndex - 1 else homeworks.lastIndex
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("‹", color = M3ETheme.TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(if (pendingCount == 0) M3ETheme.EmeraldBg else M3ETheme.AmberBg)
                        .border(1.dp, if (pendingCount == 0) M3ETheme.EmeraldBorder else M3ETheme.AmberBorder, CircleShape)
                        .padding(horizontal = 10.dp, vertical = 3.dp)
                ) {
                    val label = if (homeworks.size > 1) {
                        "DEVOIR ${safeIndex + 1}/${homeworks.size}"
                    } else {
                        "DEVOIRS ($pendingCount)"
                    }
                    Text(
                        text = label,
                        color = if (pendingCount == 0) M3ETheme.EmeraldText else M3ETheme.AmberText,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }

                if (homeworks.size > 1) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(CircleShape)
                            .background(M3ETheme.SubtleSurface)
                            .border(1.dp, M3ETheme.CardBorder, CircleShape)
                            .clickable {
                                index = if (safeIndex < homeworks.lastIndex) safeIndex + 1 else 0
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text("›", color = M3ETheme.TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            if (hw == null) {
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
                        text = "Aucun devoir à faire",
                        color = M3ETheme.EmeraldText,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                val palette = M3ETheme.getSubjectPalette(hw.subject)
                val isHighPriority = !hw.isCompleted && hw.importanceScore >= 5

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(22.dp))
                        .background(M3ETheme.CardBg)
                        .border(
                            width = 1.dp,
                            color = when {
                                hw.isCompleted -> M3ETheme.EmeraldBorder
                                isHighPriority -> M3ETheme.RoseBorder
                                else -> M3ETheme.CardBorder
                            },
                            shape = RoundedCornerShape(22.dp)
                        )
                        .clickable { onToggleHomework(hw) }
                        .padding(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(palette.bg)
                                .border(1.dp, palette.border, RoundedCornerShape(8.dp))
                                .padding(horizontal = 7.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = hw.subject.uppercase(),
                                color = palette.text,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.ExtraBold,
                                maxLines = 1
                            )
                        }

                        // Badge d'importance M3E Pro (ex: 8/10 • Date)
                        val rightLabel = if (hw.isCompleted) {
                            hw.dueDate
                        } else {
                            "${hw.importanceScore}/10 • ${hw.dueDate}"
                        }
                        Text(
                            text = rightLabel,
                            color = if (isHighPriority) M3ETheme.RoseText else M3ETheme.TextMuted,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }

                    Spacer(modifier = Modifier.height(5.dp))

                    Text(
                        text = hw.title,
                        color = if (hw.isCompleted) M3ETheme.TextMuted else M3ETheme.TextPrimary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        textDecoration = if (hw.isCompleted) TextDecoration.LineThrough else TextDecoration.None,
                        textAlign = TextAlign.Center,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (hw.isCompleted) M3ETheme.EmeraldBg else M3ETheme.TextPrimary)
                            .border(
                                width = 1.dp,
                                color = if (hw.isCompleted) M3ETheme.EmeraldBorder else M3ETheme.TextPrimary,
                                shape = RoundedCornerShape(10.dp)
                            )
                            .padding(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = if (hw.isCompleted) "✓ Terminé" else "Marquer comme fait",
                            color = if (hw.isCompleted) M3ETheme.EmeraldText else Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
