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

    @Override
    public void load() {
        super.load();
        initializeBillingClient();
    }

    private void initializeBillingClient() {
        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases()
                .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "BillingClient connected");
                    notifyListeners("billingReady", new JSObject().put("ready", true));
                } else {
                    Log.e(TAG, "BillingClient setup failed: " + billingResult.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.d(TAG, "BillingClient disconnected");
                // Try to reconnect
                initializeBillingClient();
            }
        });
    }

    @PluginMethod
    public void isReady(PluginCall call) {
        boolean ready = billingClient != null && billingClient.isReady();
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
            call.reject("Product not found. Query products first.");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

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
            call.reject("Failed to launch billing flow: " + result.getDebugMessage());
        }
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, @Nullable List<Purchase> purchases) {
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                handlePurchase(purchase);
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            if (pendingPurchaseCall != null) {
                pendingPurchaseCall.reject("Purchase cancelled by user");
                pendingPurchaseCall = null;
            }
            notifyListeners("purchaseCancelled", new JSObject());
        } else {
            if (pendingPurchaseCall != null) {
                pendingPurchaseCall.reject("Purchase failed: " + billingResult.getDebugMessage());
                pendingPurchaseCall = null;
            }
            notifyListeners("purchaseError", new JSObject().put("error", billingResult.getDebugMessage()));
        }
    }

    private void handlePurchase(Purchase purchase) {
        // For consumables, consume immediately
        ConsumeParams consumeParams = ConsumeParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken())
                .build();

        billingClient.consumeAsync(consumeParams, new ConsumeResponseListener() {
            @Override
            public void onConsumeResponse(@NonNull BillingResult billingResult, @NonNull String purchaseToken) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Purchase consumed successfully");
                    
                    JSObject purchaseData = new JSObject();
                    purchaseData.put("purchaseToken", purchase.getPurchaseToken());
                    purchaseData.put("orderId", purchase.getOrderId());
                    purchaseData.put("productId", purchase.getProducts().get(0));
                    purchaseData.put("purchaseTime", purchase.getPurchaseTime());
                    
                    if (pendingPurchaseCall != null) {
                        pendingPurchaseCall.resolve(purchaseData);
                        pendingPurchaseCall = null;
                    }
                    
                    notifyListeners("purchaseCompleted", purchaseData);
                } else {
                    Log.e(TAG, "Failed to consume purchase: " + billingResult.getDebugMessage());
                    if (pendingPurchaseCall != null) {
                        pendingPurchaseCall.reject("Failed to consume purchase");
                        pendingPurchaseCall = null;
                    }
                }
            }
        });
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build(),
            (billingResult, purchases) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
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
                    call.reject("Failed to restore purchases: " + billingResult.getDebugMessage());
                }
            }
        );
    }
}
