import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import { Font } from '../../Constants/Font';
import Button from '../../Component/Button';
import { ImageConstant } from '../../Constants/ImageConstant';
import { GET_WITH_TOKEN, POST_WITH_TOKEN } from '../../Backend/Backend';
import { JOB_LIMIT_STATUS, JOB_LIMIT_CREATE_ORDER, JOB_LIMIT_VERIFY_PAYMENT } from '../../Backend/api_routes';
import { initiatePayment } from '../../Services/RazorpayService';
import { useIsFocused } from '@react-navigation/native';
import Input from '../../Component/Input';
import SimpleToast from 'react-native-simple-toast';

const StaffWallet = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [limitInfo, setLimitInfo] = useState(null);
  const [payingLimit, setPayingLimit] = useState(false);
  const [creditsToBuy, setCreditsToBuy] = useState('10');

  const fetchWalletStatus = useCallback(() => {
    setLoading(true);
    GET_WITH_TOKEN(
      JOB_LIMIT_STATUS,
      success => {
        setLoading(false);
        if (success?.status === 'success') {
          setLimitInfo(success?.data);
        } else {
          SimpleToast.show(success?.message || 'Failed to fetch wallet balance.', SimpleToast.SHORT);
        }
      },
      error => {
        setLoading(false);
      },
      fail => {
        setLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      }
    );
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchWalletStatus();
    }
  }, [fetchWalletStatus, isFocused]);

  const handlePurchaseCredits = () => {
    if (payingLimit) return;
    if (!creditsToBuy || parseInt(creditsToBuy, 10) < 1) {
      SimpleToast.show('Please enter valid credits to purchase', SimpleToast.SHORT);
      return;
    }
    setPayingLimit(true);

    POST_WITH_TOKEN(
      JOB_LIMIT_CREATE_ORDER,
      { credits_to_purchase: parseInt(creditsToBuy, 10) },
      async success => {
        if (success?.status === 'success') {
          const order = success?.data;
          const options = {
            amount: order.amount,
            currency: order.currency,
            name: 'Sahayya',
            description: order.description || `${creditsToBuy} Job Application Credits`,
            orderId: order.order_id,
            prefill: {
              name: order.prefill_name || '',
              email: order.prefill_email || '',
              contact: order.prefill_contact || '',
            },
            theme: { color: '#0d6efd' }
          };

          try {
            const paymentResult = await initiatePayment(options);
            if (paymentResult.success) {
              POST_WITH_TOKEN(
                JOB_LIMIT_VERIFY_PAYMENT,
                {
                  razorpay_order_id: paymentResult.orderId,
                  razorpay_payment_id: paymentResult.paymentId,
                  razorpay_signature: paymentResult.signature,
                  credits_to_purchase: parseInt(creditsToBuy, 10),
                },
                verifySuccess => {
                  setPayingLimit(false);
                  if (verifySuccess?.status === 'success') {
                    SimpleToast.show(`${creditsToBuy} credits purchased successfully!`, SimpleToast.LONG);
                    setCreditsToBuy('10');
                    fetchWalletStatus(); // Refresh balance
                  } else {
                    SimpleToast.show(verifySuccess?.message || 'Payment verification failed.', SimpleToast.LONG);
                  }
                },
                verifyError => {
                  setPayingLimit(false);
                  SimpleToast.show('Verification failed. Please contact support.', SimpleToast.LONG);
                }
              );
            } else {
              setPayingLimit(false);
              SimpleToast.show(paymentResult.description || 'Payment cancelled.', SimpleToast.SHORT);
            }
          } catch (paymentErr) {
            setPayingLimit(false);
            SimpleToast.show('Payment execution error.', SimpleToast.SHORT);
          }
        } else {
          setPayingLimit(false);
          SimpleToast.show(success?.message || 'Failed to initialize payment.', SimpleToast.SHORT);
        }
      },
      error => {
        setPayingLimit(false);
        SimpleToast.show('Failed to create order on server.', SimpleToast.SHORT);
      }
    );
  };

  const pricePerCredit = limitInfo?.credit_purchase_price || 10;
  const totalPrice = parseInt(creditsToBuy || 0, 10) * pricePerCredit;

  return (
    <CommanView>
      <HeaderForUser
        title={'My Wallet'}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        style_title={{ fontSize: 18 }}
        source_logo={ImageConstant?.notification}
        onPressRightIcon={() => navigation.navigate('Notifications')}
      />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {loading && !limitInfo ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D98579" />
            </View>
          ) : (
            <>
              {/* Balance Card */}
              <View style={styles.balanceCard}>
                <View style={styles.iconCircle}>
                  <Typography type={Font?.Poppins_SemiBold} style={{ fontSize: 28, color: '#D98579' }}>
                    &#x2726;
                  </Typography>
                </View>
                <Typography type={Font.Poppins_Regular} style={styles.balanceLabel}>
                  Available Job Credits
                </Typography>
                <Typography type={Font.Poppins_Bold} style={styles.balanceValue}>
                  {limitInfo?.wallet_balance || 0}
                </Typography>
                <Typography type={Font.Poppins_Regular} style={styles.balanceDesc}>
                  You need {limitInfo?.credits_per_job_application || 5} credits to apply for one job.
                </Typography>
              </View>

              {/* Purchase Card */}
              <View style={styles.purchaseCard}>
                <Typography type={Font.Poppins_SemiBold} style={styles.cardTitle}>
                  Purchase Credits
                </Typography>
                <Typography type={Font.Poppins_Regular} style={styles.cardSubtitle}>
                  Buy credits to continue applying for jobs without interruption.
                </Typography>

                <View style={styles.inputSection}>
                  <Input
                    title="Credits to purchase"
                    value={String(creditsToBuy)}
                    onChange={setCreditsToBuy}
                    keyboardType="numeric"
                    style_input={styles.inputStyle}
                  />
                  
                  <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                      <Typography type={Font.Poppins_Regular} style={styles.summaryLabel}>
                        Price per credit
                      </Typography>
                      <Typography type={Font.Poppins_Medium} style={styles.summaryValue}>
                        ₹{pricePerCredit}
                      </Typography>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                      <Typography type={Font.Poppins_SemiBold} style={styles.totalLabel}>
                        Total Amount
                      </Typography>
                      <Typography type={Font.Poppins_Bold} style={styles.totalValue}>
                        ₹{totalPrice}
                      </Typography>
                    </View>
                  </View>
                </View>

                <Button
                  title={payingLimit ? 'Processing...' : `Pay ₹${totalPrice}`}
                  main_style={styles.payBtn}
                  disabled={payingLimit || totalPrice <= 0}
                  loader={payingLimit}
                  onPress={handlePurchaseCredits}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </CommanView>
  );
};

export default StaffWallet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 42,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  balanceDesc: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  purchaseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  cardTitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputStyle: {
    fontSize: 16,
  },
  summaryBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  totalLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    color: '#D98579',
  },
  payBtn: {
    width: '100%',
    borderRadius: 12,
  },
});
