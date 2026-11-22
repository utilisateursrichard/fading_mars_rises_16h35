# Règles R8 / ProGuard pour BetterSchool Wear OS
-keepattributes *Annotation*,InnerClasses,Signature,EnclosingMethod
-dontwarn okhttp3.**
-dontwarn okio.**
-keepclassmembers class com.betterschool.wear.domain.** { *; }
