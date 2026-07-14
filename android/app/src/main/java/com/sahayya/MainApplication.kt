package com.sahayya

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import okhttp3.Protocol

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()

    // Railway responses were intermittently failing while OkHttp consumed an
    // otherwise successful HTTP/2/gzip response. Keep React Native API calls on
    // the simpler HTTP/1.1 path and avoid cached/compressed response bodies.
    OkHttpClientProvider.setOkHttpClientFactory(
        OkHttpClientFactory {
          OkHttpClientProvider.createClientBuilder()
              .protocols(listOf(Protocol.HTTP_1_1))
              .retryOnConnectionFailure(true)
              .addInterceptor { chain ->
                val request =
                    chain
                        .request()
                        .newBuilder()
                        .header("Accept-Encoding", "identity")
                        .header("Cache-Control", "no-store")
                        .build()
                chain.proceed(request)
              }
              .build()
        })

    loadReactNative(this)
  }
}
