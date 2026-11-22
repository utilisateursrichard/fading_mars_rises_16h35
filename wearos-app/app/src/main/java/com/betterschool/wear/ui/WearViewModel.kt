package com.betterschool.wear.ui

import android.app.Application
import androidx.compose.runtime.Immutable
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.betterschool.wear.data.PairingTicket
import com.betterschool.wear.data.SessionManager
import com.betterschool.wear.data.SmartschoolApiClient
import com.betterschool.wear.data.SmartschoolParsers
import com.betterschool.wear.domain.TileDisplayMode
import com.betterschool.wear.domain.WearCourseEvent
import com.betterschool.wear.domain.WearGrade
import com.betterschool.wear.domain.WearHomework
import com.betterschool.wear.domain.WearMessage
import com.betterschool.wear.domain.WearMockData
import com.betterschool.wear.domain.WearStudentProfile
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

@Immutable
data class WearUiState(
    val isLoading: Boolean = false,
    val isPaired: Boolean = false,
    val isDemoMode: Boolean = false,
    val schoolHost: String = "",
    val profile: WearStudentProfile = WearStudentProfile("", "", "", "", ""),
    val todayCourses: List<WearCourseEvent> = emptyList(),
    val messages: List<WearMessage> = emptyList(),
    val grades: List<WearGrade> = emptyList(),
    val weightedAverage: Double? = null,
    val homeworks: List<WearHomework> = emptyList(),
    val pairingTicket: PairingTicket? = null,
    val isPollingPairing: Boolean = false,
    val tileDisplayMode: TileDisplayMode = TileDisplayMode.NEXT_COURSE,
    val statusBanner: String? = null
)

class WearViewModel(application: Application) : AndroidViewModel(application) {

    private val sessionManager = SessionManager(application.applicationContext)
    private val apiClient = SmartschoolApiClient(sessionManager)

    private val _uiState = MutableStateFlow(WearUiState())
    val uiState: StateFlow<WearUiState> = _uiState.asStateFlow()

    private var pairingPollJob: Job? = null

    init {
        initializeSessionState()
    }

    private fun initializeSessionState() {
        val paired = sessionManager.isPaired
        val demo = sessionManager.isDemoMode

        when {
            paired -> {
                _uiState.update {
                    it.copy(
                        isPaired = true,
                        isDemoMode = false,
                        schoolHost = sessionManager.schoolHost,
                        tileDisplayMode = sessionManager.tileDisplayMode,
                        weightedAverage = sessionManager.cachedAveragePct,
                        profile = WearStudentProfile(
                            userId = sessionManager.userId,
                            platformId = sessionManager.platformId,
                            fullName = sessionManager.studentName.ifEmpty { "Élève connecté" },
                            studentClass = sessionManager.studentClass,
                            schoolName = sessionManager.schoolName.ifEmpty { "Smartschool" }
                        )
                    )
                }
                refreshFromSmartschool()
            }
            demo -> {
                applyDemoData()
            }
            else -> {
                _uiState.update {
                    it.copy(
                        isPaired = false,
                        isDemoMode = false,
                        todayCourses = emptyList(),
                        messages = emptyList(),
                        grades = emptyList(),
                        homeworks = emptyList()
                    )
                }
                startQrPairingOnWatch()
            }
        }
    }

    private fun applyDemoData() {
        pairingPollJob?.cancel()
        val avg = SmartschoolParsers.computeWeightedGeneralAverage(WearMockData.grades)
        _uiState.update {
            it.copy(
                isLoading = false,
                isPaired = false,
                isDemoMode = true,
                isPollingPairing = false,
                profile = WearMockData.profile,
                todayCourses = WearMockData.todayCourses,
                messages = WearMockData.messages,
                grades = WearMockData.grades,
                weightedAverage = avg,
                homeworks = WearMockData.homeworks,
                statusBanner = "Mode Démo"
            )
        }
    }

    fun enterDemoMode() {
        sessionManager.isDemoMode = true
        applyDemoData()
    }

    fun disconnectAndReturnToPairing() {
        sessionManager.clearSession()
        _uiState.update {
            WearUiState(
                isPaired = false,
                isDemoMode = false
            )
        }
        startQrPairingOnWatch()
    }

    /**
     * Interroge directement <ecole>.smartschool.be depuis la montre via OkHttp.
     * Aucune donnée ne provient d'un snapshot d'appairage.
     */
    fun refreshFromSmartschool() {
        if (sessionManager.isDemoMode && !sessionManager.isPaired) {
            applyDemoData()
            return
        }
        if (!sessionManager.hasValidLiveSession) {
            _uiState.update {
                it.copy(
                    isLoading = false,
                    statusBanner = "Session manquante (ré-associez la montre)"
                )
            }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, statusBanner = "Connexion directe à Smartschool...") }

