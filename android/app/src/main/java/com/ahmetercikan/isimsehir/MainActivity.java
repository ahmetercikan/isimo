package com.ahmetercikan.isimsehir;

import android.animation.ObjectAnimator;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.View;
import android.view.WindowManager;

import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

/**
 * İsim Şehir: tam ekran oyun (sistem çubukları sürükleyince geçici görünür), oyun sırasında ekran kararmaz.
 * Yerel eklenti: InkPlugin (el yazısı tanıma).
 * Açılış ekranı (logo) en az SPLASH_MS ekranda kalır, sonra yumuşakça kaybolur: eskiden ilk karede hemen geçiyordu
 * ve arkasında sayfa daha yüklenmemiş oluyordu.
 */
public class MainActivity extends BridgeActivity {
    private static final long SPLASH_MS = 1600;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        final long shownAt = SystemClock.uptimeMillis();
        splash.setKeepOnScreenCondition(() -> SystemClock.uptimeMillis() - shownAt < SPLASH_MS);
        splash.setOnExitAnimationListener((view) -> {
            View v = view.getView();
            ObjectAnimator fade = ObjectAnimator.ofFloat(v, View.ALPHA, 1f, 0f);
            fade.setDuration(320);
            fade.addListener(new android.animation.AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(android.animation.Animator a) {
                    view.remove();
                }
            });
            fade.start();
        });
        registerPlugin(InkPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
