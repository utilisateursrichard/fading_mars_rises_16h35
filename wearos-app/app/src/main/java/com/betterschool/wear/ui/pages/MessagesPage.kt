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
import com.betterschool.wear.domain.WearMessage
import com.betterschool.wear.ui.M3ETheme

/**
 * Page 1 (Carrousel Horizontal) : DERNIER MESSAGE (M3E Pro)
 * Zéro LazyColumn imbriqué -> Fluidité 60 FPS et aucun texte coupé sur l'écran rond.
 * Permet de consulter le dernier message et de passer aux messages précédents avec ‹ / ›.
 */
@Composable
fun MessagesPage(messages: List<WearMessage>) {
    var index by remember(messages.size) { mutableIntStateOf(0) }
    val safeIndex = if (messages.isEmpty()) 0 else index.coerceIn(0, messages.lastIndex)
    val msg = messages.getOrNull(safeIndex)

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
            // En-tête capsule M3E Pro avec navigation rapide ‹ 1/N ›
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
                // Carte Bento M3E Pro
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
                                color = M3ETheme.BrandIndigo,
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
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}
