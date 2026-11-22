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
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.betterschool.wear.ui.pages.GradesPage
import com.betterschool.wear.ui.pages.HomeworkPage
import com.betterschool.wear.ui.pages.MessagesPage
import com.betterschool.wear.ui.pages.PairingAndProfilePage
import com.betterschool.wear.ui.pages.SchedulePage
import kotlinx.coroutines.delay
import java.time.LocalTime
import java.time.format.DateTimeFormatter

/**
 * Écran principal Wear OS conforme aux guidelines Google Wear OS & M3E Pro Dark :
 * - Coupe 100% des requêtes quand l'écran s'éteint (ON_PAUSE / ON_STOP).
 * - Affiche l'heure système (TimeText) tout en haut du cadran rond.
 * - beyondViewportPageCount = 0 pour préserver le mini-GPU de la montre.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun WearMainScreen(viewModel: WearViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    val lifecycleOwner = LocalLifecycleOwner.current

    // Arrêt total des requêtes dès que l'écran de la montre s'éteint
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_PAUSE, Lifecycle.Event.ON_STOP -> viewModel.onScreenPaused()
                Lifecycle.Event.ON_RESUME -> viewModel.onScreenResumed()
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    val timeFormatter = remember { DateTimeFormatter.ofPattern("HH:mm") }
    var currentTimeText by remember { mutableStateOf(LocalTime.now().format(timeFormatter)) }

    LaunchedEffect(Unit) {
        while (true) {
            currentTimeText = LocalTime.now().format(timeFormatter)
            delay(15_000L)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(M3ETheme.CanvasBg)
    ) {
        if (!uiState.isPaired && !uiState.isDemoMode) {
            PairingAndProfilePage(
                uiState = uiState,
                onRegenerateCode = { viewModel.startQrPairingOnWatch() },
                onEnterDemo = { viewModel.enterDemoMode() },
                onDisconnect = { viewModel.disconnectAndReturnToPairing() },
                onRefresh = { viewModel.refreshFromSmartschool(force = true) }
            )
        } else {
            val pagerState = rememberPagerState(
                initialPage = 0,
                pageCount = { 5 }
            )

            HorizontalPager(
                state = pagerState,
                beyondViewportPageCount = 0,
                modifier = Modifier.fillMaxSize()
            ) { pageIndex ->
                val isPageActive = pagerState.currentPage == pageIndex
                when (pageIndex) {
                    0 -> MessagesPage(
                        messages = uiState.messages,
                        isPageActive = isPageActive,
                        onOpenMessage = { viewModel.loadMessageBodyIfNeeded(it) }
                    )
                    1 -> GradesPage(
                        grades = uiState.grades,
                        weightedAverage = uiState.weightedAverage,
                        isPageActive = isPageActive
                    )
                    2 -> SchedulePage(
                        courses = uiState.todayCourses,
                        isLoading = uiState.isLoading,
                        isPageActive = isPageActive
                    )
                    3 -> HomeworkPage(
                        homeworks = uiState.homeworks,
                        onToggleHomework = { viewModel.toggleHomework(it) },
                        isPageActive = isPageActive
                    )
                    4 -> PairingAndProfilePage(
                        uiState = uiState,
                        onRegenerateCode = { viewModel.startQrPairingOnWatch() },
                        onEnterDemo = { viewModel.enterDemoMode() },
                        onDisconnect = { viewModel.disconnectAndReturnToPairing() },
                        onRefresh = { viewModel.refreshFromSmartschool(force = true) }
                    )
                }
            }

            // Indicateur de pagination M3E Pro en bas du cadran rond
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
                            .padding(horizontal = 2.5.dp)
                            .size(width = if (isSelected) 12.dp else 5.dp, height = 5.dp)
                            .clip(CircleShape)
                            .background(if (isSelected) M3ETheme.BrandIndigo else M3ETheme.CardBorder)
                    )
                }
            }
        }

        // Guideline officielle Wear OS : TimeText (heure courante en haut au centre du cadran)
        Text(
            text = currentTimeText,
            color = M3ETheme.TextMuted,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 4.dp)
        )
    }
}
