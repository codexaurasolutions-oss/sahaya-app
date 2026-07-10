import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Button from '../../../Component/Button';
import { GET_WITH_TOKEN, POST_WITH_TOKEN } from '../../../Backend/Backend';
import { DELETE_Member, DeleteUser, ListUser } from '../../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import { useIsFocused } from '@react-navigation/native';
import LocalizedStrings from '../../../Constants/localization';
import EmptyView from '../../../Component/UI/EmptyView';

const FamilyMembers = ({ navigation, route }) => {
  const [userList, setUserList] = useState([]);
  const IsFocused = useIsFocused();
  const backScreen = route?.params?.backScreen || 'StaffMore';

  const handleBack = () => {
    const targetScreen =
      backScreen === 'More' || backScreen === 'StaffMore'
        ? backScreen
        : 'StaffMore';

    navigation.navigate('TabNavigationForStaff', { screen: targetScreen });
  };

  useEffect(() => {
    GetUser();
  }, [IsFocused, navigation]);
  const GetUser = () => {
    GET_WITH_TOKEN(
      ListUser,
      success => {
        console.log(success?.data,'success?.data');
        
        if (success?.data) {
          setUserList(success?.data);
        }
      },
      error => {
        SimpleToast.show('Failed to load family members', SimpleToast.SHORT);
      },
      fail => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const handleDeleteAccount = id => {
    // alert (id)
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your Member?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const body = {
              user_id: id,
            };
            POST_WITH_TOKEN(
              `${DELETE_Member}/${id}`,
              body,
              success => {
                SimpleToast.show(
                  success?.message || 'Member deleted successfully',
                  SimpleToast.SHORT,
                );
                GetUser();
              },
              error => {
                SimpleToast.show(
                  error?.message || 'Failed to delete Member',
                  SimpleToast.SHORT,
                );
              },
              fail => {
                SimpleToast.show(
                  'Network error. Please try again.',
                  SimpleToast.SHORT,
                );
              },
            );
          },
        },
      ],
    );
  };

  const renderItem = ({ item }) => {
    const initials = (item.name || '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('NewMember', { data: item })}
      >
        <View style={styles.avatar}>
          <Typography type={Font.Poppins_Medium} style={styles.avatarText}>
            {initials}
          </Typography>
        </View>

        <View style={{ flex: 1 }}>
          <Typography type={Font.Poppins_Medium} style={styles.name}>
            {item.name}
          </Typography>
          <Typography type={Font.Poppins_Regular} style={styles.relation}>
            {item.relation}
          </Typography>
        </View>
        <TouchableOpacity
          onPress={() => {
            handleDeleteAccount(item?.id);
          }}
        >
          <Image
            source={ImageConstant?.delete}
            style={{
              width: 15,
              height: 15,
            }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.FamilyMembers.title}
        onPressLeftIcon={() => navigation?.goBack()}
        source_arrow={ImageConstant?.BackArrow}
        style_title={{ fontSize: 18 }}
      />
      {userList.length === 0 ? (
        <EmptyView
          title={
            LocalizedStrings.FamilyMembers?.no_members || 'No Family Members'
          }
          description={
            LocalizedStrings.FamilyMembers?.no_members_desc ||
            "You haven't added any family members yet. Add your first member to get started."
          }
          icon={ImageConstant?.Users}
          iconColor="#D98579"
        />
      ) : (
        <FlatList
          data={userList}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 15, paddingBottom: 100 }}
        />
      )}

      <View style={styles.bottomButton}>
        <Button
          title={'+ ' + LocalizedStrings.FamilyMembers.add_new_member}
          onPress={() =>
            navigation.navigate('NewMember', { returnTo: backScreen })
          }
          main_style={styles.buttonStyle}
        />
      </View>
    </CommanView>
  );
};

export default FamilyMembers;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 5,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    color: '#333',
  },
  name: {
    fontSize: 15,
    color: '#000',
  },
  relation: {
    fontSize: 12,
    color: 'gray',
  },
  menuText: {
    fontSize: 18,
    color: 'gray',
    paddingHorizontal: 5,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  buttonStyle: {
    width: '90%',
  },
});
