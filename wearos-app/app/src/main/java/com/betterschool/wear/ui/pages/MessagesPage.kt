package com.betterschool.wear.ui.pages

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.betterschool.wear.domain.WearMessage
import com.betterschool.wear.ui.M3ETheme
import kotlinx.coroutines.launch

/**
 * Page 1 (Carrousel Horizontal) : DERNIER MESSAGE (M3E Pro Dark)
 * - Vue résumé : permet de parcourir les messages via la couronne rotative ou ‹ / ›.
 * - Au clic sur la carte du message : ouvre la vue lecture complète défilable (doigt + couronne rotative)
 *   pour lire l'intégralité du contenu du message.
 */
@Composable
fun MessagesPage(
    messages: List<WearMessage>,
    isPageActive: Boolean = true,
    onOpenMessage: (WearMessage) -> Unit = {}
) {
    var index by remember(messages.size) { mutableIntStateOf(0) }
    var isReadingFullMessage by remember { mutableStateOf(false) }
    var rotaryAccum by remember { mutableFloatStateOf(0f) }

    val focusRequester = remember { FocusRequester() }
    val detailScrollState = rememberScrollState()
    val coroutineScope = rememberCoroutineScope()
    val haptic = LocalHapticFeedback.current

    val safeIndex = if (messages.isEmpty()) 0 else index.coerceIn(0, messages.lastIndex)
    val msg = messages.getOrNull(safeIndex)

    LaunchedEffect(isPageActive, isReadingFullMessage) {
        if (isPageActive) {
            runCatching { focusRequester.requestFocus() }
        }
    }

    if (isReadingFullMessage && msg != null) {
        // Vue Lecture Complète du Message (défilable verticalement au doigt ou avec la couronne rotative)
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(M3ETheme.CanvasBg)
                .onRotaryScrollEvent { event ->
                    coroutineScope.launch {
                        detailScrollState.scrollBy(event.verticalScrollPixels)
                    }
                    true
                }
                .focusRequester(focusRequester)
                .focusable()
                .verticalScroll(detailScrollState)
                .padding(start = 18.dp, end = 18.dp, top = 16.dp, bottom = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            // Bouton Retour en haut
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(M3ETheme.SubtleSurface)
                    .border(1.dp, M3ETheme.CardBorder, CircleShape)
                    .clickable { isReadingFullMessage = false }
                    .padding(horizontal = 12.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "‹ Retour aux messages",
                    color = M3ETheme.TextPrimary,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }

            // Carte complète contenant tout le texte du message
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(M3ETheme.CardBg)
                    .border(1.dp, M3ETheme.CardBorder, RoundedCornerShape(20.dp))
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = msg.senderName,
                        color = M3ETheme.BrandIndigoText,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = msg.dateLabel,
                        color = M3ETheme.TextMuted,
                        fontSize = 8.sp
                    )
                }

                Spacer(modifier = Modifier.height(3.dp))

                Text(
                    text = msg.subject,
                    color = M3ETheme.TextPrimary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.ExtraBold
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = msg.fullBodyText.ifBlank { msg.previewSnippet },
                    color = M3ETheme.TextSecondary,
                    fontSize = 11.sp,
                    lineHeight = 15.sp
                )
            }

            // Bouton Fermer en bas de lecture
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(M3ETheme.BrandIndigo)
                    .clickable { isReadingFullMessage = false }
                    .padding(horizontal = 14.dp, vertical = 5.dp)
            ) {
                Text(
                    text = "Fermer",
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    } else {
        // Vue Résumé (Carrousel) : cliquer sur la carte ouvre le message complet
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(M3ETheme.CanvasBg)
                .onRotaryScrollEvent { event ->
                    if (messages.size > 1) {
                        rotaryAccum += event.verticalScrollPixels
                        if (rotaryAccum > 48f) {
                            val next = (safeIndex + 1).coerceAtMost(messages.lastIndex)
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
                    if (messages.size > 1) {
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .clip(CircleShape)
                                .background(M3ETheme.SubtleSurface)
                                .border(1.dp, M3ETheme.CardBorder, CircleShape)
                                .clickable {
                                    index = if (safeIndex > 0) safeIndex - 1 else messages.lastIndex
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
                        val countLabel = if (messages.size > 1) "MESSAGE ${safeIndex + 1}/${messages.size}" else "DERNIER MESSAGE"
                        Text(
                            text = countLabel,
                            color = M3ETheme.BrandIndigoText,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }

                    if (messages.size > 1) {
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .clip(CircleShape)
                                .background(M3ETheme.SubtleSurface)
                                .border(1.dp, M3ETheme.CardBorder, CircleShape)
                                .clickable {
                                    index = if (safeIndex < messages.lastIndex) safeIndex + 1 else 0
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Text("›", color = M3ETheme.TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                if (msg == null) {
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
                            text = "Aucun message reçu",
                            color = M3ETheme.TextMuted,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            textAlign = TextAlign.Center
                        )
                    }
                } else {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(22.dp))
                            .background(M3ETheme.CardBg)
                            .border(
                                width = 1.dp,
                                color = if (msg.isUnread) M3ETheme.BrandIndigoBorder else M3ETheme.CardBorder,
                                shape = RoundedCornerShape(22.dp)
                            )
                            .clickable {
                                onOpenMessage(msg)
                                isReadingFullMessage = true
                            }
                            .padding(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(5.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                if (msg.isUnread) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .clip(CircleShape)
                                            .background(M3ETheme.BrandIndigo)
                                    )
                                }
                                Text(
                                    text = msg.senderName,
                                    color = M3ETheme.BrandIndigoText,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            Text(
                                text = msg.dateLabel,
                                color = M3ETheme.TextMuted,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }

                        Spacer(modifier = Modifier.height(3.dp))

                        Text(
                            text = msg.subject,
                            color = M3ETheme.TextPrimary,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = msg.fullBodyText,
                            color = M3ETheme.TextSecondary,
                            fontSize = 10.sp,
                            lineHeight = 13.sp,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = "Appuyer pour lire ›",
                            color = M3ETheme.BrandIndigoText,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
