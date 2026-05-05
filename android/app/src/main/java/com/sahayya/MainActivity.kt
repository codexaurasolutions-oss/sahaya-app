package com.sahayya
import android.os.Bundle 
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate
import org.devio.rn.splashscreen.SplashScreen 

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)
        SplashScreen.show(this, R.style.SplashScreenTheme, true)
    }

  override fun getMainComponentName(): String = "Sahayya"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, false)
}
