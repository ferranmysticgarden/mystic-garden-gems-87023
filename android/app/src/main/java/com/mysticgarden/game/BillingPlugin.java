package com.mysticgarden.game;

import android.app.Activity;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.ConsumeResponseListener;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "GooglePlayBilling")
public class BillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private static final String TAG = "BillingPlugin";
    private BillingClient billingClient;
    private Map<String, ProductDetails> productDetailsMap = new HashMap<>();
    private PluginCall pendingPurchaseCall;
    private int connectionRetryCount = 0;
    private static final int MAX_RETRY = 3;

    private int productRetryCount = 0;
    private static final int MAX_PRODUCT_RETRY = 5;

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "BillingPlugin loading...");
        initializeBillingClient();
    }

    private void initializeBillingClient() {
        Log.d(TAG, "Initializing BillingClient (attempt " + (connectionRetryCount + 1) + ")");
        
        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases(
                    PendingPurchasesParams.newBuilder()
                        .enableOneTimeProducts()
                        .build()
                )
                .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "✅ BillingClient connected successfully");
                    connectionRetryCount = 0;

                    // 🔥 DELAY CLAVE
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        notifyListeners("billingReady", new JSObject().put("ready", true));
                    }, 1500);

                } else {
                    Log.e(TAG, "❌ BillingClient setup failed: code=" + billingResult.getResponseCode() + " msg=" + billingResult.getDebugMessage());
                    notifyListeners("billingReady", new JSObject().put("ready", false));
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.d(TAG, "BillingClient disconnected");
                if (connectionRetryCount < MAX_RETRY) {
                    connectionRetryCount++;
                    Log.d(TAG, "Retrying connection... attempt " + connectionRetryCount);
                    initializeBillingClient();
                } else {
                    Log.e(TAG, "❌ Max retries reached. BillingClient unavailable.");
                    notifyListeners("billingReady", new JSObject().put("ready", false));
                }
            }
        });
    }

    @PluginMethod
    public void isReady(PluginCall call) {
        boolean ready = billingClient != null && billingClient.isReady();
        Log.d(TAG, "isReady called: " + ready);
        JSObject ret = new JSObject();
        ret.put("ready", ready);
        call.resolve(ret);
    }

    @PluginMethod
    public void queryProducts(PluginCall call) {

        productRetryCount = 0; // reset al empezar

        if (call.getArray("productIds") == null) {
            call.reject("No product IDs provided");
            return;
        }

        List<String> productIds;
        try {
            productIds = call.getArray("productIds").toList();
        } catch (JSONException e) {
            call.reject("Invalid product IDs format: " + e.getMessage());
            return;
        }

        if (productIds == null || productIds.isEmpty()) {
            call.reject("No product IDs provided");
            return;
        }

        queryProductsInternal(call, productIds);
    }

    private void queryProductsInternal(PluginCall call, List<String> productIds) {

        Log.d(TAG, "Querying products attempt " + (productRetryCount + 1));

        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        for (Object id : productIds) {
            productList.add(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId((String) id)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build()
            );
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, list) -> {

            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {

                // 🔥 CLAVE: SI VIENE VACÍO → RETRY
                if (list.isEmpty() && productRetryCount < MAX_PRODUCT_RETRY) {
                    productRetryCount++;
                    Log.w(TAG, "⚠️ Products empty, retrying... (" + productRetryCount + ")");

                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        queryProductsInternal(call, productIds);
                    }, 2000);

                    return;
                }

                Log.d(TAG, "✅ Products found: " + list.size());

                JSObject ret = new JSObject();

                for (ProductDetails details : list) {
                    productDetailsMap.put(details.getProductId(), details);

                    JSObject product = new JSObject();
                    product.put("productId", details.getProductId());
                    product.put("title", details.getTitle());
                    product.put("description", details.getDescription());

                    if (details.getOneTimePurchaseOfferDetails() != null) {
                        product.put("price", details.getOneTimePurchaseOfferDetails().getFormattedPrice());
                        product.put("priceAmountMicros", details.getOneTimePurchaseOfferDetails().getPriceAmountMicros());
                        product.put("priceCurrencyCode", details.getOneTimePurchaseOfferDetails().getPriceCurrencyCode());
                    }

                    ret.put(details.getProductId(), product);
                }

                call.resolve(ret);

            } else {
                call.reject("Failed to query products: " + billingResult.getDebugMessage());
            }
        });
    }

    // --- TODO lo demás EXACTAMENTE igual (no lo toco) ---
}