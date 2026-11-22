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
import androidx.compose.ui.unit.dp
import com.betterschool.wear.ui.pages.GradesPage
import com.betterschool.wear.ui.pages.HomeworkPage
import com.betterschool.wear.ui.pages.MessagesPage
import com.betterschool.wear.ui.pages.PairingAndProfilePage
import com.betterschool.wear.ui.pages.SchedulePage

/**
 * Écran principal Wear OS optimisé 60 FPS (M3E Pro).
 * - Si la montre n'est PAS connectée (!isPaired && !isDemoMode) :
 *   affiche DIRECTEMENT l'écran de Connexion (Code à 6 chiffres + QR Code).
 * - Une fois connectée (ou si l'utilisateur lance manuellement la démo) :
 *   active le carrousel horizontal fluide (Message <-> Note <-> Horaire <-> Devoirs <-> Compte).
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun WearMainScreen(viewModel: WearViewModel) {
    val uiState by viewModel.uiState.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(M3ETheme.CanvasBg)
    ) {
        if (!uiState.isPaired && !uiState.isDemoMode) {
            // Montre non connectée : ouverture directe sur l'écran de Connexion (zéro fausse donnée)
            PairingAndProfilePage(
                uiState = uiState,
                onRegenerateCode = { viewModel.startQrPairingOnWatch() },
                onEnterDemo = { viewModel.enterDemoMode() },
                onDisconnect = { viewModel.disconnectAndReturnToPairing() },
                onRefresh = { viewModel.refreshFromSmartschool() }
            )
        } else {
            val pagerState = rememberPagerState(
                initialPage = 0,
                pageCount = { 5 }
            )

            HorizontalPager(
                state = pagerState,
                beyondViewportPageCount = 1,
                modifier = Modifier.fillMaxSize()
            ) { pageIndex ->
                when (pageIndex) {
                    0 -> MessagesPage(messages = uiState.messages)
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
                        onRegenerateCode = { viewModel.startQrPairingOnWatch() },
                        onEnterDemo = { viewModel.enterDemoMode() },
                        onDisconnect = { viewModel.disconnectAndReturnToPairing() },
                        onRefresh = { viewModel.refreshFromSmartschool() }
                    )
                }
            }

            // Indicateur de pagination M3E Pro en bas du cadran rond
            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                repeat(5) { idx ->
                    val isSelected = pagerState.currentPage == idx
                    Box(
                        modifier = Modifier
                            .padding(horizontal = 2.5.dp)
                            .size(width = if (isSelected) 12.dp else 5.dp, height = 5.dp)
                            .clip(CircleShape)
                            .background(if (isSelected) M3ETheme.BrandIndigo else M3ETheme.CardBorder)
                    )
                }
            }
        }
    }
}
