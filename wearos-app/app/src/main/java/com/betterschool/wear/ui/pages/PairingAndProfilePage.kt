package com.betterschool.wear.ui.pages

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.betterschool.wear.domain.TileDisplayMode
import com.betterschool.wear.ui.WearUiState

/**
 * Page 5 du carrousel horizontal : APPAIRAGE QR CODE (GÉNÉRÉ SUR LA MONTRE) & PROFIL
 */
@Composable
fun PairingAndProfilePage(
    uiState: WearUiState,
    onStartQrPairing: () -> Unit,
    onStopQrPairing: () -> Unit,
    onRefresh: () -> Unit,
    onToggleDemo: () -> Unit,
    onSelectTileMode: (TileDisplayMode) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 14.dp, end = 14.dp, top = 18.dp, bottom = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        item {
            Text(
                text = "◂ DEVOIRS  •  CONNEXION & TUILE",
                color = Color(0xFF94A3B8),
                fontSize = 9.sp,
                fontWeight = FontWeight.ExtraBold,
                modifier = Modifier.padding(bottom = 2.dp)
            )
        }

        val ticket = uiState.pairingTicket
        if (uiState.isPollingPairing && ticket != null) {
            item {
                val matrix = remember(ticket.code) {
                    QrMatrixGenerator.encodeNumericOrByte(ticket.code)
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(22.dp))
                        .background(Color(0xFF111827))
                        .border(1.dp, Color(0xFF6366F1), RoundedCornerShape(22.dp))
                        .padding(10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "SCANNEZ DEPUIS LE WEB",
                        color = Color(0xFFA5B4FC),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.ExtraBold
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Box(
                        modifier = Modifier
                            .size(116.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color.White)
                            .padding(8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val n = matrix.size
                            val cellSize = size.width / n.toFloat()
                            for (r in 0 until n) {
                                for (c in 0 until n) {
                                    if (matrix[r][c]) {
                                        drawRect(
                                            color = Color.Black,
                                            topLeft = Offset(c * cellSize, r * cellSize),
                                            size = Size(cellSize + 0.5f, cellSize + 0.5f)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "CODE : ${ticket.code}",
                        color = Color.White,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Black
                    )

                    Text(
                        text = "En attente de betterschool.dino.icu...",
                        color = Color(0xFF94A3B8),
                        fontSize = 9.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(Color(0xFF1E293B))
                            .clickable { onStopQrPairing() }
                            .padding(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "Annuler",
                            color = Color(0xFFF87171),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        } else {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(18.dp))
                        .background(Color(0xFF4F46E5))
                        .clickable { onStartQrPairing() }
                        .padding(vertical = 10.dp, horizontal = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "📲 Afficher QR Code d'appairage",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(Color(0xFF0F172A))
                    .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(18.dp))
                    .padding(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "${uiState.profile.fullName} (${uiState.profile.studentClass})",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = uiState.statusBanner ?: uiState.schoolHost,
                    color = if (uiState.isDemoMode) Color(0xFFFBBF24) else Color(0xFF34D399),
                    fontSize = 9.sp,
                    textAlign = TextAlign.Center
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color(0xFF1E293B))
                        .clickable { onRefresh() }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "🔄 Sync",
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (uiState.isDemoMode) Color(0xFF422006) else Color(0xFF064E3B))
                        .clickable { onToggleDemo() }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (uiState.isDemoMode) "🟡 Démo" else "🟢 Réel",
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(Color(0xFF0F172A))
                    .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(18.dp))
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "INFO DANS LA TUILE WEAR OS :",
                    color = Color(0xFF94A3B8),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.ExtraBold
                )
                TileDisplayMode.entries.forEach { mode ->
                    val selected = uiState.tileDisplayMode == mode
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (selected) Color(0xFF312E81) else Color(0xFF1E293B))
                            .clickable { onSelectTileMode(mode) }
                            .padding(horizontal = 8.dp, vertical = 5.dp)
                    ) {
                        Text(
                            text = (if (selected) "● " else "○ ") + mode.label,
                            color = if (selected) Color.White else Color(0xFFCBD5E1),
                            fontSize = 10.sp,
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
            }
        }
    }
}

/**
 * Encodeur QR Code Version 1 (21x21 ISO/IEC 18004) pur Kotlin sans dépendance externe
 * pour encoder le code d'appairage à 6 chiffres et être décodé par BarcodeDetector.
 */
object QrMatrixGenerator {
    fun encodeNumericOrByte(text: String): Array<BooleanArray> {
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

        // Format info & Dark module
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

        // Encodage Mode Byte (0100) + longueur + octets + Reed-Solomon V1-L (7 octets EC)
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

        // Placement en zigzag avec masque 0 ((r + c) % 2 == 0)
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

        // Format bits pour Level L, Mask 0 : 111011111000100
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
