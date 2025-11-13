package com.gamewala.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
    
    @Override
    public void onStart() {
        super.onStart();
        
        // Set proper Chrome user agent to fix "403: disallowed_useragent" error
        // This must be done after the bridge is initialized
        try {
            // Use a post-delay to ensure WebView is fully initialized
            getBridge().getWebView().post(new Runnable() {
                @Override
                public void run() {
                    try {
                        WebView webView = getBridge().getWebView();
                        if (webView != null) {
                            // Build a proper Chrome Mobile user agent string
                            // Google requires this exact format to recognize it as a secure browser
                            String androidVersion = android.os.Build.VERSION.RELEASE;
                            String chromeUserAgent = String.format(
                                "Mozilla/5.0 (Linux; Android %s; %s) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                                androidVersion,
                                android.os.Build.MODEL
                            );
                            
                            webView.getSettings().setUserAgentString(chromeUserAgent);
                            
                            // Enable all required settings
                            webView.getSettings().setJavaScriptEnabled(true);
                            webView.getSettings().setDomStorageEnabled(true);
                            webView.getSettings().setDatabaseEnabled(true);
                            webView.getSettings().setAllowFileAccess(true);
                            webView.getSettings().setAllowContentAccess(true);
                            
                            // Enable third-party cookies for OAuth
                            android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
                            cookieManager.setAcceptThirdPartyCookies(webView, true);
                            cookieManager.setAcceptCookie(true);
                            
                            android.util.Log.d("MainActivity", "User agent set to: " + chromeUserAgent);
                        }
                    } catch (Exception e) {
                        android.util.Log.e("MainActivity", "Error setting user agent: " + e.getMessage(), e);
                    }
                }
            });
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Error in onStart: " + e.getMessage(), e);
        }
    }
}
