package com.betterschool.wear.ui.pages

import androidx.compose.foundation.Canvas
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.betterschool.wear.ui.M3ETheme
import com.betterschool.wear.ui.WearUiState

/**
 * Page Compte & Connexion M3E Pro Dark (OLED).
 * Épurée de toute information technique inutile.
 */
@Composable
fun PairingAndProfilePage(
    uiState: WearUiState,
    onRegenerateCode: () -> Unit,
    onEnterDemo: () -> Unit,
    onDisconnect: () -> Unit,
    onRefresh: () -> Unit
) {
    var showFullQr by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(M3ETheme.CanvasBg)
            .padding(horizontal = 20.dp, vertical = 18.dp),
        contentAlignment = Alignment.Center
    ) {
        if (!uiState.isPaired && !uiState.isDemoMode) {
            val code = uiState.pairingTicket?.code ?: "------"
            val formattedCode = if (code.length == 6) "${code.substring(0, 3)} ${code.substring(3, 6)}" else code

            if (showFullQr) {
                val matrix = remember(code) { QrMatrixGenerator.encodeCode(code) }
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    Box(
                        modifier = Modifier
                            .size(112.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White)
                            .padding(8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val n = matrix.size
                            val cell = size.width / n.toFloat()
                            for (r in 0 until n) {
                                for (c in 0 until n) {
                                    if (matrix[r][c]) {
                                        drawRect(
                                            color = Color(0xFF0F172A),
                                            topLeft = Offset(c * cell, r * cell),
                                            size = Size(cell + 0.4f, cell + 0.4f)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(M3ETheme.SubtleSurface)
                            .border(1.dp, M3ETheme.CardBorder, CircleShape)
                            .clickable { showFullQr = false }
                            .padding(horizontal = 14.dp, vertical = 5.dp)
                    ) {
                        Text(
                            text = "Code : $formattedCode",
                            color = M3ETheme.TextPrimary,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            } else {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(M3ETheme.BrandIndigoBg)
                            .border(1.dp, M3ETheme.BrandIndigoBorder, CircleShape)
                            .padding(horizontal = 10.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "CONNEXION MONTRE",
                            color = M3ETheme.BrandIndigoText,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(22.dp))
                            .background(M3ETheme.CardBg)
                            .border(1.dp, M3ETheme.CardBorder, RoundedCornerShape(22.dp))
                            .padding(vertical = 10.dp, horizontal = 12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Code à entrer sur le Web",
                            color = M3ETheme.TextMuted,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(2.dp))

                        Text(
                            text = formattedCode,
                            color = M3ETheme.TextPrimary,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 21.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.5.sp
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(M3ETheme.BrandIndigo)
                                    .clickable { showFullQr = true }
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Text(
                                    text = "QR Code",
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(M3ETheme.SubtleSurface)
                                    .border(1.dp, M3ETheme.CardBorder, RoundedCornerShape(10.dp))
                                    .clickable { onRegenerateCode() }
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Text(
                                    text = "Nouveau",
                                    color = M3ETheme.TextPrimary,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(M3ETheme.SubtleSurface)
                            .clickable { onEnterDemo() }
                            .padding(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "Essayer le Mode Démo",
                            color = M3ETheme.TextSecondary,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        } else {
            // Vue Compte épurée (sans trace technique ni URL brute)
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(if (uiState.isDemoMode) M3ETheme.AmberBg else M3ETheme.EmeraldBg)
                        .border(
                            1.dp,
                            if (uiState.isDemoMode) M3ETheme.AmberBorder else M3ETheme.EmeraldBorder,
                            CircleShape
                        )
                        .padding(horizontal = 10.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = if (uiState.isDemoMode) "MODE DÉMO" else "CONNECTÉ",
                        color = if (uiState.isDemoMode) M3ETheme.AmberText else M3ETheme.EmeraldText,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(22.dp))
                        .background(M3ETheme.CardBg)
                        .border(1.dp, M3ETheme.CardBorder, RoundedCornerShape(22.dp))
                        .padding(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = uiState.profile.fullName.ifEmpty { "Mon Compte" },
                        color = M3ETheme.TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    if (uiState.profile.studentClass.isNotBlank()) {
                        Text(
                            text = "Classe ${uiState.profile.studentClass}",
                            color = M3ETheme.TextMuted,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            maxLines = 1
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (!uiState.isDemoMode) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(M3ETheme.BrandIndigo)
                                    .clickable(enabled = !uiState.isLoading) { onRefresh() }
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Text(
                                    text = if (uiState.isLoading) "Sync..." else "Actualiser",
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(M3ETheme.RoseBg)
                                .border(1.dp, M3ETheme.RoseBorder, RoundedCornerShape(10.dp))
                                .clickable { onDisconnect() }
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Text(
                                text = if (uiState.isDemoMode) "Quitter démo" else "Déconnecter",
                                color = M3ETheme.RoseText,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

object QrMatrixGenerator {
    fun encodeCode(text: String): Array<BooleanArray> {
        val size = 21
        val grid = Array(size) { BooleanArray(size) }
        val reserved = Array(size) { BooleanArray(size) }

        fun placeFinder(row: Int, col: Int) {
            for (r in -1..7) {
                for (c in -1..7) {
                    val rr = row + r
                    val cc = col + c
                    if (rr in 0 until size && cc in 0 until size) {
                        val isBorder = r in 0..6 && c in 0..6 && (r == 0 || r == 6 || c == 0 || c == 6)
                        val isInner = r in 2..4 && c in 2..4
                        grid[rr][cc] = isBorder || isInner
                        reserved[rr][cc] = true
                    }
                }
            }
        }

        placeFinder(0, 0)
        placeFinder(0, size - 7)
        placeFinder(size - 7, 0)

        for (i in 8 until size - 8) {
            grid[6][i] = i % 2 == 0
            reserved[6][i] = true
            grid[i][6] = i % 2 == 0
            reserved[i][6] = true
        }

        grid[size - 8][8] = true
        reserved[size - 8][8] = true
        for (i in 0..8) {
            reserved[8][i] = true
            reserved[i][8] = true
        }
        for (i in 0..7) {
            reserved[8][size - 1 - i] = true
            reserved[size - 1 - i][8] = true
        }

        val bytes = text.toByteArray(Charsets.ISO_8859_1).take(17)
        val bits = mutableListOf<Boolean>()
        fun addBits(value: Int, len: Int) {
            for (i in len - 1 downTo 0) {
                bits.add(((value shr i) and 1) == 1)
            }
        }

        addBits(0b0100, 4)
        addBits(bytes.size, 8)
        for (b in bytes) addBits(b.toInt() and 0xFF, 8)
        addBits(0, 4)
        while (bits.size % 8 != 0) bits.add(false)

        val dataCodewords = IntArray(19)
        var idx = 0
        while (idx * 8 < bits.size && idx < 19) {
            var v = 0
            for (b in 0 until 8) {
                v = (v shl 1) or if (bits[idx * 8 + b]) 1 else 0
            }
            dataCodewords[idx] = v
            idx++
        }
        val padBytes = intArrayOf(0xEC, 0x11)
        var padIdx = 0
        while (idx < 19) {
            dataCodewords[idx++] = padBytes[padIdx % 2]
            padIdx++
        }

        val ecCodewords = reedSolomonEncode(dataCodewords, 7)
        val allBits = mutableListOf<Boolean>()
        for (cw in dataCodewords) addBitsTo(allBits, cw, 8)
        for (cw in ecCodewords) addBitsTo(allBits, cw, 8)

        var bitIndex = 0
        var upward = true
        var col = size - 1
        while (col > 0) {
            if (col == 6) col--
            for (i in 0 until size) {
                val r = if (upward) size - 1 - i else i
                for (dc in 0..1) {
                    val c = col - dc
                    if (!reserved[r][c]) {
                        val bit = if (bitIndex < allBits.size) allBits[bitIndex++] else false
                        val masked = if ((r + c) % 2 == 0) !bit else bit
                        grid[r][c] = masked
                    }
                }
            }
            upward = !upward
            col -= 2
        }

        val formatBits = 0b111011111000100
        val fCoords1 = listOf(
            8 to 0, 8 to 1, 8 to 2, 8 to 3, 8 to 4, 8 to 5, 8 to 7, 8 to 8,
            7 to 8, 5 to 8, 4 to 8, 3 to 8, 2 to 8, 1 to 8, 0 to 8
        )
        val fCoords2 = listOf(
            20 to 8, 19 to 8, 18 to 8, 17 to 8, 16 to 8, 15 to 8, 14 to 8,
            8 to 13, 8 to 14, 8 to 15, 8 to 16, 8 to 17, 8 to 18, 8 to 19, 8 to 20
        )
        for (i in 0 until 15) {
            val bit = ((formatBits shr (14 - i)) and 1) == 1
            grid[fCoords1[i].first][fCoords1[i].second] = bit
            grid[fCoords2[i].first][fCoords2[i].second] = bit
        }

        return grid
    }

    private fun addBitsTo(target: MutableList<Boolean>, value: Int, len: Int) {
        for (i in len - 1 downTo 0) {
            target.add(((value shr i) and 1) == 1)
        }
    }

    private fun reedSolomonEncode(data: IntArray, ecCount: Int): IntArray {
        val exp = IntArray(512)
        val log = IntArray(256)
        var x = 1
        for (i in 0 until 255) {
            exp[i] = x
            log[x] = i
            x = x shl 1
            if ((x and 0x100) != 0) x = x xor 0x11D
        }
        for (i in 255 until 512) exp[i] = exp[i - 255]

        fun gfMul(a: Int, b: Int): Int = if (a == 0 || b == 0) 0 else exp[log[a] + log[b]]

        var gen = intArrayOf(1)
        for (i in 0 until ecCount) {
            val next = IntArray(gen.size + 1)
            val root = exp[i]
            for (j in gen.indices) {
                next[j] = next[j] xor gen[j]
                next[j + 1] = next[j + 1] xor gfMul(gen[j], root)
            }
            gen = next
        }

        val res = IntArray(ecCount)
        for (b in data) {
            val factor = b xor res[0]
            System.arraycopy(res, 1, res, 0, ecCount - 1)
            res[ecCount - 1] = 0
            for (i in 0 until ecCount) {
                res[i] = res[i] xor gfMul(gen[i + 1], factor)
            }
        }
        return res
    }
}
