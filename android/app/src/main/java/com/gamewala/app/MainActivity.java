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
        
        // Set proper user agent after bridge is initialized
        // This fixes the "403: disallowed_useragent" error from Google
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                // Get current user agent
                String currentUserAgent = webView.getSettings().getUserAgentString();
                
                // Ensure it includes Chrome identifier so Google recognizes it as a secure browser
                if (!currentUserAgent.contains("Chrome")) {
                    // Build a proper Chrome Mobile user agent
                    // Format: Mozilla/5.0 (Linux; Android X.X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/XXX.0.0.0 Mobile Safari/537.36
                    String chromeUserAgent = currentUserAgent.replace("Version/", "Chrome/120.0.0.0 Mobile Safari/");
                    if (!chromeUserAgent.contains("Chrome")) {
                        // If still no Chrome, append it
                        chromeUserAgent = currentUserAgent + " Chrome/120.0.0.0 Mobile Safari/537.36";
                    }
                    webView.getSettings().setUserAgentString(chromeUserAgent);
                }
                
                // Ensure all required settings are enabled
                webView.getSettings().setJavaScriptEnabled(true);
                webView.getSettings().setDomStorageEnabled(true);
                webView.getSettings().setDatabaseEnabled(true);
                webView.getSettings().setAllowFileAccess(true);
                webView.getSettings().setAllowContentAccess(true);
                
                // Enable third-party cookies for OAuth
                android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
            }
        } catch (Exception e) {
            // Log error but don't crash
            android.util.Log.e("MainActivity", "Error setting user agent: " + e.getMessage());
        }
    }
}