            try {
                // 0. Si la montre a des identifiants mais pas encore de PHPSESSID, elle se connecte elle-même à /login
                if (!sessionManager.cookies.contains("PHPSESSID") && sessionManager.hasCredentials) {
                    apiClient.loginToSmartschool()
                }

                // 1. Découverte et certification du profil réel sur Smartschool (/Studentcard/Student/getStudents)
                val certifiedProfile = apiClient.fetchDirectStudentProfile()
                if (certifiedProfile != null) {
                    sessionManager.userId = certifiedProfile.userId
                    sessionManager.studentName = certifiedProfile.fullName
                    sessionManager.studentClass = certifiedProfile.studentClass
                }

                // 2. Requêtes directes vers Smartschool : Horaire & Devoirs, Notes Skore, Messages Dispatcher
                val (courses, homeworks) = apiClient.fetchDirectScheduleAndHomeworks()
                val grades = runCatching { apiClient.fetchDirectGrades() }.getOrDefault(emptyList())
                val messages = runCatching { apiClient.fetchDirectMessages() }.getOrDefault(emptyList())

                // 3. Moyenne générale (SQLite ou calcul direct sur les évaluations Skore récupérées par la montre)
                val sqliteAvg = runCatching {
                    apiClient.fetchSqliteUserAverage(sessionManager.userId)
                }.getOrNull()
                val effectiveAvg = sqliteAvg
                    ?: SmartschoolParsers.computeWeightedGeneralAverage(grades)
                    ?: sessionManager.cachedAveragePct
                if (effectiveAvg != null) {
                    sessionManager.cachedAveragePct = effectiveAvg
                }

                _uiState.update { state ->
                    state.copy(
                        isLoading = false,
                        isDemoMode = false,
                        isPaired = true,
                        profile = certifiedProfile ?: state.profile,
                        todayCourses = courses,
                        homeworks = homeworks,
                        grades = grades,
                        weightedAverage = effectiveAvg,
                        messages = messages,
                        statusBanner = apiClient.lastSmartschoolTrace
                    )
                }
            } catch (e: Exception) {
                _uiState.update { state ->
                    state.copy(
                        isLoading = false,
                        statusBanner = "${apiClient.lastSmartschoolTrace} (${e.message ?: "Erreur"})"
                    )
                }
            }
        }
    }

    fun toggleHomework(homework: WearHomework) {
        val targetCompleted = !homework.isCompleted

        _uiState.update { state ->
            state.copy(
                homeworks = state.homeworks.map {
                    if (it.id == homework.id) it.copy(isCompleted = targetCompleted) else it
                }
            )
        }

        if (!uiState.value.isDemoMode && sessionManager.hasValidLiveSession) {
            viewModelScope.launch {
                apiClient.toggleHomeworkResolved(
                    platformId = homework.platformId,
                    assignmentId = homework.assignmentId,
                    resolve = targetCompleted
                )
            }
        }
    }

    /**
     * Lors de l'appairage, la montre reçoit UNIQUEMENT ses paramètres d'authentification
     * (aucun snapshot de cours/messages/notes) et lance immédiatement refreshFromSmartschool() !
     */
    fun startQrPairingOnWatch() {
        pairingPollJob?.cancel()
        pairingPollJob = viewModelScope.launch {
            val localCode = (100000..999999).random().toString()
            _uiState.update {
                it.copy(
                    isPollingPairing = true,
                    pairingTicket = PairingTicket(
                        code = localCode,
                        qrUrl = "https://betterschool.dino.icu/?wearPair=$localCode"
                    ),
                    statusBanner = "En attente de connexion..."
                )
            }

            val ticket = apiClient.createPairingTicket()
            _uiState.update {
                it.copy(
                    pairingTicket = ticket,
                    statusBanner = "Entrez ce code sur BetterSchool Web"
                )
            }

            val startTime = System.currentTimeMillis()
            while (isActive && System.currentTimeMillis() - startTime < 5 * 60 * 1000L) {
                delay(2000L)
                val pairedPayload = apiClient.pollPairingSession(ticket.code)
                if (pairedPayload != null) {
                    sessionManager.savePairedSession(pairedPayload)
                    _uiState.update { state ->
                        state.copy(
                            isPollingPairing = false,
                            pairingTicket = null,
                            isDemoMode = false,
                            isPaired = true,
                            isLoading = true,
                            schoolHost = sessionManager.schoolHost,
                            profile = WearStudentProfile(
                                userId = pairedPayload.userId,
                                platformId = pairedPayload.platformId,
                                fullName = pairedPayload.studentName.ifEmpty { "Connexion Smartschool..." },
                                studentClass = pairedPayload.studentClass,
                                schoolName = pairedPayload.schoolName.ifEmpty { "Smartschool" }
                            ),
                            todayCourses = emptyList(),
                            homeworks = emptyList(),
                            messages = emptyList(),
                            grades = emptyList(),
                            weightedAverage = pairedPayload.overallAveragePct,
                            statusBanner = "Authentification directe Smartschool..."
                        )
                    }
                    // La montre interroge immédiatement Smartschool par elle-même !
                    refreshFromSmartschool()
                    break
                }
            }
        }
    }

    fun setTileDisplayMode(mode: TileDisplayMode) {
        sessionManager.tileDisplayMode = mode
        _uiState.update { it.copy(tileDisplayMode = mode) }
    }
}
