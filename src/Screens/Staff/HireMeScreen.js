import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import Input from '../../Component/Input';
import { Font } from '../../Constants/Font';
import { ImageConstant } from '../../Constants/ImageConstant';
import { GET_WITH_TOKEN, POST_FORM_DATA, POST_WITH_TOKEN } from '../../Backend/Backend';
import {
  HireMeOptIn,
  HireMeUpdate,
  HireMePause,
  HireMeDeactivate,
  StaffAvailabilityStatus,
  PROFILE_UPDATE,
} from '../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import { useSelector } from 'react-redux';
import DropdownComponent from '../../Component/DropdownComponent';

const HireMeScreen = ({ navigation }) => {
  const userDetail = useSelector(state => state?.userDetails);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // 'active' | 'paused' | null
  
  // New: Preferred Work City
  const [workCity, setWorkCity] = useState('');

  const role = (() => {
    const r = userDetail?.user_work_info?.primary_role;
    if (Array.isArray(r)) return r.join(', ');
    return r || 'Not set';
  })();
  
  // Default to their current city if not set
  const defaultCity = userDetail?.user_work_info?.preferred_work_location || userDetail?.addresses?.[0]?.city || userDetail?.city || '';
  const currentCity = userDetail?.addresses?.[0]?.city || userDetail?.city || '';
  const currentState = userDetail?.addresses?.[0]?.state || userDetail?.state || '';
  const experience = userDetail?.user_work_info?.total_experience || 'Not set';

  const preferredWorkLocationOptions = React.useMemo(() => {
    const options = [
      { label: 'All India', value: 'All India' },
      { label: 'South India', value: 'South India' },
      { label: 'North India', value: 'North India' },
      { label: 'East India', value: 'East India' },
      { label: 'West India', value: 'West India' },
      { label: 'Central India', value: 'Central India' },
      { label: 'Metro Cities', value: 'Metro Cities' },
    ];

    if (currentCity) {
      options.splice(1, 0, {
        label: `Only ${currentCity}`,
        value: currentCity,
      });
    }

    if (currentState) {
      options.splice(currentCity ? 2 : 1, 0, {
        label: `Within ${currentState}`,
        value: `Within ${currentState}`,
      });
    }

    return options;
  }, [currentCity, currentState]);

  const selectedPreferredWorkLocation =
    preferredWorkLocationOptions.find(option => option.value === workCity) || null;
  const isPresetPreferredWorkLocation = preferredWorkLocationOptions.some(
    option => option.value === workCity,
  );

  useEffect(() => {
    fetchStatus();
    if (defaultCity) setWorkCity(defaultCity);
  }, [defaultCity]);

  const fetchStatus = () => {
    setLoading(true);
    GET_WITH_TOKEN(
      StaffAvailabilityStatus,
      res => {
        setLoading(false);
        const data = res?.data || res;
        const active = data?.is_available === true || data?.status === 'active' || data?.is_job_seeking === true;
        setIsActive(active);
        setStatus(data?.status || (active ? 'active' : null));
        
        // If backend has a preferred location, use it
        if (data?.preferred_work_location) {
          setWorkCity(data.preferred_work_location);
        }
      },
      () => setLoading(false),
      () => setLoading(false),
    );
  };

  const handleOptIn = () => {
    if (!workCity.trim()) {
      SimpleToast.show('Please enter the city where you want to work', SimpleToast.SHORT);
      return;
    }

    setSaving(true);
    POST_WITH_TOKEN(
      HireMeOptIn,
      {
        is_available: true,
        is_job_seeking: true,
        role: role,
        city: workCity, // Send the chosen work city
        experience: experience,
      },
      res => {
        // Also update profile permanently
        const formData = new FormData();
        formData.append('preferred_work_location', workCity);
        POST_FORM_DATA(PROFILE_UPDATE, formData, () => {}, () => {});

        setSaving(false);
        setIsActive(true);
        setStatus('active');
        SimpleToast.show('Your profile is now visible to employers in ' + workCity + '!', SimpleToast.LONG);
      },
      err => {
        setSaving(false);
        // Fallback to update if opt-in fails (already opted in)
        POST_WITH_TOKEN(
          HireMeUpdate,
          { 
            is_available: true, 
            is_job_seeking: true,
            city: workCity 
          },
          res2 => {
            setIsActive(true);
            setStatus('active');
            SimpleToast.show('Profile updated — visible in ' + workCity, SimpleToast.SHORT);
          },
          () => SimpleToast.show('Failed to update. Try again.', SimpleToast.SHORT),
          () => SimpleToast.show('Network error. Try again.', SimpleToast.SHORT),
        );
      },
      () => {
        setSaving(false);
        SimpleToast.show('Network error. Try again.', SimpleToast.SHORT);
      },
    );
  };

  const handlePause = () => {
    setSaving(true);
    POST_WITH_TOKEN(
      HireMePause,
      {},
      res => {
        setSaving(false);
        setIsActive(false);
        setStatus('paused');
        SimpleToast.show('Profile paused — hidden from employers.', SimpleToast.SHORT);
      },
      () => { setSaving(false); SimpleToast.show('Failed. Try again.', SimpleToast.SHORT); },
      () => { setSaving(false); SimpleToast.show('Network error.', SimpleToast.SHORT); },
    );
  };

  const handleDeactivate = () => {
    setSaving(true);
    POST_WITH_TOKEN(
      HireMeDeactivate,
      {},
      res => {
        setSaving(false);
        setIsActive(false);
        setStatus(null);
        SimpleToast.show('You have been removed from job search.', SimpleToast.SHORT);
      },
      () => { setSaving(false); SimpleToast.show('Failed. Try again.', SimpleToast.SHORT); },
      () => { setSaving(false); SimpleToast.show('Network error.', SimpleToast.SHORT); },
    );
  };

  const handleToggle = (value) => {
    if (value) {
      handleOptIn();
    } else {
      handlePause();
    }
  };

  return (
    <CommanView>
      <HeaderForUser
        title="Post Yourself for Hire"
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        style_title={{ fontSize: 18 }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Status Banner */}
        <View style={[
          styles.banner,
          { backgroundColor: isActive ? '#EEF9F0' : '#FFF5EE' }
        ]}>
          <View style={styles.bannerLeft}>
            <View style={[styles.dot, { backgroundColor: isActive ? '#16A34A' : '#D98579' }]} />
            <View>
              <Typography type={Font?.Poppins_SemiBold} size={15} color={isActive ? '#16A34A' : '#D98579'}>
                {isActive ? 'Visible to Employers' : status === 'paused' ? 'Profile Paused' : 'Not Listed'}
              </Typography>
              <Typography type={Font?.Poppins_Regular} size={12} color="#888">
                {isActive
                  ? 'Owners can find and contact you'
                  : 'Turn on to appear in job search'}
              </Typography>
            </View>
          </View>
          <Switch
            value={isActive}
            onValueChange={handleToggle}
            disabled={saving || loading}
            trackColor={{ false: '#E0E0E0', true: '#D98579' }}
            thumbColor="#fff"
          />
        </View>

        {/* Work Preferences */}
        <View style={styles.card}>
          <Typography type={Font?.Poppins_SemiBold} size={15} style={{ marginBottom: 12 }}>
            Work Preferences
          </Typography>
          <Typography type={Font?.Poppins_Regular} size={12} color="#888" style={{ marginBottom: 12 }}>
            In which city are you looking for work?
          </Typography>
          
          <DropdownComponent
            title="Preferred Work Area"
            placeholder="Select preferred work area"
            width={'100%'}
            style_dropdown={{ marginHorizontal: 0 }}
            selectedTextStyleNew={{ marginLeft: 10 }}
            marginHorizontal={0}
            style_title={{ textAlign: 'left' }}
            value={selectedPreferredWorkLocation}
            onChange={item => setWorkCity(item?.value || '')}
            data={preferredWorkLocationOptions}
          />
          <Input
            title="Or Enter City Name"
            placeholder="Enter preferred city name"
            value={isPresetPreferredWorkLocation ? '' : workCity}
            onChange={text => setWorkCity(text)}
          />
        </View>

        {/* Profile Preview */}
        <View style={styles.card}>
          <Typography type={Font?.Poppins_SemiBold} size={15} style={{ marginBottom: 12 }}>
            Your Profile Preview
          </Typography>
          <Typography type={Font?.Poppins_Regular} size={12} color="#888" style={{ marginBottom: 12 }}>
            This is what employers will see when they search for staff.
          </Typography>

          <View style={styles.infoRow}>
            <Image source={ImageConstant?.Briefcase} style={styles.icon} />
            <Typography size={13} color="#333">Role: <Typography type={Font?.Poppins_SemiBold} size={13}>{role}</Typography></Typography>
          </View>
          <View style={styles.infoRow}>
            <Image source={ImageConstant?.Location} style={styles.icon} />
            <Typography size={13} color="#333">Location: <Typography type={Font?.Poppins_SemiBold} size={13}>{workCity || 'Not set'}</Typography></Typography>
          </View>
          <View style={styles.infoRow}>
            <Image source={ImageConstant?.Calendar} style={styles.icon} />
            <Typography size={13} color="#333">Experience: <Typography type={Font?.Poppins_SemiBold} size={13}>{experience} yrs</Typography></Typography>
          </View>

          <TouchableOpacity
            style={styles.editLink}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Typography size={13} color="#D98579">Update your profile →</Typography>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={styles.card}>
          <Typography type={Font?.Poppins_SemiBold} size={15} style={{ marginBottom: 12 }}>
            How it works
          </Typography>
          {[
            { icon: '1', text: 'Turn on the toggle above to post your profile' },
            { icon: '2', text: 'Employers searching in your city & role will see you' },
            { icon: '3', text: 'They can contact you directly through the app' },
            { icon: '4', text: 'Pause anytime to stop appearing in search' },
          ].map((item, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Typography type={Font?.Poppins_SemiBold} size={12} color="#fff">{item.icon}</Typography>
              </View>
              <Typography size={13} color="#555" style={{ flex: 1 }}>{item.text}</Typography>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        {!isActive ? (
          <Button
            title={saving ? 'Posting...' : '🚀 Post Myself for Hire'}
            onPress={handleOptIn}
            disabled={saving || loading}
            loader={saving}
            main_style={{ marginTop: 10 }}
          />
        ) : (
          <View style={{ gap: 10, marginTop: 10 }}>
            <Button
              title={saving ? 'Saving...' : '⏸ Pause Profile'}
              onPress={handlePause}
              disabled={saving}
              loader={saving}
              linerColor={['#FF9800', '#F57C00']}
              main_style={{ width: '100%', marginTop: 0 }}
            />
            <TouchableOpacity style={styles.deactivateBtn} onPress={handleDeactivate} disabled={saving}>
              <Typography type={Font?.Poppins_Medium} size={14} color="#F44336">
                Remove from job search entirely
              </Typography>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </CommanView>
  );
};

export default HireMeScreen;

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 8,
    resizeMode: 'contain',
    tintColor: '#D98579',
  },
  editLink: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D98579',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  deactivateBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 10,
  },
});
