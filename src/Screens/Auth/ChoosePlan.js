import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import { ImageConstant } from '../../Constants/ImageConstant';
import { Font } from '../../Constants/Font';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import { POST_WITH_TOKEN, GET_WITH_TOKEN } from '../../Backend/Backend';
import { SUBSCRIPTIONS_BY_ROLE, SUBSCRIPTIONS, SUBSCRIBE_PLAN, SUBSCRIPTION_USER_VERIFY, SUBSCRIPTION_USER_SUBSCRIBE } from '../../Backend/api_routes';
import { useSelector } from 'react-redux';
import SimpleToast from 'react-native-simple-toast';
import LocalizedStrings from '../../Constants/localization';
import { initiatePayment } from '../../Services/RazorpayService';

const ChoosePlan = ({ navigation, route }) => {
  const userDetail = useSelector(store => store?.userDetails);
  const userTypeFromRoute = route?.params?.userType;
  const userTypeFromStore = useSelector(store => store?.userType);
  const normalizeRoleId = value => {
    const normalized = String(value ?? '').toLowerCase();
    if (normalized === '2' || normalized === 'staff') return 2;
    if (
      normalized === '3' ||
      normalized === 'house' ||
      normalized === 'householder' ||
      normalized === 'house_owner'
    ) {
      return 3;
    }
    return 3;
  };
  const currentUserType = normalizeRoleId(
    userTypeFromRoute || userDetail?.user_role_id || userTypeFromStore,
  );
  const autoFreeOnMount = route?.params?.autoFreeOnMount === true;
  const autoSubscribedRef = useRef(false);

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  const requestWithRetry = async (requester, attempts = 2) => {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await requester();
      } catch (error) {
        lastError = error;
        if (attempt < attempts) {
          await wait(700);
        }
      }
    }
    throw lastError;
  };

  const getWithTokenRequest = routeName =>
    new Promise((resolve, reject) => {
      GET_WITH_TOKEN(
        routeName,
        resolve,
        error => reject({ kind: 'api', error }),
        fail => reject({ kind: 'network', error: fail }),
      );
    });

  const postWithTokenRequest = (routeName, payload) =>
    new Promise((resolve, reject) => {
      POST_WITH_TOKEN(
        routeName,
        payload,
        resolve,
        error => reject({ kind: 'api', error }),
        fail => reject({ kind: 'network', error: fail }),
      );
    });

  // Auto-subscribe new staff users (role 2) to the free plan right after signup,
  // so they skip the membership screen on first entry. When the free plan expires,
  // gated screens (JobDetails / AIJobSearch) route back here WITHOUT autoFreeOnMount,
  // so the full plan list is shown instead.
  useEffect(() => {
    if (!autoFreeOnMount) return;
    if (String(currentUserType) !== '2') return;
    if (autoSubscribedRef.current) return;
    if (loading) return;

    autoSubscribedRef.current = true;

    const freePlan = subscriptions.find(
      p => !p?.price || p.price === '0' || p.price === '0.00',
    );

    if (freePlan) {
      subscribeToPlan(freePlan, true);
      return;
    }
    SimpleToast.show('No free plan available for staff. Please select a plan.', SimpleToast.LONG);
    autoSubscribedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions, loading, currentUserType, autoFreeOnMount]);

  const filterByRole = (plans, roleId) => {
    if (!plans || !Array.isArray(plans)) return [];
    const filtered = plans.filter(plan => {
      const planRole = plan?.role_id || plan?.user_role_id;
      // Keep plan if it matches user's role, or if plan has no role set
      return !planRole || String(planRole) === String(roleId);
    });
    return filtered.length > 0 ? filtered : plans;
  };

  const readPlans = response => (Array.isArray(response?.data) ? response.data : []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setFetchError('');
    const roleId = currentUserType;

    try {
      let plans = [];

      try {
        const roleResponse = await requestWithRetry(
          () => postWithTokenRequest(SUBSCRIPTIONS_BY_ROLE, { role_id: roleId }),
          2,
        );
        plans = filterByRole(readPlans(roleResponse), roleId);
      } catch (roleError) {
        plans = [];
      }

      if (!plans.length) {
        const allResponse = await requestWithRetry(
          () => getWithTokenRequest(SUBSCRIPTIONS),
          2,
        );
        plans = filterByRole(readPlans(allResponse), roleId);
      }

      setSubscriptions(plans);
      setFetchError(plans.length ? '' : 'No subscriptions available');
    } catch (error) {
      setSubscriptions([]);
      setFetchError('Could not load plans. Please tap Retry.');
      SimpleToast.show('Could not load plans. Please try again.', SimpleToast.SHORT);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = price => {
    if (!price || price === '0' || price === '0.00') return 'FREE';
    return `₹${price}`;
  };

  const formatValidity = (validity, type) => {
    if (type) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
    if (!validity) return '';
    if (typeof validity === 'number') return `${validity} days`;
    return validity.charAt(0).toUpperCase() + validity.slice(1);
  };

  const proceedToApp = () => {
    // After plan selection, check if profile is complete
    // If not, go to EditProfile first, then ApplyReferral, then Dashboard
    // For new signups, always go to ApplyReferral first to collect referral data
    // ApplyReferral will then dispatch isAuth(true), and StaffStacks will handle next steps
    navigation.navigate('ApplyReferral', { isFirstTime: true });
  };

  const handleSelectPlan = async subscription => {
    if (paymentLoading) return;

    const isFree = !subscription.price || subscription.price === '0' || subscription.price === '0.00';
    if (isFree) {
      subscribeToPlan(subscription);
      return;
    }
    // Paid plan - try Razorpay
    Alert.alert(
      'Confirm Payment',
      `You are about to purchase ${subscription.subscription_name} for ₹${subscription.price}. Do you want to proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => processPayment(subscription) },
      ],
    );
  };

  // Backend only exposes POST /subscription/subscribe — there is no create-order /
  // verify-payment endpoint. We open Razorpay directly with a client-side amount
  // and, on payment success, activate the plan by calling /subscription/subscribe
  // with { subscriptionId, paymentId }.
  const processPayment = async subscription => {
    setPaymentLoading(true);
    setSelectedPlanId(subscription.id);

    try {
      const amountInPaise = Math.round(parseFloat(subscription.price) * 100);
      let result;
      try {
        result = await initiatePayment({
          amount: amountInPaise,
          currency: 'INR',
          description: `${subscription.subscription_name} Membership`,
          prefill: {
            name: userDetail?.first_name
              ? `${userDetail.first_name} ${userDetail.last_name || ''}`
              : userDetail?.name || '',
            email: userDetail?.email || '',
            contact: userDetail?.phone || userDetail?.mobile || userDetail?.phone_number || '',
          },
        });
      } catch (razorpayErr) {
        // Razorpay SDK not available or crashed - fallback to direct subscribe
        console.log('[ChoosePlan] Razorpay unavailable, fallback:', razorpayErr);
        result = { success: false, code: -99, description: 'Razorpay unavailable' };
      }

      console.log('[ChoosePlan] Razorpay result:', JSON.stringify(result));

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
      console.log('[ChoosePlan] Payment error:', error);
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
        console.log('[ChoosePlan] Activate success:', JSON.stringify(success));
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show(
          success?.message || 'Subscription activated successfully!',
          SimpleToast.LONG,
        );
        proceedToApp();
      },
      error => {
        console.log('[ChoosePlan] Activate error:', JSON.stringify(error));
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
    POST_WITH_TOKEN(
      SUBSCRIPTION_USER_VERIFY,
      {
        razorpay_order_id: paymentResult.orderId,
        razorpay_payment_id: paymentResult.paymentId,
        razorpay_signature: paymentResult.signature,
        subscription_user_id: subscriptionUserId,
      },
      (success) => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Subscription activated successfully!', SimpleToast.LONG);
        proceedToApp();
      },
      (error) => {
        console.log('[ChoosePlan] Verify error, falling back:', JSON.stringify(error));
        activateViaSubscribePlan(subscription, paymentResult);
      },
      () => {
        activateViaSubscribePlan(subscription, paymentResult);
      }
    );
  };

  const activateViaSubscribePlan = (subscription, paymentResult) => {
    POST_WITH_TOKEN(
      SUBSCRIBE_PLAN,
      {
        subscription_id: subscription.id,
        payment_id: paymentResult?.paymentId || null,
        payment_status: 'success',
        amount: subscription.price || '0',
      },
      success => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Subscription activated successfully!', SimpleToast.LONG);
        proceedToApp();
      },
      error => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Payment received!', SimpleToast.SHORT);
        proceedToApp();
      },
      fail => {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        proceedToApp();
      },
    );
  };

  const subscribeToPlan = async (subscription, isAuto = false) => {
    if (paymentLoading) return;

    setPaymentLoading(true);
    setSelectedPlanId(subscription.id);

    try {
      const success = await requestWithRetry(
        () => postWithTokenRequest(
          SUBSCRIPTION_USER_SUBSCRIBE,
          {
            subscriptionId: subscription.id,
            paymentId: null,
            role_id: currentUserType,
          },
        ),
        2,
      );

      setPaymentLoading(false);
      setSelectedPlanId(null);
      SimpleToast.show(
        success?.message || 'Subscription activated successfully!',
        SimpleToast.LONG,
      );
      proceedToApp();
    } catch (primaryError) {
      try {
        await requestWithRetry(
          () => postWithTokenRequest(
            SUBSCRIBE_PLAN,
            {
              subscription_id: subscription.id,
              payment_id: null,
              payment_status: 'free',
              amount: '0',
              role_id: currentUserType,
            },
          ),
          1,
        );

        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show('Subscription activated successfully!', SimpleToast.LONG);
        proceedToApp();
      } catch (fallbackError) {
        setPaymentLoading(false);
        setSelectedPlanId(null);
        if (isAuto) {
          autoSubscribedRef.current = false;
        }
        const message =
          fallbackError?.error?.data?.message ||
          fallbackError?.error?.message ||
          primaryError?.error?.data?.message ||
          primaryError?.error?.message ||
          'Could not activate subscription. Please try again.';
        SimpleToast.show(message, SimpleToast.SHORT);
      }
    }
  };

  return (
    <CommanView>
      <HeaderForUser
        title={
          LocalizedStrings.EditProfile?.Choose_Plan || 'Choose Your Plan'
        }
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation?.goBack()}
        style_title={styles.headerTitle}
      />

      {loading || (autoFreeOnMount && String(currentUserType) === '2' && !autoSubscribedRef.current) ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      ) : subscriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography type={Font.Poppins_Medium} style={styles.emptyText}>
            {fetchError || 'No subscriptions available'}
          </Typography>
          {fetchError && fetchError !== 'No subscriptions available' ? (
            <Button
              title="Retry"
              main_style={styles.retryButton}
              onPress={fetchSubscriptions}
            />
          ) : null}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
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
                      {subscription.subscription_name || 'Plan'}
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
                    No features listed
                  </Typography>
                )}

                <View style={styles.planButtons}>
                  <Button
                    title={
                      paymentLoading && selectedPlanId === subscription.id
                        ? 'Processing...'
                        : 'Select Plan'
                    }
                    main_style={styles.upgradeBtn}
                    onPress={() => handleSelectPlan(subscription)}
                    disabled={paymentLoading}
                    loader={
                      paymentLoading && selectedPlanId === subscription.id
                    }
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </CommanView>
  );
};

export default ChoosePlan;

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
  retryButton: {
    width: 140,
    marginTop: 16,
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
});
