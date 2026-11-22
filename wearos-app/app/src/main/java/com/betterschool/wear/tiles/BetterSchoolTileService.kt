package com.betterschool.wear.tiles

import android.content.Context
import com.betterschool.wear.data.SessionManager
import com.betterschool.wear.domain.TileDisplayMode
import com.betterschool.wear.domain.WearMockData

/**
 * Fournisseur de données pour la Tuile Wear OS (Phase 2).
 * Retourne l'information choisie par l'élève (Prochain Cours, Dernière Note ou Dernier Message).
 */
object BetterSchoolTileProvider {

    data class TileSnapshot(
        val headerBadge: String,
        val primaryText: String,
        val secondaryText: String
    )

    fun getActiveTileSnapshot(context: Context): TileSnapshot {
        val sessionManager = SessionManager(context)
        return when (sessionManager.tileDisplayMode) {
            TileDisplayMode.NEXT_COURSE -> {
                val c = WearMockData.todayCourses.first { it.isCurrent }
                TileSnapshot(
                    headerBadge = "PROCHAIN COURS • ${c.room}",
                    primaryText = c.subject,
                    secondaryText = "${c.startTime} - ${c.endTime} (${c.teacher})"
                )
            }
            TileDisplayMode.LATEST_GRADE -> {
                val g = WearMockData.grades.first()
                TileSnapshot(
                    headerBadge = "DERNIÈRE NOTE • ${g.subject}",
                    primaryText = "${g.scoreText} (${g.percentage}%)",
                    secondaryText = g.title
                )
            }
            TileDisplayMode.LATEST_MESSAGE -> {
                val m = WearMockData.messages.first()
                TileSnapshot(
                    headerBadge = "MESSAGE • ${m.senderName}",
                    primaryText = m.subject,
                    secondaryText = m.previewSnippet
                )
            }
        }
    }
}
