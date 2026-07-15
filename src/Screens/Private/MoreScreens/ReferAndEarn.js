import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Share,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Clipboard,
} from 'react-native';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Button from '../../../Component/Button';
import { GET_WITH_TOKEN, POST_WITH_TOKEN } from '../../../Backend/Backend';
import {
  ReferralCode,
  ReferralHistory,
  ReferralCreditApply,
} from '../../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import { ImageConstant } from '../../../Constants/ImageConstant';
import EmptyView from '../../../Component/UI/EmptyView';

const formatRewardValue = value => {
  const numericValue = Number(value || 0);
  return Number.isInteger(numericValue)
    ? String(numericValue)
    : numericValue.toFixed(2);
};

const ReferAndEarn = ({ navigation }) => {
  const [referralData, setReferralData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creditLoading, setCreditLoading] = useState(false);

  useEffect(() => {
    fetchReferralCode();
    fetchReferralHistory();
  }, []);

  const fetchReferralCode = () => {
    GET_WITH_TOKEN(
      ReferralCode,
      success => {
        setReferralData(success?.data);
        setLoading(false);
      },
      error => {
        setLoading(false);
        SimpleToast.show('Failed to load referral info', SimpleToast.SHORT);
      },
      () => {
        setLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const fetchReferralHistory = () => {
    GET_WITH_TOKEN(
      ReferralHistory,
      success => {
        setHistory(success?.data?.referrals || success?.data || []);
      },
      error => {},
      () => {},
    );
  };

  const handleCopyCode = () => {
    const code = referralData?.referral_code || '';
    Clipboard.setString(code);
    SimpleToast.show('Referral code copied!', SimpleToast.SHORT);
  };

  const handleShare = async () => {
    const code = referralData?.referral_code || '';
    const isStaff = referralData?.is_staff;
    const message = isStaff
      ? `Hey! I'm using Sahayya to find household jobs. Use my referral code: *${code}* and help me earn reward points for job credits!`
      : `Hey! I'm using Sahayya to manage household staff. It's super easy to find staff, manage payments, and more.\n\nDownload the Sahayya app and use my referral code: *${code}* to get started!`;
    try {
      await Share.share({ message, title: 'Refer Sahayya' });
    } catch (error) {
      SimpleToast.show('Failed to share', SimpleToast.SHORT);
    }
  };

  const handleCreditApply = () => {
    setCreditLoading(true);
    POST_WITH_TOKEN(
      ReferralCreditApply,
      {},
      success => {
        setCreditLoading(false);
        SimpleToast.show(
          success?.message || 'Points redeemed successfully!',
          SimpleToast.SHORT,
        );
        fetchReferralCode();
        fetchReferralHistory();
      },
      error => {
        setCreditLoading(false);
        SimpleToast.show(
          error?.response?.data?.message ||
            error?.data?.message ||
            error?.message ||
            'Failed to redeem points',
          SimpleToast.SHORT,
        );
      },
      () => {
        setCreditLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const isStaff = Boolean(referralData?.is_staff);
  const pointsBalance = Number(
    referralData?.points_balance ?? referralData?.total_earnings ?? 0,
  );
  const redeemedCredits = Number(referralData?.redeemed_credits || 0);
  const redeemableCredits = Number(referralData?.redeemable_credits || 0);
  const pointsPerCredit = Number(referralData?.points_per_credit || 10);
  const pointsPerReferral = Number(referralData?.points_per_referral || 0);

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={{ flex: 1 }}>
        <Typography type={Font?.Poppins_Medium} size={14}>
          {item?.referred_user?.name || item?.referred_user_name || item?.name || 'User'}
        </Typography>
        <Typography type={Font?.Poppins_Regular} size={12} color="#8C8D8B">
          {item?.created_at || item?.date || ''}
        </Typography>
      </View>
      <View style={styles.historyReward}>
        {isStaff ? (
          <Typography type={Font?.Poppins_SemiBold} size={13} color="#D98579">
            +{formatRewardValue(item?.reward_amount)} points
          </Typography>
        ) : null}
        <Typography
          type={Font?.Poppins_Medium}
          size={11}
          color={item?.status === 'completed' ? '#16A34A' : '#EFB034'}>
          {item?.status || 'Pending'}
        </Typography>
      </View>
    </View>
  );

  if (loading) {
    return (
      <CommanView>
        <HeaderForUser
          title="Refer & Earn"
          source_arrow={ImageConstant?.BackArrow}
          onPressLeftIcon={() => navigation.goBack()}
          style_title={{ fontSize: 18 }}
        />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D98579" />
        </View>
      </CommanView>
    );
  }

  return (
    <CommanView>
      <HeaderForUser
        title="Refer & Earn"
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        style_title={{ fontSize: 18 }}
      />

      {/* Referral Code Card */}
      <View style={styles.codeCard}>
        <Typography type={Font?.Poppins_Regular} size={14} color="#8C8D8B">
          Your Referral Code
        </Typography>
        <TouchableOpacity style={styles.codeRow} onPress={handleCopyCode} activeOpacity={0.7}>
          <Typography type={Font?.Poppins_SemiBold} size={28} color="#D98579">
            {referralData?.referral_code || '---'}
          </Typography>
          <View style={styles.copyBadge}>
            <Typography type={Font?.Poppins_Medium} size={11} color="#D98579">
              Copy
            </Typography>
          </View>
        </TouchableOpacity>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Typography type={Font?.Poppins_SemiBold} size={20}>
              {referralData?.referral_count || 0}
            </Typography>
            <Typography type={Font?.Poppins_Regular} size={12} color="#8C8D8B">
              Referrals
            </Typography>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Typography type={Font?.Poppins_SemiBold} size={20}>
              {isStaff ? formatRewardValue(pointsBalance) : `\u20B9${referralData?.total_earnings || '0.00'}`}
            </Typography>
            <Typography type={Font?.Poppins_Regular} size={12} color="#8C8D8B">
              {isStaff ? 'Points' : 'Earnings'}
            </Typography>
          </View>
        </View>
        <Button
          title="Share Referral Code"
          onPress={handleShare}
          main_style={{ width: '100%', marginTop: 15 }}
        />
      </View>

      {/* Earnings / Credit Card */}
      <View style={styles.earningsCard}>
        {isStaff ? (
          <>
            <Typography type={Font?.Poppins_Medium} size={16}>
              Referral Rewards
            </Typography>
            <View style={styles.rewardBalances}>
              <View style={styles.rewardBalanceItem}>
                <Typography type={Font?.Poppins_Regular} size={11} color="#8C8D8B">
                  Available Points
                </Typography>
                <Typography type={Font?.Poppins_SemiBold} size={24} color="#D98579">
                  {formatRewardValue(pointsBalance)}
                </Typography>
              </View>
              <View style={styles.rewardBalanceDivider} />
              <View style={styles.rewardBalanceItem}>
                <Typography type={Font?.Poppins_Regular} size={11} color="#8C8D8B">
                  Redeemed Credits
                </Typography>
                <Typography type={Font?.Poppins_SemiBold} size={24} color="#16A34A">
                  {formatRewardValue(redeemedCredits)}
                </Typography>
              </View>
            </View>
            <View style={styles.exchangeCard}>
              <Typography type={Font?.Poppins_Medium} size={12} color="#7A4A43">
                {formatRewardValue(pointsPerCredit)} points = 1 job credit
              </Typography>
              <Typography type={Font?.Poppins_Regular} size={11} color="#8C6C67">
                Earn {formatRewardValue(pointsPerReferral)} points for every successful referral.
              </Typography>
            </View>
            <Button
              title={creditLoading ? 'Redeeming...' : 'Redeem Points'}
              onPress={handleCreditApply}
              main_style={styles.redeemButton}
              disabled={creditLoading || redeemableCredits < 1}
              loader={creditLoading}
            />
            {redeemableCredits < 1 ? (
              <Typography
                type={Font?.Poppins_Regular}
                size={11}
                color="#8C8D8B"
                style={styles.redeemHint}>
                You need at least {formatRewardValue(pointsPerCredit)} points to redeem a credit.
              </Typography>
            ) : (
              <Typography
                type={Font?.Poppins_Regular}
                size={11}
                color="#8C8D8B"
                style={styles.redeemHint}>
                You can redeem {formatRewardValue(redeemableCredits)} credit{redeemableCredits === 1 ? '' : 's'} now.
              </Typography>
            )}
          </>
        ) : (
          <>
            <Typography type={Font?.Poppins_Medium} size={16}>
              Your Earnings
            </Typography>
            <View style={styles.earningsRow}>
              <View style={styles.ownerEarnings}>
                <Typography type={Font?.Poppins_Regular} size={12} color="#8C8D8B">
                  Available Credit
                </Typography>
                <Typography type={Font?.Poppins_SemiBold} size={24} color="#16A34A">
                  {'\u20B9'}{referralData?.total_earnings || '0.00'}
                </Typography>
              </View>
              <Button
                title={creditLoading ? 'Applying...' : 'Redeem Credit'}
                onPress={handleCreditApply}
                linerColor={['#379AE6', '#3737E6']}
                main_style={styles.ownerRedeemButton}
                disabled={creditLoading || parseFloat(referralData?.total_earnings || '0') <= 0}
                loader={creditLoading}
              />
            </View>
          </>
        )}
      </View>

      {/* Referral History */}
      <Typography
        type={Font?.Poppins_Medium}
        size={16}
        style={{ marginTop: 25, marginBottom: 10 }}
      >
        Referral History
      </Typography>
      <FlatList
        data={history}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        renderItem={renderHistoryItem}
        scrollEnabled={false}
        ListEmptyComponent={() => (
          <EmptyView
            title="No referrals yet"
            description="Share your code and start earning!"
            icon={ImageConstant?.Users}
            iconColor="#D98579"
          />
        )}
      />
      <View style={{ height: 40 }} />
    </CommanView>
  );
};

export default ReferAndEarn;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  codeCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 15,
    gap: 10,
  },
  copyBadge: {
    borderWidth: 1,
    borderColor: '#D98579',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEA',
  },
  statBox: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#EBEBEA',
  },
  earningsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  rewardBalances: {
    flexDirection: 'row',
    marginTop: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0E5E3',
  },
  rewardBalanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  rewardBalanceDivider: {
    width: 1,
    backgroundColor: '#E9DEDC',
  },
  exchangeCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFF4F1',
  },
  redeemButton: {
    width: '100%',
    marginTop: 14,
  },
  redeemHint: {
    marginTop: 8,
    textAlign: 'center',
  },
  ownerEarnings: {
    flex: 1,
  },
  ownerRedeemButton: {
    width: 150,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EBEBEA',
  },
  historyReward: {
    alignItems: 'flex-end',
  },
});
