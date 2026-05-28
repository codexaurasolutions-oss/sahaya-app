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
import { SUBSCRIPTIONS_BY_ROLE, SUBSCRIPTIONS, SUBSCRIBE_PLAN, SUBSCRIPTION_USER_CREATE_ORDER, SUBSCRIPTION_USER_VERIFY, SUBSCRIPTION_USER_SUBSCRIBE } from '../../Backend/api_routes';
import { useSelector, useDispatch } from 'react-redux';
import SimpleToast from 'react-native-simple-toast';
import LocalizedStrings from '../../Constants/localization';
import { initiatePayment } from '../../Services/RazorpayService';
import { isAuth } from '../../Redux/action';

const ChoosePlan = ({ navigation, route }) => {
  const userDetail = useSelector(store => store?.userDetails);
  const userTypeFromRoute = route?.params?.userType;
  const userTypeFromStore = useSelector(store => store?.userType);
  const currentUserType = userTypeFromRoute || userTypeFromStore;
  const autoFreeOnMount = route?.params?.autoFreeOnMount === true;
  const autoSubscribedRef = useRef(false);

  const Dispatch = useDispatch();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

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
      console.log('[ChoosePlan] Auto-activating free plan for staff, id:', freePlan.id);
      POST_WITH_TOKEN(
        SUBSCRIPTION_USER_SUBSCRIBE,
        { subscriptionId: freePlan.id, paymentId: null },
        s => {
          console.log('[ChoosePlan] Auto free-plan success:', JSON.stringify(s));
          navigation.navigate('ApplyReferral', { isFirstTime: true });
        },
        e => {
          console.log('[ChoosePlan] Auto free-plan error:', JSON.stringify(e));
          SimpleToast.show(
            e?.data?.message || 'Failed to activate free plan. Please select a plan.',
            SimpleToast.LONG,
          );
          autoSubscribedRef.current = false;
        },
        () => {
          console.log('[ChoosePlan] Auto free-plan network fail');
          SimpleToast.show('Network error while activating free plan.', SimpleToast.SHORT);
          autoSubscribedRef.current = false;
        },
      );
      return;
    }
    SimpleToast.show('No free plan available for staff. Please select a plan.', SimpleToast.LONG);
    autoSubscribedRef.current = false;
  }, [subscriptions, loading, currentUserType, autoFreeOnMount]);

  const fetchAllSubscriptions = (roleId) => {
    GET_WITH_TOKEN(
      SUBSCRIPTIONS,
      success => {
        setLoading(false);
        const subscriptionData = success?.data;
        if (subscriptionData && Array.isArray(subscriptionData)) {
          // Filter plans by role_id to avoid showing wrong plans
          const filtered = subscriptionData.filter(plan => {
            const planRole = plan?.role_id || plan?.user_role_id;
            // Show plan if it matches the user's role, or if plan has no role restriction
            return !planRole || String(planRole) === String(roleId);
          });
          console.log('[ChoosePlan] All plans:', subscriptionData.length, '| Filtered for role', roleId, ':', filtered.length);
          setSubscriptions(filtered.length > 0 ? filtered : subscriptionData);
        } else {
          setSubscriptions([]);
        }
      },
      error => {
        setLoading(false);
        SimpleToast.show(
          'Failed to fetch subscriptions',
          SimpleToast.SHORT,
        );
        setSubscriptions([]);
      },
      fail => {
        setLoading(false);
        SimpleToast.show(
          'Network error. Please try again.',
          SimpleToast.SHORT,
        );
        setSubscriptions([]);
      },
    );
  };

  const filterByRole = (plans, roleId) => {
    if (!plans || !Array.isArray(plans)) return [];
    const filtered = plans.filter(plan => {
      const planRole = plan?.role_id || plan?.user_role_id;
      // Keep plan if it matches user's role, or if plan has no role set
      return !planRole || String(planRole) === String(roleId);
    });
    console.log('[ChoosePlan] filterByRole - total:', plans.length, 'filtered:', filtered.length, 'for role:', roleId);
    return filtered.length > 0 ? filtered : plans;
  };

  const fetchSubscriptions = () => {
    setLoading(true);
    const roleId = currentUserType;
    console.log('[ChoosePlan] Fetching subscriptions for role_id:', roleId);
    const payload = { role_id: roleId };
    POST_WITH_TOKEN(
      SUBSCRIPTIONS_BY_ROLE,
      payload,
      success => {
        console.log('[ChoosePlan] SUBSCRIPTIONS_BY_ROLE response:', JSON.stringify(success));
        const subscriptionData = success?.data;
        if (subscriptionData && Array.isArray(subscriptionData) && subscriptionData.length > 0) {
          setLoading(false);
          setSubscriptions(filterByRole(subscriptionData, roleId));
        } else {
          // No role-specific subscriptions found, fetch all and filter by role
          fetchAllSubscriptions(roleId);
        }
      },
      error => {
        console.log('[ChoosePlan] SUBSCRIPTIONS_BY_ROLE error:', JSON.stringify(error));
        // Fallback to all subscriptions filtered by role
        fetchAllSubscriptions(roleId);
      },
      fail => {
        setLoading(false);
        SimpleToast.show(
          'Network error. Please try again.',
          SimpleToast.SHORT,
        );
        setSubscriptions([]);
      },
    );
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
    const userRole = currentUserType;

    // For new signups, always go to ApplyReferral first to collect referral data
    // ApplyReferral will then dispatch isAuth(true), and StaffStacks will handle next steps
    navigation.navigate('ApplyReferral', { isFirstTime: true });
  };

  const handleSelectPlan = async subscription => {
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

  const subscribeToPlan = (subscription) => {
    setPaymentLoading(true);
    setSelectedPlanId(subscription.id);

    console.log('[ChoosePlan] Subscribing to free plan, subscription_id:', subscription.id);

    // Use the same endpoint that works in MemberShip.js
    POST_WITH_TOKEN(
      SUBSCRIPTION_USER_SUBSCRIBE,
      { subscriptionId: subscription.id, paymentId: null },
      success => {
        console.log('[ChoosePlan] Subscribe success:', JSON.stringify(success));
        setPaymentLoading(false);
        setSelectedPlanId(null);
        SimpleToast.show(success?.message || 'Subscription activated successfully!', SimpleToast.LONG);
        proceedToApp();
      },
      error => {
        console.log('[ChoosePlan] Subscribe error, trying fallback:', JSON.stringify(error));
        // Fallback to SUBSCRIBE_PLAN endpoint
        POST_WITH_TOKEN(
          SUBSCRIBE_PLAN,
          {
            subscription_id: subscription.id,
            payment_id: null,
            payment_status: 'free',
            amount: '0',
          },
          success => {
            setPaymentLoading(false);
            setSelectedPlanId(null);
            SimpleToast.show('Subscription activated successfully!', SimpleToast.LONG);
            proceedToApp();
          },
          error2 => {
            console.log('[ChoosePlan] Fallback also failed:', JSON.stringify(error2));
            setPaymentLoading(false);
            setSelectedPlanId(null);
            SimpleToast.show('Failed to activate subscription.', SimpleToast.SHORT);
          },
          fail => {
            setPaymentLoading(false);
            setSelectedPlanId(null);
            SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
          },
        );
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
            {'No subscriptions available'}
          </Typography>
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
