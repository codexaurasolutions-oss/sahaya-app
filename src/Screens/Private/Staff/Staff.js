import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Input from '../../../Component/Input';
import Button from '../../../Component/Button';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import LocalizedStrings from '../../../Constants/localization';
import { useIsFocused } from '@react-navigation/native';
import { GET_WITH_TOKEN, API } from '../../../Backend/Backend';
import { ListStaff } from '../../../Backend/api_routes';
import EmptyView from '../../../Component/UI/EmptyView';
import SimpleToast from 'react-native-simple-toast';

const getProfileImage = (img) => {
  if (!img || img.includes('noimage')) return null;
  if (img.startsWith('http')) return img;
  const baseUrl = API.replace('/api/', '');
  return `${baseUrl}${img}`;
};

const Staff = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(LocalizedStrings.MyStaff.All);
  const [staffList, setStaffList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const IsFocused = useIsFocused();

  const tabs = [
    LocalizedStrings.MyStaff.All,
    LocalizedStrings.MyStaff.Active,
    LocalizedStrings.MyStaff.On_Leave,
    LocalizedStrings.MyStaff.Inactive,
  ];

  useEffect(() => {
    GetUser();
  }, [IsFocused, navigation]);

  const GetUser = () => {
    GET_WITH_TOKEN(
      ListStaff,
      success => {
        if (success?.data) {
          setStaffList(success?.data?.data || []);
        }
      },
      error => {
        SimpleToast.show('Failed to load staff list', SimpleToast.SHORT);
      },
      fail => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'present':
        return '#4CAF50';
      case 'on_leave':
      case 'on leave':
      case 'leave':
        return '#FFC107';
      case 'inactive':
      case 'absent':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusLabel = status => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'present':
        return LocalizedStrings.MyStaff.Active;
      case 'on_leave':
      case 'on leave':
      case 'leave':
        return LocalizedStrings.MyStaff.On_Leave;
      case 'inactive':
      case 'absent':
        return LocalizedStrings.MyStaff.Inactive;
      default:
        return status || '';
    }
  };

  const getFilteredStaff = () => {
    let filtered = staffList;

    // Filter by tab
    if (activeTab !== LocalizedStrings.MyStaff.All) {
      filtered = filtered.filter(item => {
        const status = item.status?.toLowerCase();
        if (activeTab === LocalizedStrings.MyStaff.Active) {
          return status === 'active' || status === 'present';
        }
        if (activeTab === LocalizedStrings.MyStaff.On_Leave) {
          return status === 'on_leave' || status === 'on leave' || status === 'leave';
        }
        if (activeTab === LocalizedStrings.MyStaff.Inactive) {
          return status === 'inactive' || status === 'absent';
        }
        return true;
      });
    }

    // Filter by search text
    if (searchText.trim()) {
      const query = searchText.trim().toLowerCase();
      filtered = filtered.filter(item => {
        const name = (item.name || `${item.first_name || ''} ${item.last_name || ''}`).toLowerCase();
        const rawRole = item.user_work_info?.primary_role;
        const role = (Array.isArray(rawRole) ? rawRole.join(', ') : (rawRole || '')).toLowerCase();
        return name.includes(query) || role.includes(query);
      });
    }

    return filtered;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('HouseHoldStaffProfile', { item: item })
      }
    >
      {getProfileImage(item?.image) ? (
        <Image
          source={{ uri: getProfileImage(item?.image) }}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, { backgroundColor: '#E0E0E0' }]}>
          <Typography
            type={Font?.Poppins_Medium}
            size={16}
            color="#333"
            style={[styles.avatarText, { textTransform: 'capitalize' }]}
          >
            {item?.first_name?.charAt(0) || item?.name?.charAt(0) || '?'}
          </Typography>
        </View>
      )}
      <View style={styles.cardInfo}>
        <View>
          <Typography
            type={Font?.Poppins_Medium}
            size={16}
            color="#171A1F"
            style={styles.name}
          >
            {item.first_name ? `${item.first_name} ${item.last_name || ''}`.trim() : item.name}
          </Typography>
        </View>
        <Typography
          type={Font?.Poppins_Regular}
          size={13}
          color="#6B7280"
          style={styles.role}
        >
          {Array.isArray(item.user_work_info?.primary_role) ? item.user_work_info.primary_role.join(', ') : (item.user_work_info?.primary_role || '')}
        </Typography>
        {(item?.address_title || item?.address?.title || item?.address?.name || item?.user_work_info?.address_title || item?.user_work_info?.location) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#FFF5F4', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
            <Image source={ImageConstant?.Location} style={{ width: 10, height: 10, marginRight: 4 }} tintColor="#D98579" />
            <Typography type={Font?.Poppins_Medium} size={11} color="#D98579">
              {item?.address_title || item?.address?.title || item?.address?.name || item?.user_work_info?.address_title || item?.user_work_info?.location}
            </Typography>
          </View>
        )}
      </View>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        />
        <Typography
          type={Font?.Poppins_Regular}
          size={13}
          color="#444"
          style={styles.statusText}
        >
          {getStatusLabel(item.status)}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <CommanView style={styles.container}>
      <HeaderForUser
        title={LocalizedStrings.MyStaff.title}
        source_logo={ImageConstant?.notification}
        // Profile_icon={userDetails?.image}
        style_title={styles.headerTitle}
        containerStyle={styles.headerContainer}
        onPressRightIcon={() => navigation.navigate('Notification')}
      />

      <Input
        placeholder={LocalizedStrings.MyStaff.Search_Placeholder}
        showImage={true}
        source={ImageConstant.search}
        showTitle={false}
        value={searchText}
        onChange={setSearchText}
        mainStyle={styles.inputMain}
        style_inputContainer={styles.inputContainer}
        style_input={styles.input}
      />

      <View style={styles.tabRow}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton,
            ]}
          >
            <Typography
              type={Font?.Poppins_Medium}
              size={14}
              color={activeTab === tab ? '#fff' : '#171A1F'}
              style={styles.tabText}
            >
              {tab}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={getFilteredStaff()}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.flatListContent}
        ListEmptyComponent={() => (
          <EmptyView
            title={'No staff'}
            description={'No staff are available right now.'}
            icon={ImageConstant?.Users}
            iconColor="#D98579"
          />
        )}
      />

      <View style={styles.bottomButton}>
        <Button
          onPress={() => {
            navigation.navigate('Aadhar');
          }}
          title={'+ ' + LocalizedStrings.MyStaff.Add_New_Staff}
          main_style={styles.buttonStyle}
        />
      </View>
    </CommanView>
  );
};

export default Staff;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
  },
  inputMain: {
    marginTop: 0,
  },
  inputContainer: {
    height: 50,
    justifyContent: 'center',
  },
  input: {
    height: 50,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    marginHorizontal: 10,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#F2F4F7',
  },
  activeTabButton: {
    backgroundColor: '#D98579',
  },
  tabText: {
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    borderRadius: 12,
    width: '100%',
    paddingVertical: 20,
    marginBottom: 12,
    borderColor: '#EBEBEA',
    borderWidth: 2,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {},
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {},
  role: {
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    marginRight: 6,
  },
  statusText: {},
  flatListContent: {
    paddingBottom: 140,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  buttonStyle: {
    width: '90%',
  },
});
