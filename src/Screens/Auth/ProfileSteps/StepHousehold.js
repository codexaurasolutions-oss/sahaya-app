import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Input from '../../../Component/Input';
import DropdownComponent from '../../../Component/DropdownComponent';
import { Font } from '../../../Constants/Font';
import Typography from '../../../Component/UI/Typography';
import { validators } from '../../../Backend/Validator';
import { isValidForm } from '../../../Backend/Utility';
import LocalizedStrings from '../../../Constants/localization';

const languagesList = [
  'English',
  'Hindi',
  'Telugu',
  'Tamil',
  'Kannada',
  'Malayalam',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Punjabi',
  'Odia',
  'Assamese',
  'Urdu',
  'Nepali',
];

const getResidenceTypeOptions = () => [
  {
    label: LocalizedStrings.CompleteProfile?.apartment || LocalizedStrings.EditProfile?.Apartment || 'Apartment',
    value: 'apartment',
  },
  {
    label: LocalizedStrings.CompleteProfile?.villa || LocalizedStrings.EditProfile?.Villa || 'Villa',
    value: 'villa',
  },
  {
    label: LocalizedStrings.CompleteProfile?.independent_house || LocalizedStrings.EditProfile?.Independent_House || 'Independent House',
    value: 'independent',
  },
];

const createEmptyHousehold = () => ({
  residenceType: null,
  numberOfRooms: '',
  languagesSpoken: [],
  adultsCount: '',
  childrenCount: '',
  elderlyCount: '',
  specialRequirements: '',
  pets: [{ type: '', count: '' }],
});

