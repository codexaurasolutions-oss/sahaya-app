import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import HeaderForUser from '../../Component/HeaderForUser';
import CommanView from '../../Component/CommanView';
import { Font } from '../../Constants/Font';
import Typography from '../../Component/UI/Typography';
import { ImageConstant } from '../../Constants/ImageConstant';
import Button from '../../Component/Button';
import { POST_WITH_TOKEN, GET_WITH_TOKEN } from '../../Backend/Backend';
import { SUBSCRIPTIONS_BY_ROLE, SUBSCRIPTIONS, SUBSCRIBE_PLAN, SUBSCRIPTION_USER_CURRENT, SUBSCRIPTION_USER_SUBSCRIBE, SUBSCRIPTION_USER_CREATE_ORDER, SUBSCRIPTION_USER_VERIFY } from '../../Backend/api_routes';
import { useSelector } from 'react-redux';
import SimpleToast from 'react-native-simple-toast';
import LocalizedStrings from '../../Constants/localization';
import { initiatePayment } from '../../Services/RazorpayService';

const HouseholdManager = ({ navigation }) => {
  const userDetail = useSelector(store => store?.userDetails);
  const userType = useSelector(store => store?.userType);

  const [subscriptions, setSubscriptions] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    fetchCurrentPlan();
    fetchSubscriptions();
  }, []);

  const fetchCurrentPlan = () => {
    GET_WITH_TOKEN(
      SUBSCRIPTION_USER_CURRENT,
      success => {
        const plan = success?.subscription || success?.data;
        if (plan) {
          setCurrentPlan(plan);
        }
      },
      error => {},
      fail => {},
    );
  };

  const fetchAllSubscriptions = () => {
    GET_WITH_TOKEN(
      SUBSCRIPTIONS,
      success => {
        setLoading(false);
        const subscriptionData = success?.data;
        if (subscriptionData && Array.isArray(subscriptionData)) {
          setSubscriptions(subscriptionData);
        } else {
          setSubscriptions([]);
        }
      },
      error => {
        setLoading(false);
        SimpleToast.show('Failed to fetch subscriptions', SimpleToast.SHORT);
        setSubscriptions([]);
      },
      fail => {
        setLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
        setSubscriptions([]);
      },
    );
  };

  const fetchSubscriptions = () => {
    setLoading(true);
    const payload = { role_id: userType };

    POST_WITH_TOKEN(
      SUBSCRIPTIONS_BY_ROLE,
      payload,
      success => {

        const subscriptionData = success?.data;
        if (subscriptionData && Array.isArray(subscriptionData) && subscriptionData.length > 0) {
          setLoading(false);
          setSubscriptions(subscriptionData);
        } else {
          fetchAllSubscriptions();
        }
      },
      error => {

        fetchAllSubscriptions();
      },
      fail => {
        setLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
        setSubscriptions([]);
      },
    );
  };

  const formatPrice = price => {
    if (!price || price === '0' || price === '0.00') return 'FREE';
    return `₹${price}`;
  };

  const formatValidity = (validity, type) => {
    if (type) return type.charAt(0).toUpperCase() + type.slice(1);
    if (!validity) return '';
    if (typeof validity === 'number') return `${validity} days`;
    return validity.charAt(0).toUpperCase() + validity.slice(1);
  };

  const handleSelectPlan = async subscription => {
    if (
      !subscription.price ||
      subscription.price === '0' ||
      subscription.price === '0.00'
    ) {
      subscribeToPlan(subscription, null);
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `You are about to purchase ${subscription.subscription_name} for ₹${subscription.price}. Do you want to proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => processPayment(subscription) },
      ],
    );
  };

  // Backend only exposes POST /subscription/subscribe. Open Razorpay directly and
  // activate via /subscription/subscribe on success.
  const processPayment = async subscription => {
    setPaymentLoading(true);
    setSelectedPlanId(subscription.id);

    try {
      const amountInPaise = Math.round(parseFloat(subscription.price) * 100);
      const result = await initiatePayment({
        amount: amountInPaise,
        currency: 'INR',
        description: `${subscription.subscription_name} Membership`,
        prefill: {
          name: userDetail?.first_name
            ? `${userDetail.first_name} ${userDetail.last_name || ''}`
            : userDetail?.name || '',
          email: userDetail?.email || '',
          contact: userDetail?.phone || userDetail?.mobile || '',
        },
      });

      console.log('[HouseholdManager] Razorpay result:', JSON.stringify(result));

      if (result.success) {
        activateAfterPayment(subscription, result);
      } else {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        if (result.code === 0 || result.code === 2) {
          SimpleToast.show('Payment cancelled', SimpleToast.SHORT);
        } else {
          SimpleToast.show(
            result.description || 'Payment failed. Please try again.',
            SimpleToast.SHORT,
          );
        }
      }
    } catch (error) {
      console.log('[HouseholdManager] Payment error:', error);
      setPaymentLoading(false);
      setSelectedPlanId(null);
      SimpleToast.show('Payment failed. Please try again.', SimpleToast.SHORT);
    }
  };

  const activateAfterPayment = (subscription, paymentResult) => {
    POST_WITH_TOKEN(
      SUBSCRIPTION_USER_SUBSCRIBE,
      { subscriptionId: subscription.id, paymentId: paymentResult?.paymentId || null },
      success => {
        console.log('[HouseholdManager] Activate success:', JSON.stringify(success));
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show(
          success?.message || 'Subscription activated successfully!',
          SimpleToast.LONG,
        );
        fetchCurrentPlan();
      },
      error => {
        console.log('[HouseholdManager] Activate error:', JSON.stringify(error));
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show(
          error?.data?.message || 'Payment received but activation failed. Please contact support.',
          SimpleToast.LONG,
        );
      },
      () => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const verifyAndActivate = (subscription, paymentResult, subscriptionUserId) => {
    console.log('[HouseholdManager] Verifying payment - paymentId:', paymentResult.paymentId);

    POST_WITH_TOKEN(
      SUBSCRIPTION_USER_VERIFY,
      {
        razorpay_order_id: paymentResult.orderId,
        razorpay_payment_id: paymentResult.paymentId,
        razorpay_signature: paymentResult.signature,
        subscription_user_id: subscriptionUserId,
      },
      (success) => {
        console.log('[HouseholdManager] Verify success:', JSON.stringify(success));
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Subscription activated successfully!', SimpleToast.LONG);
        fetchCurrentPlan();
      },
      (error) => {
        console.log('[HouseholdManager] Verify error, falling back:', JSON.stringify(error));
        activateViaSubscribePlan(subscription, paymentResult);
      },
      () => {
        console.log('[HouseholdManager] Verify network fail, falling back');
        activateViaSubscribePlan(subscription, paymentResult);
      }
    );
  };

  const activateViaSubscribePlan = (subscription, paymentResult) => {
    const payload = {
      subscription_id: subscription.id,
      payment_id: paymentResult?.paymentId || null,
      payment_status: 'success',
      amount: subscription.price || '0',
    };
    console.log('[HouseholdManager] Fallback SUBSCRIBE_PLAN payload:', JSON.stringify(payload));

    POST_WITH_TOKEN(
      SUBSCRIBE_PLAN,
      payload,
      success => {
        console.log('[HouseholdManager] SUBSCRIBE_PLAN success:', JSON.stringify(success));
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Subscription activated successfully!', SimpleToast.LONG);
        fetchCurrentPlan();
      },
      error => {
        console.log('[HouseholdManager] SUBSCRIBE_PLAN error:', JSON.stringify(error));
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Payment received! Please restart app to see your plan.', SimpleToast.LONG);
        fetchCurrentPlan();
      },
      fail => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Payment received! Please restart app to see your plan.', SimpleToast.LONG);
        fetchCurrentPlan();
      }
    );
  };

  const subscribeToPlan = (subscription) => {
    setPaymentLoading(true);
    setSelectedPlanId(subscription.id);

    POST_WITH_TOKEN(
      SUBSCRIPTION_USER_SUBSCRIBE,
      { subscriptionId: subscription.id, paymentId: null },
      success => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show(success?.message || 'Subscription activated successfully!', SimpleToast.LONG);
        fetchCurrentPlan();
      },
      error => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        const msg = error?.data?.message || error?.message || 'Failed to activate subscription.';
        SimpleToast.show(msg, SimpleToast.SHORT);
      },
      fail => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.EditProfile?.Choose_Plan || 'Choose Your Plan'}
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        source_logo={ImageConstant?.notification}
        onPressRightIcon={() => navigation.navigate('Notification')}
        style_title={styles.headerTitle}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : subscriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography type={Font.Poppins_Medium} style={styles.emptyText}>
            {LocalizedStrings.EditProfile?.No_subscriptions ||
              'No subscriptions available'}
          </Typography>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {currentPlan && (
            <View style={styles.currentPlanCard}>
              <View style={styles.currentPlanBadge}>
                <Typography type={Font.Poppins_Bold} style={styles.currentPlanBadgeText}>
                  Current Plan
                </Typography>
              </View>
              <Typography type={Font.Poppins_Bold} style={styles.currentPlanName}>
                {currentPlan.subscription_name || currentPlan.subscription?.subscription_name || currentPlan.name || 'Active Plan'}
              </Typography>
              <Typography type={Font.Poppins_Regular} style={styles.currentPlanPrice}>
                {formatPrice(
                  currentPlan?.subscription?.price ??
                  currentPlan?.price ??
                  currentPlan?.amount
                )}
                {(currentPlan?.subscription?.type || currentPlan?.subscription?.validity || currentPlan?.type || currentPlan?.validity) &&
                  ` / ${formatValidity(
                    currentPlan?.subscription?.validity ?? currentPlan?.validity,
                    currentPlan?.subscription?.type ?? currentPlan?.type
                  )}`}
              </Typography>
              <Typography type={Font.Poppins_Regular} style={styles.currentPlanDateText}>
                Order: {currentPlan.order_number || ''}
              </Typography>
              {(currentPlan.start_date || currentPlan.end_date) && (
                <View style={styles.currentPlanDates}>
                  {currentPlan.start_date && (
                    <Typography type={Font.Poppins_Regular} style={styles.currentPlanDateText}>
                      Start: {new Date(currentPlan.start_date).toLocaleDateString()}
                    </Typography>
                  )}
                  {currentPlan.end_date && (
                    <Typography type={Font.Poppins_Regular} style={styles.currentPlanDateText}>
                      Expires: {new Date(currentPlan.end_date).toLocaleDateString()}
                    </Typography>
                  )}
                </View>
              )}
              <View style={styles.currentPlanStatusRow}>
                <View style={[styles.statusDot, {
                  backgroundColor:
                    (currentPlan.status || currentPlan.payment_status) === 'active' || (currentPlan.status || currentPlan.payment_status) === 'paid'
                      ? '#4CAF50' : '#FFC107'
                }]} />
                <Typography type={Font.Poppins_Medium} style={styles.currentPlanStatus}>
                  {(() => {
                    const s = currentPlan.status || currentPlan.payment_status || 'Active';
                    return s.charAt(0).toUpperCase() + s.slice(1);
                  })()}
                </Typography>
              </View>
            </View>
          )}

          <Typography type={Font.Poppins_Bold} style={styles.sectionTitle}>
            {subscriptions.length > 0 ? 'Available Plans' : ''}
          </Typography>

          {subscriptions.map((subscription, index) => {
            const extra = subscription?.extra;
            let featureArray = [];
            if (Array.isArray(extra)) {
              featureArray = extra.map(item => item?.feature || item).filter(Boolean);
            } else if (extra && typeof extra === 'object') {
              featureArray = Object.keys(extra)
                .filter(key => key !== 'key_word')
                .map(key => extra[key]);
            }

            return (
              <View key={subscription.id || index} style={styles.premiumCard}>
                <View style={styles.rowBetween}>
                  <View>
                    <Typography
                      type={Font.Poppins_Bold}
                      style={styles.premiumTitle}
                    >
                      {subscription.subscription_name ||
                        LocalizedStrings.EditProfile?.Plan ||
                        'Plan'}
                    </Typography>
                    <Typography style={styles.price}>
                      {formatPrice(subscription.price)}
                      {(subscription.type || subscription.validity) &&
                        ` / ${formatValidity(subscription.validity, subscription.type)}`}
                    </Typography>
                  </View>
                  {subscription.extra?.key_word === 'best' && (
                    <Image
                      source={ImageConstant.win}
                      style={styles.iconSmall}
                    />
                  )}
                </View>

                <Typography
                  type={Font.Poppins_Light}
                  style={{ marginVertical: 10 }}
                >
                  {subscription.description ||
                    LocalizedStrings.EditProfile?.Access_Features ||
                    'Access to all premium features including advanced scheduling and multi-device sync.'}
                </Typography>

                {featureArray.length > 0 ? (
                  featureArray.map((item, idx) => (
                    <View key={idx} style={styles.row}>
                      <Image
                        source={ImageConstant.correct}
                        style={styles.bulletIcon}
                      />
                      <Typography style={styles.benefit}>{item}</Typography>
                    </View>
                  ))
                ) : (
                  <Typography style={styles.benefit}>
                    {LocalizedStrings.EditProfile?.No_features ||
                      'No features listed'}
                  </Typography>
                )}

                <View style={styles.planButtons}>
                  {currentPlan?.subscription_id === subscription.id || currentPlan?.id === subscription.id ? (
                    <View style={[styles.upgradeBtn, { backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }]}>
                      <Typography type={Font.Poppins_Bold} style={{ color: 'white', fontSize: 16 }}>
                        Active Plan
                      </Typography>
                    </View>
                  ) : (
                    <Button
                      title={
                        paymentLoading && selectedPlanId === subscription.id
                          ? 'Processing...'
                          : LocalizedStrings.EditProfile?.Select_Plan || 'Select Plan'
                      }
                      main_style={styles.upgradeBtn}
                      onPress={() => handleSelectPlan(subscription)}
                      loader={paymentLoading && selectedPlanId === subscription.id}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </CommanView>
  );
};

export default HouseholdManager;

const styles = StyleSheet.create({
  headerTitle: { fontSize: 18 },
  scrollContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  premiumCard: {
    backgroundColor: '#EBEBEA',
    borderRadius: 12,
    padding: 16,
    marginTop: 15,
    marginBottom: 10,
    width: '95%',
  },
  premiumTitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  price: {
    fontSize: 15,
    color: '#E87C6F',
    marginBottom: 10,
  },
  benefit: {
    fontSize: 14,
    marginVertical: 2,
  },

  planButtons: {
    marginTop: 15,
  },
  upgradeBtn: { width: '100%' },

  bulletIcon: {
    width: 15,
    height: 15,
    tintColor: '#D98579',
    marginRight: 6,
  },
  iconSmall: {
    width: 20,
    height: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentPlanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '95%',
    borderWidth: 1.5,
    borderColor: '#D98579',
    marginBottom: 10,
  },
  currentPlanBadge: {
    backgroundColor: '#D98579',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  currentPlanBadgeText: {
    color: '#fff',
    fontSize: 12,
  },
  currentPlanName: {
    fontSize: 18,
    color: '#000',
    marginBottom: 4,
  },
  currentPlanPrice: {
    fontSize: 16,
    color: '#D98579',
    marginBottom: 8,
  },
  currentPlanDates: {
    backgroundColor: '#F9F3F2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  currentPlanDateText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  currentPlanStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  currentPlanStatus: {
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#000',
    width: '95%',
    marginTop: 10,
    marginBottom: 5,
  },
});