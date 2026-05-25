import {
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';

import React, { useEffect, useState } from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Button from '../../../Component/Button';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import { GET_WITH_TOKEN, POST_WITH_TOKEN } from '../../../Backend/Backend';
import {
  DeleteJob,
  Joblist_Admin,
  ListJob,
  UpdateMember,
  SUBSCRIPTION_USER_CURRENT,
} from '../../../Backend/api_routes';
import { useIsFocused } from '@react-navigation/native';
import SimpleToast from 'react-native-simple-toast';
import LocalizedStrings from '../../../Constants/localization';
import EmptyView from '../../../Component/UI/EmptyView';
import { useSelector } from 'react-redux';

const MyJobPosting = ({ navigation }) => {
  const [jobData, setJobData] = useState([]);
  const isFocused = useIsFocused();
  const data = useSelector(state => state?.userDetails);
  const [isPremium, setIsPremium] = useState(false);
  
  useEffect(() => {
    if (isFocused) {
      JobList();
      checkSubscription();
    }
  }, [isFocused]);

  const checkSubscription = () => {
    GET_WITH_TOKEN(
      SUBSCRIPTION_USER_CURRENT,
      res => {
        const sub = res?.subscription;
        const active = res?.is_active;
        const price = sub?.subscription?.price ? parseFloat(sub.subscription.price) : 0;
        if (active && sub && price > 0) {
          setIsPremium(true);
        } else {
          setIsPremium(false);
        }
      },
      () => {
        setIsPremium(false);
      },
      () => {
        setIsPremium(false);
      }
    );
  };

  const showUpgradeAlert = () => {
    Alert.alert(
      'Upgrade to Premium Plan',
      'You are currently on the Standard (Free) plan. Upgrade to Premium to post and manage jobs.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade Now',
          onPress: () => navigation.navigate('HouseholdManager'),
        },
      ],
      { cancelable: true }
    );
  };

  const JobList = () => {
    const route = data?.user_role_id ? Joblist_Admin : ListJob;
    console.log('Fetching jobs from:', route);
    GET_WITH_TOKEN(
      route,
      success => {
        console.log('Jobs response:', JSON.stringify(success));
        // Handle paginated response: success.data.data or success.data (array)
        const rawData = success?.data;
        const jobs = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        setJobData(Array.isArray(jobs) ? jobs : []);
      },
      error => {
        console.log('Jobs error:', JSON.stringify(error));
        // Fallback: if admin endpoint fails, try the general jobs endpoint
        if (route === Joblist_Admin) {
          console.log('Falling back to general jobs endpoint');
          GET_WITH_TOKEN(
            ListJob,
            fallbackSuccess => {
              const rawData = fallbackSuccess?.data;
              const jobs = Array.isArray(rawData) ? rawData : (rawData?.data || []);
              setJobData(Array.isArray(jobs) ? jobs : []);
            },
            fallbackError => {
              console.log('Fallback also failed:', JSON.stringify(fallbackError));
              setJobData([]);
            },
            fallbackFail => {
              setJobData([]);
            },
          );
        } else {
          setJobData([]);
        }
      },
      fail => {
        console.log('Jobs network fail');
        setJobData([]);
      },
    );
  };

  const renderJob = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Typography style={styles.title}>{item.title}</Typography>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Delete Job',
              'Are you sure you want to delete this?',
              [
                {
                  text: 'Cancel',
                  onPress: () => console.log('Cancel Pressed'),
                  style: 'cancel',
                },
                {
                  text: 'OK',
                  onPress: () => {
                    POST_WITH_TOKEN(
                      `${DeleteJob}/${item?.id}`,
                      {},
                      success => {
                        SimpleToast.show(
                          success?.message || 'Job deleted successfully',
                          SimpleToast.SHORT,
                        );
                        JobList();
                      },
                      error => {
                      },
                      fail => {
                      },
                    );
                  },
                },
              ],
              { cancelable: false }, // disables dismissing by tapping outside
            );
          }}
          style={styles.deleteButton}
          activeOpacity={0.7}
        >
          <Image source={ImageConstant?.close} style={styles.deleteIcon} />
        </TouchableOpacity>
      </View>
      <View
        style={{
          flexDirection: 'row',
          paddingVertical: 15,
          flex: 1,
        }}
      >
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          onPress={() => {
            data?.user_role_id == 3&&
            Alert.alert(
              'Change Status',
              'Are you sure you want to change status?',
              [
                {
                  text: 'Cancel',
                  onPress: () => console.log('Cancel Pressed'),
                  style: 'cancel',
                },
                {
                  text: 'OK',
                  onPress: () => {
                    SimpleToast.show(
                      'Change Status successfully cooming soon',
                      SimpleToast.SHORT,
                    );
                  },
                },
              ],
              { cancelable: false }, // disables dismissing by tapping outside
            );
          }}
        >
          <Image
            source={ImageConstant?.ic_status}
            style={{ width: 15, height: 15 }}
          />
          <Typography
            style={{ marginLeft: 10 }}
            color="#8C8D8B"
            type={Font?.Poppins_Medium}
          >
            Status: <Typography color="#FF5724">{item.status}</Typography>
          </Typography>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Image
            source={ImageConstant?.Users}
            style={{ width: 15, height: 15 }}
          />
          <Typography
            style={{ marginLeft: 10 }}
            color="#8C8D8B"
            type={Font?.Poppins_Medium}
          >
            Applicants:{' '}
            <Typography color="#242524" type={Font?.Poppins_Bold}>
              {item.applications_count}
            </Typography>
          </Typography>
        </View>

        {/* <Typography>Applicants: {item.applicants}</Typography> */}
      </View>

      <Button
        title={LocalizedStrings.MyJobPostings.view_applicants}
        linerColor={['#F3F4F6', '#F3F4F6']}
        icon={ImageConstant?.ic_usercheck}
        onPress={() => {
          navigation?.navigate('ListingJob', { id: item?.id });
        }}
        title_style={{ color: '#242524' }}
      />
      <Button
        title={LocalizedStrings.MyJobPostings.manage_job}
        onPress={() => {
          if (!isPremium) {
            showUpgradeAlert();
            return;
          }
          navigation?.navigate('PostNewJob', { id: item?.id });
        }}
        linerColor={['#F3F4F6', '#F3F4F6']}
        icon={ImageConstant?.ic_setting}
        title_style={{ color: '#242524' }}
      />
    </View>
  );

  return (
    <CommanView>
      <HeaderForUser
        source_arrow={ImageConstant?.BackArrow}
        source_logo={ImageConstant?.notification}
        title={LocalizedStrings.MyJobPostings.title}
        onPressLeftIcon={() => {
          navigation?.goBack();
        }}
        style_title={{ fontSize: 18 }}
        onPressRightIcon={() => navigation.navigate('Notification')}
      />

      <Button
        title={LocalizedStrings.MyJobPostings.post_new_job}
        onPress={() => {
          if (!isPremium) {
            showUpgradeAlert();
            return;
          }
          navigation?.navigate('PostNewJob');
        }}
        icon={ImageConstant?.ic_plus}
      />

      {jobData.length === 0 ? (
        <EmptyView
          title={LocalizedStrings.MyJobPostings?.no_jobs || 'No Job Postings'}
          description={
            LocalizedStrings.MyJobPostings?.no_jobs_desc ||
            "You haven't posted any jobs yet. Create your first job posting to get started."
          }
          icon={ImageConstant?.joblisting}
          iconColor="#D98579"
        />
      ) : (
        <FlatList
          data={jobData}
          renderItem={renderJob}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </CommanView>
  );
};

export default MyJobPosting;

const styles = StyleSheet.create({
  postBtn: {
    marginVertical: 10,
    alignSelf: 'center',
  },
  list: {
    padding: 5,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2, // shadow for Android
    shadowColor: '#000', // shadow for iOS
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 5,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  deleteIcon: {
    width: 16,
    height: 16,
    tintColor: '#FF5724',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subText: {
    marginTop: 5,
    fontSize: 13,
    color: '#666',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  smallBtn: {
    flex: 1,
    marginHorizontal: 5,
  },
});
