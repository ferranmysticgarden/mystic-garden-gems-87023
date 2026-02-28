package com.mysticgarden.game;

import android.app.Activity;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.ConsumeResponseListener;
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
                .enablePendingPurchases()
                .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "✅ BillingClient connected successfully");
                    connectionRetryCount = 0;
                    notifyListeners("billingReady", new JSObject().put("ready", true));
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
        List<String> productIds = call.getArray("productIds").toList();
        
        if (productIds == null || productIds.isEmpty()) {
            call.reject("No product IDs provided");
            return;
        }

        Log.d(TAG, "Querying " + productIds.size() + " products: " + productIds.toString());

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

        billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(@NonNull BillingResult billingResult, @NonNull List<ProductDetails> list) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "✅ Products found: " + list.size() + " of " + productIds.size() + " requested");
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
                            Log.d(TAG, "  Product: " + details.getProductId() + " = " + details.getOneTimePurchaseOfferDetails().getFormattedPrice());
                        }
                        
                        ret.put(details.getProductId(), product);
                    }
                    
                    if (list.size() < productIds.size()) {
                        Log.w(TAG, "⚠️ Only " + list.size() + "/" + productIds.size() + " products found. Missing products may not be active in Google Play Console.");
                    }
                    
                    call.resolve(ret);
                } else {
                    Log.e(TAG, "❌ Failed to query products: code=" + billingResult.getResponseCode() + " msg=" + billingResult.getDebugMessage());
                    call.reject("Failed to query products: " + billingResult.getDebugMessage());
                }
            }
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        
        if (productId == null) {
            call.reject("Product ID is required");
            return;
        }

        ProductDetails productDetails = productDetailsMap.get(productId);
        if (productDetails == null) {
            Log.e(TAG, "❌ Product not found in cache: " + productId + ". Available: " + productDetailsMap.keySet().toString());
            call.reject("Product not found. Query products first.");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        Log.d(TAG, "Launching purchase flow for: " + productId);
        pendingPurchaseCall = call;

        List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
        productDetailsParamsList.add(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .build()
        );

        BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build();

        BillingResult result = billingClient.launchBillingFlow(activity, billingFlowParams);
        
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            pendingPurchaseCall = null;
            Log.e(TAG, "❌ Failed to launch billing flow: " + result.getDebugMessage());
            call.reject("Failed to launch billing flow: " + result.getDebugMessage());
        }
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, @Nullable List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            Log.d(TAG, "✅ Purchase update received: " + purchases.size() + " purchase(s)");
            for (Purchase purchase : purchases) {
                handlePurchase(purchase);
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            Log.d(TAG, "Purchase cancelled by user");
            if (pendingPurchaseCall != null) {
                pendingPurchaseCall.reject("Purchase cancelled by user");
                pendingPurchaseCall = null;
            }
            notifyListeners("purchaseCancelled", new JSObject());
        } else {
            Log.e(TAG, "❌ Purchase failed: code=" + billingResult.getResponseCode() + " msg=" + billingResult.getDebugMessage());
            if (pendingPurchaseCall != null) {
                pendingPurchaseCall.reject("Purchase failed: " + billingResult.getDebugMessage());
                pendingPurchaseCall = null;
            }
            notifyListeners("purchaseError", new JSObject().put("error", billingResult.getDebugMessage()));
        }
    }

    private void handlePurchase(Purchase purchase) {
        String productId = purchase.getProducts().get(0);
        Log.d(TAG, "Processing purchase: " + productId + " token=" + purchase.getPurchaseToken().substring(0, 20) + "...");
        
        // Build purchase data first (before consuming)
        JSObject purchaseData = new JSObject();
        purchaseData.put("purchaseToken", purchase.getPurchaseToken());
        purchaseData.put("orderId", purchase.getOrderId());
        purchaseData.put("productId", productId);
        purchaseData.put("purchaseTime", purchase.getPurchaseTime());

        // Notify JS layer FIRST so it can verify with backend
        // Then consume after verification succeeds
        if (pendingPurchaseCall != null) {
            pendingPurchaseCall.resolve(purchaseData);
            pendingPurchaseCall = null;
        }
        
        notifyListeners("purchaseCompleted", purchaseData);

        // Consume the purchase (for consumables, allows re-purchase)
        ConsumeParams consumeParams = ConsumeParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken())
                .build();

        billingClient.consumeAsync(consumeParams, new ConsumeResponseListener() {
            @Override
            public void onConsumeResponse(@NonNull BillingResult billingResult, @NonNull String purchaseToken) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "✅ Purchase consumed successfully: " + productId);
                } else {
                    Log.e(TAG, "❌ Failed to consume purchase: " + billingResult.getDebugMessage());
                    // Purchase was already granted to user via purchaseCompleted event
                    // Consumption failure means the product can't be re-purchased until consumed
                    // This is safer than the old approach of consuming first
                }
            }
        });
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        Log.d(TAG, "Restoring purchases...");
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build(),
            (billingResult, purchases) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "✅ Found " + purchases.size() + " purchase(s) to restore");
                    JSObject ret = new JSObject();
                    for (int i = 0; i < purchases.size(); i++) {
                        Purchase p = purchases.get(i);
                        JSObject purchaseData = new JSObject();
                        purchaseData.put("purchaseToken", p.getPurchaseToken());
                        purchaseData.put("orderId", p.getOrderId());
                        purchaseData.put("productId", p.getProducts().get(0));
                        ret.put(String.valueOf(i), purchaseData);
                    }
                    call.resolve(ret);
                } else {
                    Log.e(TAG, "❌ Failed to restore purchases: " + billingResult.getDebugMessage());
                    call.reject("Failed to restore purchases: " + billingResult.getDebugMessage());
                }
            }
        );
    }
}
