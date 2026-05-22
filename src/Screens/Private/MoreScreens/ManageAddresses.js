import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import HeaderForUser from '../../../Component/HeaderForUser';
import Button from '../../../Component/Button';
import { ImageConstant } from '../../../Constants/ImageConstant';
import { GET_WITH_TOKEN, POST_FORM_DATA } from '../../../Backend/Backend';
import { PROFILE, PROFILE_UPDATE } from '../../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import LocalizedStrings from '../../../Constants/localization';
import { useDispatch, useSelector } from 'react-redux';
import { userDetails } from '../../../Redux/action';

const ManageAddresses = ({ navigation }) => {
  const dispatch = useDispatch();
  const userDetail = useSelector(state => state?.userDetails);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Multiple address support
  const [addresses, setAddresses] = useState([
    { title: '', street: '', city: '', state: '', pincode: '' },
  ]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    setLoading(true);
    GET_WITH_TOKEN(
      PROFILE,
      success => {
        setLoading(false);
        const user = success?.data;
        if (user) {
          // Extract addresses
          if (Array.isArray(user.addresses) && user.addresses.length > 0) {
            const mappedAddresses = user.addresses.map(addr => ({
              id: addr.id,
              title: addr.title || addr.name || '',
              street: addr.street || '',
              city: addr.city || '',
              state: addr.state || '',
              pincode: addr.pincode || '',
              is_default: addr.is_default || false,
            }));
            setAddresses(mappedAddresses);
          }
        }
      },
      error => {
        setLoading(false);
        SimpleToast.show('Failed to load addresses', SimpleToast.SHORT);
      },
    );
  };

  const addAddress = () => {
    setAddresses([...addresses, { title: '', street: '', city: '', state: '', pincode: '' }]);
  };

  const removeAddress = (index) => {
    if (addresses.length === 1) {
      SimpleToast.show('You must have at least one address', SimpleToast.SHORT);
      return;
    }
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const updateAddress = (index, field, value) => {
    const updated = [...addresses];
    updated[index] = { ...updated[index], [field]: value };
    setAddresses(updated);
  };

  const handleSave = () => {
    // Validation
    for (const addr of addresses) {
      if (!addr.street || !addr.city || !addr.pincode) {
        SimpleToast.show('Please fill all required address fields', SimpleToast.SHORT);
        return;
      }
    }

    setSaving(true);
    const formData = new FormData();
    // Use _method for Laravel to handle PUT if needed, but the original logic uses POST for update
    // We send back all profile data as the API might expect a full update or we only send addresses
    
    // According to original code, it sends addresses as arrays
    addresses.forEach((addr, index) => {
      if (addr.title) {
        formData.append(`addresses[${index}][title]`, addr.title);
      }
      formData.append(`addresses[${index}][street]`, addr.street);
      formData.append(`addresses[${index}][city]`, addr.city);
      formData.append(`addresses[${index}][state]`, addr.state || '');
      formData.append(`addresses[${index}][pincode]`, addr.pincode);
    });

    // Also include basic info as required by backend validator
    formData.append('first_name', userDetail?.first_name || '');
    formData.append('last_name', userDetail?.last_name || '');
    formData.append('gender', userDetail?.gender || 'male');

    POST_FORM_DATA(
      PROFILE_UPDATE,
      formData,
      success => {
        setSaving(false);
        SimpleToast.show('Addresses updated successfully!', SimpleToast.SHORT);
        // Refresh local user details in Redux
        if (success?.data) {
           dispatch(userDetails(success.data));
        }
        navigation.goBack();
      },
      error => {
        setSaving(false);
        console.log('Update Error:', error);
        SimpleToast.show(error?.message || 'Update failed', SimpleToast.SHORT);
      },
      fail => {
        setSaving(false);
        SimpleToast.show('Network error', SimpleToast.SHORT);
      }
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title="My Addresses"
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        style_title={{ fontSize: 18 }}
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#D98579" style={{ marginTop: 50 }} />
        ) : (
          <View>
            <Typography type={Font.Poppins_Medium} size={14} color="#666" style={{ marginBottom: 20 }}>
              Manage your saved household addresses here. These are used for finding staff in your area.
            </Typography>

            {addresses.map((address, index) => (
              <View key={index} style={styles.addressCard}>
                <View style={styles.cardHeader}>
                  <Typography type={Font.Poppins_SemiBold} size={15}>
                    Address #{index + 1}
                  </Typography>
                  {addresses.length > 1 && (
                    <TouchableOpacity onPress={() => removeAddress(index)}>
                      <Typography color="#F44336" size={13}>Remove</Typography>
                    </TouchableOpacity>
                  )}
                </View>

                <Input
                  title="Address Name / Heading"
                  placeholder="e.g. Home, Office, Work"
                  value={address.title}
                  onChange={(val) => updateAddress(index, 'title', val)}
                />

                <Input
                  title="Street / Landmark"
                  placeholder="e.g. 123 Main St, Apartment 4B"
                  value={address.street}
                  onChange={(val) => updateAddress(index, 'street', val)}
                />
                
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Input
                      title="City"
                      placeholder="City"
                      value={address.city}
                      onChange={(val) => updateAddress(index, 'city', val)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      title="State"
                      placeholder="State"
                      value={address.state}
                      onChange={(val) => updateAddress(index, 'state', val)}
                    />
                  </View>
                </View>

                <Input
                  title="Pincode"
                  placeholder="6-digit Pincode"
                  value={address.pincode}
                  keyboardType="numeric"
                  maxLength={6}
                  onChange={(val) => updateAddress(index, 'pincode', val)}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addAddress}>
              <Image source={ImageConstant?.plus} style={styles.plusIcon} tintColor="#D98579" />
              <Typography color="#D98579" type={Font.Poppins_Medium} size={14}>
                Add Another Address
              </Typography>
            </TouchableOpacity>

            <Button
              title={saving ? "Saving..." : "Save Addresses"}
              disabled={saving}
              onPress={handleSave}
              style={{ marginTop: 20, marginBottom: 40 }}
            />
          </View>
        )}
      </ScrollView>
    </CommanView>
  );
};

export default ManageAddresses;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#D98579',
    borderRadius: 8,
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  plusIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  }
});
