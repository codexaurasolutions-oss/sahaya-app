import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Image } from 'react-native';
import React, { useState } from 'react';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Input from '../../../Component/Input';
import HeaderForUser from '../../../Component/HeaderForUser';
import Button from '../../../Component/Button';
import DropdownComponent from '../../../Component/DropdownComponent';
import { ImageConstant } from '../../../Constants/ImageConstant';
import LocalizedStrings from '../../../Constants/localization';

const LastWorkExperience = ({ navigation }) => {
    const [role, setRole] = useState(null);
    const [languages, setLanguages] = useState('');
    const [experience, setExperience] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [voiceNote, setVoiceNote] = useState('');

    const [skills, setSkills] = useState([
        'Dietary Care',
        'Cooking',
        'South Indian Cousin',
        'Italian Cousin',
        'Vegetarian',
    ]);

    const removeSkill = (item) => {
        setSkills(skills.filter((skill) => skill !== item));
    };

    return (
        <CommanView>
            <HeaderForUser title={LocalizedStrings.EditProfile?.title || 'Complete Profile'} onBack={() => navigation.goBack()} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

                <Typography style={styles.sectionTitle} font={Font?.Poppins_Bold} size={20}>
                    {LocalizedStrings.NewStaffForm?.Work_Details || 'Work Info'}
                </Typography>
                <Image
                    source={ImageConstant?.house}
                    style={[styles.closeIcon, { height: 18, width: 18 }]}
                />
            </View>



            <DropdownComponent
                title={LocalizedStrings.NewStaffForm?.Role_Designation || 'Primary Role/Service'}
                placeholder={LocalizedStrings.NewStaffForm?.Role_Placeholder || 'Cook'}
                width={'100%'}
                style_dropdown={{ marginHorizontal: 0 }}
                selectedTextStyleNew={{ marginLeft: 10 }}
                marginHorizontal={0}
                style_title={{ textAlign: 'left' }}
                data={[{ label: 'Cook', value: 'cook' }, { label: 'Driver', value: 'driver' }]}
                value={role}
                onChange={(item) => setRole(item)}
            />


            <Typography style={[styles.sectionTitle, { marginBottom: 8 }]} font={Font.MEDIUM} size={16}>
                {LocalizedStrings.PostNewJob?.required_skills || 'Skills & Specialties'}
            </Typography>
            <View style={styles.skillContainer}>
                {skills.map((item, index) => (
                    <View key={index} style={styles.skillChip}>
                        <Text style={styles.skillText}>{item}</Text>
                        <TouchableOpacity onPress={() => removeSkill(item)}>
                            <Image
                                source={ImageConstant?.X}
                                style={styles.closeIcon}
                            />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>


            <Input
                title={LocalizedStrings.EditProfile?.Languages_Spoken || 'Languages Spoken'}
                placeholder={LocalizedStrings.EditProfile?.Languages_Spoken || 'English, Hindi, Kannada'}
                value={languages}
                onChange={setLanguages}
                style={styles.input}
            />


            <Input
                title={LocalizedStrings.StaffProfile?.Experience || 'Total Experience'}
                placeholder={'Enter years'}
                value={experience}
                onChange={setExperience}
                keyboardType="numeric"
                maxLength={2}
                style={styles.input}
            />


            <Input
                title={LocalizedStrings.PostNewJob?.additional_requirements || 'Additional Info'}
                placeholder={LocalizedStrings.PostNewJob?.additional_requirements_placeholder || "I'm a hardworking professional..."}
                value={additionalInfo}
                onChange={setAdditionalInfo}
                multiline={true}
                style_inputContainer={{ height: 100 }}
            />


            <Input
                title={LocalizedStrings.NewStaffForm?.Voice_Note || 'Voice Note (Optional)'}
                placeholder={LocalizedStrings.NewStaffForm?.Voice_Note_Placeholder || 'Record/Upload Voice Note'}
                value={voiceNote}
                onChange={setVoiceNote}
                keyboardType="phone-pad"
                style={styles.input}
            />


            <Button
                title={LocalizedStrings.EditProfile?.Save_Changes || 'Save & Proceed'}
                onPress={() => {
                    navigation.goBack();
                }}
                containerStyle={styles.updateBtn}
            />

        </CommanView>
    );
};

export default LastWorkExperience;

const styles = StyleSheet.create({
    sectionTitle: {
        marginVertical: 16,
    },
    input: {
        marginTop: 16,
    },
    skillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    skillChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    skillText: {
        fontSize: 14,
        color: '#333',
    },
    closeIcon: {
        width: 14,
        height: 14,
        marginLeft: 6,
        tintColor: '#555',
    },
    updateBtn: {
        marginTop: 30,
    },
});
