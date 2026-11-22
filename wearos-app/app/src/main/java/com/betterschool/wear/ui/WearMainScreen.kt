package com.betterschool.wear.ui

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.betterschool.wear.ui.pages.GradesPage
import com.betterschool.wear.ui.pages.HomeworkPage
import com.betterschool.wear.ui.pages.MessagesPage
import com.betterschool.wear.ui.pages.PairingAndProfilePage
import com.betterschool.wear.ui.pages.SchedulePage

/**
 * Écran principal Wear OS avec navigation par scroll horizontal (gauche <-> droite) :
 * - Page 0 : Dernier Message (lecture directe sans réponses pré-définies)
 * - Page 1 : Dernière Note Skore & Moyenne Générale
 * - Page 2 : Prochain Cours en direct & Horaire du jour
 * - Page 3 : Checklist des Devoirs cochables au poignet
 * - Page 4 : QR Code d'Appairage (affiché par la montre) & Profil
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun WearMainScreen(viewModel: WearViewModel) {
    val uiState by viewModel.uiState.collectAsState()

    val pagerState = rememberPagerState(
        initialPage = 0,
        pageCount = { 5 }
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF090D16)) // Noir OLED M3E Pro
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { pageIndex ->
            when (pageIndex) {
                0 -> MessagesPage(
                    messages = uiState.messages,
                    isDemoMode = uiState.isDemoMode
                )
                1 -> GradesPage(
                    grades = uiState.grades,
                    weightedAverage = uiState.weightedAverage
                )
                2 -> SchedulePage(
                    courses = uiState.todayCourses,
                    isLoading = uiState.isLoading
                )
                3 -> HomeworkPage(
                    homeworks = uiState.homeworks,
                    onToggleHomework = { viewModel.toggleHomework(it) }
                )
                4 -> PairingAndProfilePage(
                    uiState = uiState,
                    onStartQrPairing = { viewModel.startQrPairingOnWatch() },
                    onStopQrPairing = { viewModel.stopQrPairingOnWatch() },
                    onRefresh = { viewModel.refreshFromSmartschool() },
                    onToggleDemo = { viewModel.toggleDemoMode() },
                    onSelectTileMode = { viewModel.setTileDisplayMode(it) }
                )
            }
        }

        // Indicateur de page horizontal en bas de l'écran rond
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(bottom = 6.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            repeat(5) { idx ->
                val isSelected = pagerState.currentPage == idx
                Box(
                    modifier = Modifier
                        .padding(horizontal = 3.dp)
                        .size(if (isSelected) 7.dp else 5.dp)
                        .clip(CircleShape)
                        .background(if (isSelected) Color(0xFF6366F1) else Color(0xFF334155))
                )
            }
        }
    }
}
