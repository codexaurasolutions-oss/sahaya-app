import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import HeaderForUser from '../../../Component/HeaderForUser';
import Button from '../../../Component/Button';
import DropdownComponent from '../../../Component/DropdownComponent';
import { ImageConstant } from '../../../Constants/ImageConstant';
import { GET_WITH_TOKEN, POST_FORM_DATA } from '../../../Backend/Backend';
import { PROFILE, PROFILE_UPDATE } from '../../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import { useDispatch, useSelector } from 'react-redux';
import { userDetails } from '../../../Redux/action';
import GooglePlacesInput from '../../../Component/GooglePlacesInput';

const RESIDENCE_TYPES = [
  { label: 'Apartment', value: 'apartment' },
  { label: 'House', value: 'house' },
  { label: 'Villa', value: 'villa' },
  { label: 'Other', value: 'other' },
];

const LANGUAGES_LIST = [
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Telugu', value: 'te' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Kannada', value: 'kn' },
  { label: 'Malayalam', value: 'ml' },
  { label: 'Marathi', value: 'mr' },
  { label: 'Gujarati', value: 'gu' },
  { label: 'Bengali', value: 'bn' },
  { label: 'Punjabi', value: 'pa' },
  { label: 'Odia', value: 'or' },
  { label: 'Assamese', value: 'as' },
  { label: 'Urdu', value: 'ur' },
  { label: 'Nepali', value: 'ne' },
];

const createEmptyAddress = () => ({
  title: '',
  street: '',
  city: '',
  state: '',
  pincode: '',
  area_locality: '',
  google_location: '',
  lat: '',
  long: '',
  household: {
    residence_type: null,
    number_of_rooms: '',
    languages_spoken: [],
    adults_count: '',
    children_count: '',
    elderly_count: '',
    special_requirements: '',
  },
  pets: [{ pet_type: '', pet_count: '' }],
});