const HouseholdSection = ({ index, data, updateField, updatePet, addPet, removePet, errors, sectionLabel }) => {
  const update = (field, value) => updateField(index, field, value);
  const updatePetField = (petIndex, field, value) => updatePet(index, petIndex, field, value);
  const addPetToList = () => addPet(index);
  const removePetFromList = (petIndex) => removePet(index, petIndex);

  return (
    <View style={styles.wrap}>
      <Typography type={Font?.Poppins_SemiBold} size={16}>
        {sectionLabel}
      </Typography>

      <DropdownComponent
        title={
          LocalizedStrings.EditProfile?.Residence_Type ||
          LocalizedStrings.CompleteProfile?.residence_type ||
          'Residence Type'
        }
        placeholder={
          LocalizedStrings.CompleteProfile?.select_residence_type ||
          LocalizedStrings.EditProfile?.select_residence_type ||
          'Select Type'
        }
        width={'100%'}
        style_dropdown={styles.dropdownStyle}
        selectedTextStyleNew={styles.selectedTextStyle}
        marginHorizontal={0}
        value={data.residenceType?.value}
        style_title={styles.dropdownTitle}
        data={getResidenceTypeOptions()}
        onChange={item => {
          update('residenceType', item || null);
        }}
        error={errors?.residenceType}
      />

      <Input
        title={
          LocalizedStrings.EditProfile?.Number_of_Rooms ||
          LocalizedStrings.CompleteProfile?.number_of_rooms ||
          'Number of Rooms'
        }
        placeholder=""
        keyboardType="numeric"
        value={data.numberOfRooms}
        onChange={text => update('numberOfRooms', text)}
        error={errors?.numberOfRooms}
      />

      <Typography
        type={Font?.Poppins_Medium}
        size={14}
        style={{ marginBottom: 6, marginTop: 12 }}
      >
        {LocalizedStrings.EditProfile?.Languages_Spoken ||
          LocalizedStrings.CompleteProfile?.languages_spoken ||
          'Languages Spoken'}
      </Typography>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
        {languagesList.map((language, idx) => {
          const isSelected = data.languagesSpoken.includes(language);
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                if (isSelected) {
                  update('languagesSpoken', data.languagesSpoken.filter(item => item !== language));
                } else {
                  update('languagesSpoken', [...data.languagesSpoken, language]);
                }
              }}
              style={{
                backgroundColor: isSelected ? '#D98579' : '#F3F4F6',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 14, color: isSelected ? '#FFFFFF' : '#333' }}>
                {language}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {errors?.languagesSpoken && (
        <Typography size={12} color="red" style={{ marginTop: 5 }}>
          {errors.languagesSpoken}
        </Typography>
      )}

      <Typography type={Font?.Poppins_Medium} size={14}>
        {LocalizedStrings.EditProfile?.Number_of_Occupants ||
          LocalizedStrings.CompleteProfile?.number_of_occupants ||
          'Number of Occupants'}
      </Typography>
      <View style={styles.row}>
        <View style={styles.adultsContainer}>
          <Input
            title={
              LocalizedStrings.EditProfile?.Adults ||
              LocalizedStrings.CompleteProfile?.adults ||
              'Adults'
            }
            placeholder=""
            keyboardType="numeric"
            value={data.adultsCount}
            onChange={text => update('adultsCount', text)}
            error={errors?.adultsCount}
          />
        </View>
        <View style={styles.childrenContainer}>
          <Input
            title={
              LocalizedStrings.EditProfile?.Children ||
              LocalizedStrings.CompleteProfile?.children ||
              'Children'
            }
            placeholder=""
            keyboardType="numeric"
            value={data.childrenCount}
            onChange={text => update('childrenCount', text)}
            error={errors?.childrenCount}
          />
        </View>
        <View style={styles.elderlyContainer}>
          <Input
            title={
              LocalizedStrings.EditProfile?.Elderly ||
              LocalizedStrings.CompleteProfile?.elderly ||
              'Elderly'
            }
            placeholder=""
            keyboardType="numeric"
            value={data.elderlyCount}
            onChange={text => update('elderlyCount', text)}
            error={errors?.elderlyCount}
          />
        </View>
      </View>

      <Typography type={Font?.Poppins_Medium} size={14}>
        {LocalizedStrings.EditProfile?.Pet_Details ||
          LocalizedStrings.CompleteProfile?.pet_details ||
          'Pet Details'}
      </Typography>
      {data.pets.map((pet, petIndex) => (
        <View key={petIndex} style={[styles.row, { marginBottom: 10 }]}>
          <View style={styles.petTypeContainer}>
            <DropdownComponent
              title={
                LocalizedStrings.EditProfile?.Pet_Type ||
                LocalizedStrings.CompleteProfile?.pet_type ||
                'Type'
              }
              placeholder="Select Type"
              width={'100%'}
              style_dropdown={styles.dropdownStyle}
              selectedTextStyleNew={styles.selectedTextStyle}
              marginHorizontal={0}
              style_title={styles.dropdownTitle}
              value={pet.type}
              onChange={item => updatePetField(petIndex, 'type', item?.value || '')}
              data={[
                { label: 'Dog', value: 'Dog' },
                { label: 'Cat', value: 'Cat' },
                { label: 'Bird', value: 'Bird' },
                { label: 'Other', value: 'Other' },
              ]}
              error={errors?.[`petType${petIndex}`]}
            />
          </View>
          <View style={styles.petCountContainer}>
            <Input
              title={
                LocalizedStrings.EditProfile?.Count ||
                LocalizedStrings.CompleteProfile?.count ||
                'Count'
              }
              placeholder=""
              keyboardType="numeric"
              value={pet.count}
              onChange={value => updatePetField(petIndex, 'count', value)}
              error={errors?.[`petCount${petIndex}`]}
            />
          </View>
          {data.pets.length > 1 && (
            <TouchableOpacity
              style={styles.removePetButton}
              onPress={() => removePetFromList(petIndex)}
            >
              <Typography color="red" size={12}>
                {LocalizedStrings.EditProfile?.Remove ||
                  LocalizedStrings.CompleteProfile?.remove ||
                  'Remove'}
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity onPress={addPetToList}>
        <Typography
          type={Font?.Poppins_Medium}
          size={14}
          textAlign={'center'}
          color="#D98579"
        >
          +{' '}
          {LocalizedStrings.EditProfile?.Add_Another_Pet ||
            LocalizedStrings.CompleteProfile?.add_another_pet ||
            'Add Another Pet'}
        </Typography>
      </TouchableOpacity>
      <Input
        title={`Additional Information (${LocalizedStrings.CompleteProfile?.optional || 'Optional'})`}
        placeholder={
          LocalizedStrings.EditProfile?.special_requirements_placeholder ||
          LocalizedStrings.CompleteProfile?.special_requirements_placeholder ||
          'Looking for staff comfortable with pets...'
        }
        multiline
        value={data.specialRequirements}
        onChange={value => update('specialRequirements', value)}
        error={errors?.specialRequirements}
      />
    </View>
  );
};

const StepHousehold = React.forwardRef((props, ref) => {
  const addressCount = props.addressCount || 1;
  const [households, setHouseholds] = useState([createEmptyHousehold()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setHouseholds(prev => {
      const next = [];
      for (let i = 0; i < addressCount; i++) {
        next.push(prev[i] || createEmptyHousehold());
      }
      return next;
    });
  }, [addressCount]);

  const updateField = (sectionIndex, field, value) => {
    setHouseholds(prev => {
      const updated = [...prev];
      updated[sectionIndex] = { ...updated[sectionIndex], [field]: value };
      return updated;
    });
    const errKey = `${sectionIndex}_${field}`;
    if (errors[errKey]) {
      setErrors(prev => ({ ...prev, [errKey]: null }));
    }
  };

  const addPet = (sectionIndex) => {
    setHouseholds(prev => {
      const updated = [...prev];
      updated[sectionIndex] = {
        ...updated[sectionIndex],
        pets: [...updated[sectionIndex].pets, { type: '', count: '' }],
      };
      return updated;
    });
  };

  const removePet = (sectionIndex, petIndex) => {
    setHouseholds(prev => {
      const updated = [...prev];
      const pets = updated[sectionIndex].pets;
      if (pets.length > 1) {
        updated[sectionIndex] = {
          ...updated[sectionIndex],
          pets: pets.filter((_, i) => i !== petIndex),
        };
      }
      return updated;
    });
  };

  const updatePet = (sectionIndex, petIndex, field, value) => {
    setHouseholds(prev => {
      const updated = [...prev];
      const newPets = [...updated[sectionIndex].pets];
      newPets[petIndex] = { ...newPets[petIndex], [field]: value };
      updated[sectionIndex] = { ...updated[sectionIndex], pets: newPets };
      return updated;
    });
  };

  const validateHousehold = () => {
    let allErrors = {};

    households.forEach((h, idx) => {
      const prefix = addressCount > 1 ? `Address ${idx + 1}: ` : '';

      allErrors[`${idx}_residenceType`] = validators.checkRequire(
        prefix + (LocalizedStrings.EditProfile?.Residence_Type || 'Residence Type'),
        h.residenceType?.value,
      );
      allErrors[`${idx}_numberOfRooms`] = validators.checkRequire(
        prefix + (LocalizedStrings.EditProfile?.Number_of_Rooms || 'Number of Rooms'),
        h.numberOfRooms,
      );
      allErrors[`${idx}_languagesSpoken`] = validators.checkRequire(
        prefix + (LocalizedStrings.EditProfile?.Languages_Spoken || 'Languages Spoken'),
        h.languagesSpoken?.length ? h.languagesSpoken.join(',') : '',
      );
      allErrors[`${idx}_adultsCount`] = validators.checkRequire(
        prefix + (LocalizedStrings.EditProfile?.Adults || 'Adults Count'),
        h.adultsCount,
      );
      allErrors[`${idx}_childrenCount`] = validators.checkRequire(
        prefix + (LocalizedStrings.EditProfile?.Children || 'Children Count'),
        h.childrenCount,
      );
      allErrors[`${idx}_elderlyCount`] = null;
      allErrors[`${idx}_specialRequirements`] = null;

      h.pets.forEach((pet, petIdx) => {
        if (pet.type || pet.count) {
          allErrors[`${idx}_petType${petIdx}`] = validators.checkRequire(
            prefix + (LocalizedStrings.EditProfile?.Pet_Type || 'Pet Type'),
            pet.type,
          );
          allErrors[`${idx}_petCount${petIdx}`] = validators.checkRequire(
            prefix + (LocalizedStrings.EditProfile?.Count || 'Pet Count'),
            pet.count,
          );
        }
      });
    });

    setErrors(allErrors);
    return isValidForm(allErrors);
  };

  const getHouseholdData = () => {
    return households.map(h => {
      const petDetails = h.pets
        .filter(pet => pet.type && pet.count)
        .map(pet => ({
          pet_type: pet.type,
          pet_count: pet.count,
        }));

      return {
        residence_type: h.residenceType?.value,
        number_of_rooms: h.numberOfRooms,
        languages_spoken: h.languagesSpoken,
        adults_count: h.adultsCount,
        children_count: h.childrenCount,
        elderly_count: h.elderlyCount,
        special_requirements: h.specialRequirements,
        pet_details: petDetails,
      };
    });
  };

  React.useImperativeHandle(ref, () => ({
    validateHousehold,
    getHouseholdData,
  }));

  return (
    <View style={{ flex: 1 }}>
      {households.map((h, idx) => (
        <View key={idx} style={{ marginBottom: idx < households.length - 1 ? 10 : 0 }}>
          <HouseholdSection
            index={idx}
            data={h}
            updateField={updateField}
            updatePet={updatePet}
            addPet={addPet}
            removePet={removePet}
            errors={(() => {
              const prefix = `${idx}_`;
              const sectionErrors = {};
              Object.keys(errors).forEach(key => {
                if (key.startsWith(prefix)) {
                  sectionErrors[key.slice(prefix.length)] = errors[key];
                }
              });
              return sectionErrors;
            })()}
            sectionLabel={
              addressCount > 1
                ? `Household Info - Address ${idx + 1}`
                : (LocalizedStrings.EditProfile?.Household_Information ||
                   LocalizedStrings.CompleteProfile?.household_information ||
                   'Household Information')
            }
          />
        </View>
      ))}
    </View>
  );
});

StepHousehold.displayName = 'StepHousehold';

export default StepHousehold;

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: Font?.Manrope_Bold,
    fontSize: 16,
    marginBottom: 10,
  },
  label: {
    fontFamily: Font?.Manrope_SemiBold,
    fontSize: 14,
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrap: {
    borderWidth: 1,
    borderColor: '#EBEBEA',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  dropdownStyle: {
    marginHorizontal: 0,
  },
  selectedTextStyle: {
    marginLeft: 10,
  },
  dropdownTitle: {
    textAlign: 'left',
  },
  adultsContainer: {
    flex: 1,
    marginRight: 8,
  },
  childrenContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  elderlyContainer: {
    flex: 1,
    marginLeft: 8,
  },
  petTypeContainer: {
    flex: 1,
    marginRight: 8,
  },
  petCountContainer: {
    width: 80,
  },
  removePetButton: {
    padding: 5,
    marginLeft: 5,
  },
});
