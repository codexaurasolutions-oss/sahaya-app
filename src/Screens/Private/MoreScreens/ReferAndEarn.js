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
    const message = `Hey! I'm using Sahayya to manage household staff. It's super easy to find staff, manage payments, and more.\n\nDownload the Sahayya app and use my referral code: *${code}* to get started!`;
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
          success?.message || 'Credit applied successfully!',
          SimpleToast.SHORT,
        );
        fetchReferralCode();
      },
      error => {
        setCreditLoading(false);
        SimpleToast.show(
          error?.response?.data?.message || 'Failed to apply credit',
          SimpleToast.SHORT,
        );
      },
      () => {
        setCreditLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

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
      <Typography
        type={Font?.Poppins_Medium}
        size={14}
        color={item?.status === 'completed' ? '#16A34A' : '#EFB034'}
      >
        {item?.status || 'Pending'}
      </Typography>
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
              {'\u20B9'}{referralData?.total_earnings || '0.00'}
            </Typography>
            <Typography type={Font?.Poppins_Regular} size={12} color="#8C8D8B">
              Earnings
            </Typography>
          </View>
        </View>
        <Button
          title="Share Referral Code"
          onPress={handleShare}
          main_style={{ width: '100%', marginTop: 15 }}
        />
      </View>

      {/* Earnings Card */}
      <View style={styles.earningsCard}>
        <Typography type={Font?.Poppins_Medium} size={16}>
          Your Earnings
        </Typography>
        <View style={styles.earningsRow}>
          <View style={{ flex: 1 }}>
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
            main_style={{ width: 150 }}
            disabled={creditLoading || parseFloat(referralData?.total_earnings || '0') <= 0}
            loader={creditLoading}
          />
        </View>
        {parseFloat(referralData?.total_earnings || '0') <= 0 && (
          <Typography
            type={Font?.Poppins_Regular}
            size={12}
            color="#8C8D8B"
            style={{ marginTop: 8 }}>
            Refer friends to start earning credits!
          </Typography>
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
});