const ManageAddresses = ({ navigation }) => {
  const dispatch = useDispatch();
  const userDetail = useSelector(state => state?.userDetails);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState([createEmptyAddress()]);

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
        if (user && Array.isArray(user.addresses) && user.addresses.length > 0) {
          const mapped = user.addresses.map(addr => {
            const hh = addr.household_information || {};
            const rawPets = addr.pet_details || [];
            const pets = rawPets.length > 0
              ? rawPets.map(p => ({ pet_type: p.pet_type || '', pet_count: p.pet_count ? String(p.pet_count) : '' }))
              : [{ pet_type: '', pet_count: '' }];
            return {
              id: addr.id,
              title: addr.title || addr.name || '',
              street: addr.street || '',
              city: addr.city || '',
              state: addr.state || '',
              pincode: addr.pincode || '',
              area_locality: addr.area_locality || '',
              google_location: addr.google_location || '',
              lat: addr.lat || addr.latitude || '',
              long: addr.long || addr.longitude || '',
              household: {
                residence_type: hh.residence_type
                  ? RESIDENCE_TYPES.find(r => r.value === hh.residence_type) || null
                  : null,
                number_of_rooms: hh.number_of_rooms ? String(hh.number_of_rooms) : '',
                languages_spoken: hh.languages_spoken || [],
                adults_count: hh.adults_count != null ? String(hh.adults_count) : '',
                children_count: hh.children_count != null ? String(hh.children_count) : '',
                elderly_count: hh.elderly_count != null ? String(hh.elderly_count) : '',
                special_requirements: hh.special_requirements || '',
              },
              pets,
            };
          });
          setAddresses(mapped);
        }
      },
      error => {
        setLoading(false);
        SimpleToast.show('Failed to load addresses', SimpleToast.SHORT);
      },
    );
  };

  const addAddress = () => {
    setAddresses(prev => [...prev, createEmptyAddress()]);
  };

  const removeAddress = index => {
    if (addresses.length === 1) {
      SimpleToast.show('You must have at least one address', SimpleToast.SHORT);
      return;
    }
    setAddresses(prev => prev.filter((_, i) => i !== index));
  };

  const updateAddress = (index, field, value) => {
    setAddresses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateHousehold = (index, field, value) => {
    setAddresses(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        household: { ...updated[index].household, [field]: value },
      };
      return updated;
    });
  };

  const toggleLanguage = (addrIndex, language) => {
    setAddresses(prev => {
      const updated = [...prev];
      const current = updated[addrIndex].household.languages_spoken || [];
      const next = current.includes(language)
        ? current.filter(l => l !== language)
        : [...current, language];
      updated[addrIndex] = {
        ...updated[addrIndex],
        household: { ...updated[addrIndex].household, languages_spoken: next },
      };
      return updated;
    });
  };

  const addPet = addrIndex => {
    setAddresses(prev => {
      const updated = [...prev];
      updated[addrIndex] = {
        ...updated[addrIndex],
        pets: [...updated[addrIndex].pets, { pet_type: '', pet_count: '' }],
      };
      return updated;
    });
  };

  const removePet = (addrIndex, petIndex) => {
    setAddresses(prev => {
      const updated = [...prev];
      updated[addrIndex] = {
        ...updated[addrIndex],
        pets: updated[addrIndex].pets.filter((_, i) => i !== petIndex),
      };
      return updated;
    });
  };

  const updatePet = (addrIndex, petIndex, field, value) => {
    setAddresses(prev => {
      const updated = [...prev];
      const pets = [...updated[addrIndex].pets];
      pets[petIndex] = { ...pets[petIndex], [field]: value };
      updated[addrIndex] = { ...updated[addrIndex], pets };
      return updated;
    });
  };

  const handleSave = () => {
    for (const addr of addresses) {
      if (!addr.street || !addr.city || !addr.pincode) {
        SimpleToast.show('Please fill all required address fields', SimpleToast.SHORT);
        return;
      }
      if (!addr.area_locality?.trim()) {
        SimpleToast.show('Area / Locality is required for every address', SimpleToast.SHORT);
        return;
      }
      if (!addr.google_location?.trim() || !addr.lat || !addr.long) {
        SimpleToast.show('Please select Google location for every address', SimpleToast.SHORT);
        return;
      }
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('is_edit', '1');

    addresses.forEach((addr, index) => {
      if (addr.title) formData.append(`addresses[${index}][title]`, addr.title);
      formData.append(`addresses[${index}][street]`, addr.street);
      formData.append(`addresses[${index}][city]`, addr.city);
      formData.append(`addresses[${index}][state]`, addr.state || '');
      formData.append(`addresses[${index}][pincode]`, addr.pincode);
      formData.append(`addresses[${index}][area_locality]`, addr.area_locality || '');
      formData.append(`addresses[${index}][google_location]`, addr.google_location || '');
      formData.append(`addresses[${index}][lat]`, addr.lat || '');
      formData.append(`addresses[${index}][long]`, addr.long || '');

      const hh = addr.household;
      if (hh.residence_type?.value) formData.append(`addresses[${index}][household][residence_type]`, hh.residence_type.value);
      if (hh.number_of_rooms) formData.append(`addresses[${index}][household][number_of_rooms]`, hh.number_of_rooms);
      (hh.languages_spoken || []).forEach((lang, li) => {
        formData.append(`addresses[${index}][household][languages_spoken][${li}]`, lang);
      });
      if (hh.adults_count) formData.append(`addresses[${index}][household][adults_count]`, hh.adults_count);
      if (hh.children_count) formData.append(`addresses[${index}][household][children_count]`, hh.children_count);
      if (hh.elderly_count) formData.append(`addresses[${index}][household][elderly_count]`, hh.elderly_count);
      if (hh.special_requirements) formData.append(`addresses[${index}][household][special_requirements]`, hh.special_requirements);

      const validPets = (addr.pets || []).filter(p => p.pet_type?.trim() && p.pet_count?.trim());
      validPets.forEach((pet, pi) => {
        formData.append(`addresses[${index}][pets][${pi}][pet_type]`, pet.pet_type);
        formData.append(`addresses[${index}][pets][${pi}][pet_count]`, pet.pet_count);
      });
    });

    formData.append('first_name', userDetail?.first_name || '');
    formData.append('last_name', userDetail?.last_name || '');
    formData.append('gender', userDetail?.gender || 'male');

    POST_FORM_DATA(
      PROFILE_UPDATE,
      formData,
      success => {
        setSaving(false);
        SimpleToast.show('Addresses saved successfully!', SimpleToast.SHORT);
        if (success?.data) dispatch(userDetails(success.data));
        navigation.goBack();
      },
      error => {
        setSaving(false);
        SimpleToast.show(error?.message || 'Update failed', SimpleToast.SHORT);
      },
      fail => {
        setSaving(false);
        SimpleToast.show('Network error', SimpleToast.SHORT);
      },
    );
  };

  return (
    <CommanView>
      <HeaderForUser
        title="Manage Addresses"
        source_arrow={ImageConstant?.BackArrow}
        onPressLeftIcon={() => navigation.goBack()}
        style_title={{ fontSize: 18 }}
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {loading ? (
          <ActivityIndicator size="large" color="#D98579" style={{ marginTop: 50 }} />
        ) : (
          <View>
            <Typography type={Font.Poppins_Medium} size={14} color="#666" style={{ marginBottom: 20 }}>
              Manage your household addresses and details. Each address can have its own household info.
            </Typography>

            {addresses.map((address, addrIndex) => (
              <View key={addrIndex} style={styles.addressCard}>
                <View style={styles.cardHeader}>
                  <Typography type={Font.Poppins_SemiBold} size={15}>
                    Address #{addrIndex + 1}
                  </Typography>
                  {addresses.length > 1 && (
                    <TouchableOpacity onPress={() => removeAddress(addrIndex)}>
                      <Typography color="#F44336" size={13}>Remove</Typography>
                    </TouchableOpacity>
                  )}
                </View>

                <Input
                  title="Address Name / Heading"
                  placeholder="e.g. Home, Office, Work"
                  value={address.title}
                  onChange={val => updateAddress(addrIndex, 'title', val)}
                />
                <Input
                  title="Street / Landmark"
                  placeholder="e.g. 123 Main St, Apartment 4B"
                  value={address.street}
                  onChange={val => updateAddress(addrIndex, 'street', val)}
                />
                
                <Input
                  title="Area / Locality"
                  placeholder="e.g. Phase 1, Model Town"
                  value={address.area_locality}
                  onChange={val => updateAddress(addrIndex, 'area_locality', val)}
                />

                <View style={{ zIndex: 100 - addrIndex }}>
                  <GooglePlacesInput
                    title="Search Google Location (Mandatory)"
                    placeholder="Search for your location on Google Maps..."
                    onPlaceSelected={(location) => {
                      updateAddress(addrIndex, 'google_location', location?.google_location || "");
                      updateAddress(addrIndex, 'lat', location?.lat || "");
                      updateAddress(addrIndex, 'long', location?.long || "");
                      
                      if (location?.hasExtractedData) {
                        if (!address.street && location.street) updateAddress(addrIndex, 'street', location.street);
                        if (!address.city && location.city) updateAddress(addrIndex, 'city', location.city);
                        if (!address.state && location.state) updateAddress(addrIndex, 'state', location.state);
                        if (!address.pincode && location.pincode) updateAddress(addrIndex, 'pincode', location.pincode);
                      }
                    }}
                  />
                </View>

                {address.google_location ? (
                  <View style={{ marginBottom: 15 }}>
                    <Typography size={12} color="green">Location Selected âœ“</Typography>
                    <Typography size={11} color="gray">{address.google_location}</Typography>
                  </View>
                ) : null}

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Input title="City" placeholder="City" value={address.city} onChange={val => updateAddress(addrIndex, 'city', val)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input title="State" placeholder="State" value={address.state} onChange={val => updateAddress(addrIndex, 'state', val)} />
                  </View>
                </View>
                <Input
                  title="Pincode"
                  placeholder="6-digit Pincode"
                  value={address.pincode}
                  keyboardType="numeric"
                  maxLength={6}
                  onChange={val => updateAddress(addrIndex, 'pincode', val)}
                />

                <View style={styles.divider} />
                <Typography type={Font.Poppins_SemiBold} size={14} color="#333" style={{ marginBottom: 10 }}>
                  Household Information
                </Typography>

                <DropdownComponent
                  title="Residence Type"
                  width="100%"
                  style_dropdown={{ marginHorizontal: 0 }}
                  selectedTextStyleNew={{ marginLeft: 10 }}
                  marginHorizontal={0}
                  style_title={{ textAlign: 'left' }}
                  value={address.household.residence_type}
                  onChange={val => updateHousehold(addrIndex, 'residence_type', val)}
                  data={RESIDENCE_TYPES}
                />
                <Input
                  title="Number of Rooms"
                  keyboardType="numeric"
                  value={address.household.number_of_rooms}
                  onChange={val => updateHousehold(addrIndex, 'number_of_rooms', val)}
                />

                <Typography style={styles.smallLabel} type={Font.Poppins_Medium}>
                  Languages Spoken
                </Typography>
                <View style={styles.chipRow}>
                  {LANGUAGES_LIST.map(lang => {
                    const selected = (address.household.languages_spoken || []).includes(lang.label);
                    return (
                      <TouchableOpacity
                        key={lang.value}
                        onPress={() => toggleLanguage(addrIndex, lang.label)}
                        style={[styles.chip, { backgroundColor: selected ? '#D98579' : '#F3F4F6' }]}
                      >
                        <Text style={{ fontSize: 12, color: selected ? '#fff' : '#333' }}>{lang.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Typography style={styles.smallLabel} type={Font.Poppins_Medium}>
                  Number of Occupants
                </Typography>
                <View style={styles.row}>
                  <View style={styles.flexInput}>
                    <Input title="Adults" keyboardType="numeric" value={address.household.adults_count} onChange={val => updateHousehold(addrIndex, 'adults_count', val)} />
                  </View>
                  <View style={styles.flexInput}>
                    <Input title="Children" keyboardType="numeric" value={address.household.children_count} onChange={val => updateHousehold(addrIndex, 'children_count', val)} />
                  </View>
                  <View style={styles.flexInput}>
                    <Input title="Elderly" keyboardType="numeric" value={address.household.elderly_count} onChange={val => updateHousehold(addrIndex, 'elderly_count', val)} />
                  </View>
                </View>

                <Typography style={styles.smallLabel} type={Font.Poppins_Medium}>
                  Pet Details
                </Typography>
                {(address.pets || []).map((pet, petIndex) => (
                  <View key={petIndex} style={styles.petRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Input title="Type" value={pet.pet_type} onChange={val => updatePet(addrIndex, petIndex, 'pet_type', val)} />
                    </View>
                    <View style={{ width: 80 }}>
                      <Input title="Count" keyboardType="numeric" value={pet.pet_count} onChange={val => updatePet(addrIndex, petIndex, 'pet_count', val)} />
                    </View>
                    {(address.pets.length > 1 || pet.pet_type || pet.pet_count) && (
                      <TouchableOpacity style={styles.removeBtn} onPress={() => removePet(addrIndex, petIndex)}>
                        <Typography size={12} color="red">Remove</Typography>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity onPress={() => addPet(addrIndex)}>
                  <Typography style={styles.addPetBtn} type={Font.Poppins_Medium}>+ Add Pet</Typography>
                </TouchableOpacity>

                <Input
                  style_inputContainer={{ height: 80 }}
                  style_input={{ height: 80 }}
                  title="Special Requirements / Additional Info"
                  multiline
                  value={address.household.special_requirements}
                  onChange={val => updateHousehold(addrIndex, 'special_requirements', val)}
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
              title={saving ? 'Saving...' : 'Save All'}
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
  container: { padding: 20 },
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
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  flexInput: { flex: 1, marginHorizontal: 4 },
  smallLabel: { fontSize: 13, marginTop: 10, marginBottom: 5, color: '#555' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 6,
  },
  petRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 4 },
  removeBtn: { justifyContent: 'center', marginLeft: 6, paddingVertical: 4 },
  addPetBtn: { color: '#FF6B6B', paddingVertical: 6, textAlign: 'center' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#D98579',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  plusIcon: { width: 16, height: 16, marginRight: 8 },
});
