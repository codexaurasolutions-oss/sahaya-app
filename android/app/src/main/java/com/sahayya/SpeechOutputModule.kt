package com.sahayya

import android.os.Bundle
import android.speech.tts.TextToSpeech
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Locale
import java.util.UUID
import java.util.concurrent.ConcurrentLinkedQueue

class SpeechOutputModule(
    private val context: ReactApplicationContext,
) : ReactContextBaseJavaModule(context), TextToSpeech.OnInitListener {

  private data class SpeechRequest(
      val text: String,
      val languageTag: String,
      val promise: Promise,
  )

  private val pending = ConcurrentLinkedQueue<SpeechRequest>()
  private var engine: TextToSpeech? = TextToSpeech(context.applicationContext, this)

  @Volatile private var ready = false
  @Volatile private var initializationFailed = false

  override fun getName(): String = "SpeechOutput"

  override fun onInit(status: Int) {
    ready = status == TextToSpeech.SUCCESS
    initializationFailed = !ready

    context.runOnUiQueueThread {
      while (pending.isNotEmpty()) {
        val request = pending.poll() ?: continue
        if (ready) {
          speakNow(request)
        } else {
          request.promise.reject("TTS_UNAVAILABLE", "Text-to-speech is unavailable on this phone.")
        }
      }
    }
  }

  @ReactMethod
  fun speak(text: String, languageTag: String?, promise: Promise) {
    val cleanText = text.trim()
    if (cleanText.isEmpty()) {
      promise.resolve(false)
      return
    }

    val request = SpeechRequest(cleanText, languageTag?.trim().orEmpty(), promise)
    when {
      ready -> context.runOnUiQueueThread { speakNow(request) }
      initializationFailed ->
          promise.reject("TTS_UNAVAILABLE", "Text-to-speech is unavailable on this phone.")
      else -> pending.add(request)
    }
  }

  private fun speakNow(request: SpeechRequest) {
    val tts = engine
    if (tts == null) {
      request.promise.reject("TTS_UNAVAILABLE", "Text-to-speech is unavailable on this phone.")
      return
    }

    val requestedLocale =
        request.languageTag.takeIf { it.isNotBlank() }?.let(Locale::forLanguageTag)
            ?: Locale.getDefault()
    val languageResult = tts.setLanguage(requestedLocale)
    if (
        languageResult == TextToSpeech.LANG_MISSING_DATA ||
            languageResult == TextToSpeech.LANG_NOT_SUPPORTED
    ) {
      tts.setLanguage(Locale.getDefault())
    }

    val matchingFemaleVoice =
        tts.voices
            ?.filter { voice -> voice.locale.language == requestedLocale.language }
            ?.firstOrNull { voice -> voice.name.contains("female", ignoreCase = true) }
    if (matchingFemaleVoice != null) {
      tts.voice = matchingFemaleVoice
    }

    tts.setPitch(1.05f)
    tts.setSpeechRate(0.95f)
    val result =
        tts.speak(
            request.text,
            TextToSpeech.QUEUE_FLUSH,
            Bundle(),
            "sahayya-search-${UUID.randomUUID()}",
        )

    if (result == TextToSpeech.ERROR) {
      request.promise.reject("TTS_FAILED", "The search confirmation could not be spoken.")
    } else {
      request.promise.resolve(true)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    engine?.stop()
    promise.resolve(true)
  }

  override fun invalidate() {
    pending.forEach { request ->
      request.promise.reject("TTS_CLOSED", "Text-to-speech was closed.")
    }
    pending.clear()
    engine?.stop()
    engine?.shutdown()
    engine = null
    ready = false
    super.invalidate()
  }
}
