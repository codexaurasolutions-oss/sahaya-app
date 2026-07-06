import React, { useState } from 'react';
import { View, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import CommanView from '../../../Component/CommanView';
import HeaderForUser from '../../../Component/HeaderForUser';
import { ImageConstant } from '../../../Constants/ImageConstant';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import Button from '../../../Component/Button';
import SimpleModal from '../../../Component/UI/SimpleModal';
import Input from '../../../Component/Input';
import DropdownComponent from '../../../Component/DropdownComponent';
import LocalizedStrings from '../../../Constants/localization';

const StaffProfile = ({ navigation }) => {
    const [terminateModal, setTerminateModal] = useState(false);
    const [complainModal, setComplainModal] = useState(false);
    return (
        <CommanView>
            <HeaderForUser
                title={LocalizedStrings.StaffProfile?.title || 'Staff Profile'}
                source_logo={ImageConstant?.notification}
                Profile_icon={ImageConstant?.user}
                style_title={styles.headerTitle}
                onPressRightIcon={() => navigation.navigate('Leave')}
                source_arrow={ImageConstant?.BackArrow}
                onPressLeftIcon={() => navigation?.goBack()}
            />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.profileCard}>
                    <Image source={ImageConstant.user} style={styles.profileImage} />
                    <Typography style={styles.name} size={22}>Michael Chen</Typography>
                    <Typography style={styles.role}>Senior House Cleaner</Typography>

                    <View style={styles.flexRow}>
                        <Image source={ImageConstant.phone} style={styles.icon} />
                        <Typography style={styles.info}>+91 98765 43210</Typography>
                    </View>
                    <View style={styles.flexRow}>
                        <Image source={ImageConstant.Location} style={styles.icon} />
                        <Typography style={styles.info}>Mumbai, Maharashtra, India</Typography>
                    </View>
                    <View style={styles.flexRow}>
                        <Image source={ImageConstant.mail} style={styles.icon} />
                        <Typography style={styles.info}>aisha.sharma@gmail.com</Typography>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Image source={ImageConstant.phone} style={styles.icon} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Image source={ImageConstant.WhatsApp} style={styles.icon} />
                        </TouchableOpacity>
                    </View>
                    <Button
                        onPress={() => navigation.navigate('AIJobSearch')}
                        style={styles.findStaffBtn}
                        title={LocalizedStrings.Dashboard?.find_staf || 'Find Staff with AI'}
                        main_style={styles.findStaffMain}
                    />
                </View>
                <View style={styles.card}>
                    <Typography style={styles.cardTitle}>{LocalizedStrings.StaffProfile?.Personal_Information || 'Personal Information'}</Typography>
                    <View style={styles.row}>
                        <Image source={ImageConstant.date} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>{LocalizedStrings.StaffProfile?.Date_of_Birth || 'Date of Birth'}</Typography>
                            <Typography style={styles.value}>15/05/1990</Typography>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <Image source={ImageConstant.person} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>{LocalizedStrings.StaffProfile?.Gender || 'Gender'}</Typography>
                            <Typography style={styles.value}>Female</Typography>
                        </View>
                    </View>
                    <View style={styles.rowNoBorder}>
                        <Image source={ImageConstant.phone} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>{LocalizedStrings.StaffProfile?.Emergency_Contact || 'Emergency Contact'}</Typography>
                            <Typography style={styles.value}>+91 99887 76655</Typography>
                        </View>
                    </View>
                </View>


                <View style={styles.card}>
                    <Typography style={styles.cardTitle}>{LocalizedStrings.StaffProfile?.Professional_Overview || 'Professional Overview'}</Typography>
                    <View style={styles.professionalBox}>
                        <Typography type={Font.Poppins_Medium}>⭐ ⭐ ⭐ ⭐ 4.0/5 (15+ Reviews)</Typography>
                        <View style={styles.flexRow}>
                            <Image source={ImageConstant.Briefcase} style={styles.icon} />
                            <Typography type={Font.Poppins_Medium}>{LocalizedStrings.StaffProfile?.Experience || 'Total Experience'}</Typography>
                        </View>
                    </View>
                </View>


                <View style={styles.card}>
                    <Typography style={styles.cardTitle}>{LocalizedStrings.StaffProfile?.Aadhaar_Details || 'Aadhaar Details'}</Typography>
                    <View style={styles.row}>
                        <Image source={ImageConstant.hash} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>{LocalizedStrings.StaffProfile?.Aadhaar_Number || 'Aadhaar Number'}</Typography>
                            <Typography style={styles.value}>XXXX XXXX 1234</Typography>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <Image source={ImageConstant.person} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>{LocalizedStrings.StaffProfile?.Aadhaar_Name || 'Aadhaar Name'}</Typography>
                            <Typography style={styles.value}>Aisha Sharma</Typography>
                        </View>
                    </View>
                    <View style={styles.rowNoBorder}>
                        <Image source={ImageConstant.Calendar} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>{LocalizedStrings.StaffProfile?.Issued_By || 'Issued By'}</Typography>
                            <Typography style={styles.value}>UIDAI</Typography>
                        </View>
                    </View>
                </View>


                <View style={styles.card}>
                    <Typography style={styles.cardTitle}>{LocalizedStrings.StaffProfile?.Residential_Address || 'Residential Address'}</Typography>
                    {[
                        { label: LocalizedStrings.StaffProfile?.Street || 'Street', value: 'Flat No. 12, Rose Apartments' },
                        { label: LocalizedStrings.StaffProfile?.Locality || 'Locality', value: 'Borivali West' },
                        { label: LocalizedStrings.StaffProfile?.City || 'City', value: 'Mumbai' },
                        { label: LocalizedStrings.StaffProfile?.State || 'State', value: 'Maharashtra' },
                        { label: LocalizedStrings.StaffProfile?.Pincode || 'Pincode', value: '400092' },
                    ].map((item, idx, arr) => (
                        <View key={item.label} style={idx === arr.length - 1 ? styles.rowNoBorder : styles.row}>
                            <Image source={ImageConstant.Location} style={styles.icon} />
                            <View style={styles.textBox}>
                                <Typography style={styles.label}>{item.label}</Typography>
                                <Typography style={styles.value}>{item.value}</Typography>
                            </View>
                        </View>
                    ))}
                </View>


                <View style={styles.card}>
                    <View style={styles.kycHeader}>
                        <Typography style={[styles.cardTitle, styles.noBorder]}>{LocalizedStrings.StaffProfile?.KYC_Status || 'KYC Status'}</Typography>
                        <View style={styles.kycBadge}>
                            <Typography style={styles.kycText}>{LocalizedStrings.FindStaff?.Verified || 'Verified'}</Typography>
                        </View>
                    </View>
                </View>


                <View style={styles.actionFooter}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionBorder]}
                        onPress={() => setTerminateModal(true)}
                        activeOpacity={0.7}
                    >
                        <Typography style={styles.actionButtonText} type={Font.Poppins_SemiBold}>
                            {LocalizedStrings.StaffProfile?.Terminate_Employee || 'Terminate Employee'}
                        </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionBorder, styles.mt12]}
                        onPress={() => setComplainModal(true)}
                        activeOpacity={0.7}
                    >
                        <Typography style={styles.actionButtonText} type={Font.Poppins_SemiBold}>
                            {LocalizedStrings.StaffProfile?.Report_Complain || 'Report / Complain'}
                        </Typography>
                    </TouchableOpacity>
                </View>
            </ScrollView>


            <SimpleModal visible={terminateModal} onRequestClose={() => setTerminateModal(false)}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setTerminateModal(false)}>
                        <Typography size={15} type={Font?.Poppins_Bold} color="#C77166">✕</Typography>
                    </TouchableOpacity>
                    <Typography size={18} type={Font.Poppins_Bold} textAlign="center" style={styles.modalTitle}>
                        {LocalizedStrings.StaffProfile?.Terminate_Employee || 'Report & Remove Employee'}
                    </Typography>

                    <View style={styles.modalProfile}>
                        <Image source={ImageConstant.user} style={styles.modalProfileImage} />
                        <View style={styles.modalProfileText}>
                            <Typography size={18} type={Font.Poppins_SemiBold}>Sarah Williams</Typography>
                            <Typography size={14} color="#666">Housekeeper</Typography>
                        </View>
                    </View>

                    <DropdownComponent
                        title={LocalizedStrings.StaffProfile?.Termination_Reason || 'Termination Reason'}
                        placeholder={LocalizedStrings.StaffProfile?.termination_reason_placeholder || 'No longer required'}
                        width="100%"
                        style_dropdown={styles.dropdown}
                        selectedTextStyleNew={styles.dropdownText}
                        marginHorizontal={0}
                        style_title={styles.dropdownTitle}
                        data={[]}
                    />

                    <Typography size={14} type={Font.Poppins_Medium}>{LocalizedStrings.StaffProfile?.Rating || 'Rating'}</Typography>
                    <View style={styles.modalRatingRow}>
                        <Typography size={19}>⭐ ⭐ ⭐ ⭐ ⭐</Typography>
                    </View>

                    <Input style_inputContainer={styles.input} title={LocalizedStrings.StaffProfile?.Termination_Reason || 'Termination Reason'} />

                    <Button
                        title={LocalizedStrings.EditProfile?.Save_Changes || 'Confirm'}
                        main_style={styles.modalActionBtn}
                        onPress={() => setTerminateModal(false)}
                    />
                </View>
            </SimpleModal>


            <SimpleModal visible={complainModal} onRequestClose={() => setComplainModal(false)}>
                <ScrollView contentContainerStyle={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setComplainModal(false)}>
                        <Typography size={15} type={Font?.Poppins_Bold} color="#C77166">✕</Typography>
                    </TouchableOpacity>

                    <Typography size={18} type={Font.Poppins_Bold} textAlign="center" style={styles.modalTitle}>
                        {LocalizedStrings.StaffProfile?.Terminate_Employee || 'Remove/Terminate Employee'}
                    </Typography>

                    <View style={styles.modalProfile}>
                        <Image source={ImageConstant.user} style={styles.modalProfileImage} />
                        <View style={styles.modalProfileText}>
                            <Typography size={18} type={Font.Poppins_SemiBold}>Sarah Williams</Typography>
                            <Typography size={14} color="#666">Housekeeper</Typography>
                        </View>
                    </View>

                    <DropdownComponent
                        title={LocalizedStrings.StaffProfile?.Termination_Reason || 'Termination Reason'}
                        placeholder={LocalizedStrings.StaffProfile?.termination_reason_placeholder || 'No longer required'}
                        width="100%"
                        style_dropdown={styles.dropdown}
                        selectedTextStyleNew={styles.dropdownText}
                        marginHorizontal={0}
                        style_title={styles.dropdownTitle}
                        data={[]}
                    />

                    <Typography size={14} type={Font.Poppins_Medium}>{LocalizedStrings.StaffProfile?.Rating || 'Rating'}</Typography>
                    <View style={styles.modalRatingRow}>
                        <Typography size={19}>⭐ ⭐ ⭐ ⭐ ⭐</Typography>
                    </View>

                    <Input title={LocalizedStrings.Dashboard_model?.Remarks || 'Remarks (Optional)'} style_inputContainer={styles.input} />
                    <Input title={LocalizedStrings.StaffProfile?.Police_Station_Name || 'Police Station Name'} style_inputContainer={styles.input} />
                    <Input title={LocalizedStrings.StaffProfile?.Police_Station_Contact || 'Police Station Contact Number'} style_inputContainer={styles.input} />
                    <Input title={LocalizedStrings.StaffProfile?.Police_Station_Address || 'Police Station Address'} style_inputContainer={styles.input} />

                    <DropdownComponent
                        title={LocalizedStrings.StaffProfile?.FIR_Photo || 'FIR Photo'}
                        placeholder={LocalizedStrings.StaffProfile?.FIR_Photo_Placeholder || 'Upload FIR Photo'}
                        width="100%"
                        style_dropdown={styles.dropdown}
                        selectedTextStyleNew={styles.dropdownText}
                        marginHorizontal={0}
                        style_title={styles.dropdownTitle}
                        data={[]}
                    />

                    <Button
                        title={LocalizedStrings.StaffProfile?.Report_Complain || 'Report & Remove'}
                        main_style={styles.modalActionBtn}
                        onPress={() => setComplainModal(false)}
                    />
                </ScrollView>
            </SimpleModal>
        </CommanView>
    );
};

export default StaffProfile;

const styles = StyleSheet.create({
    container: { paddingVertical: 16 },
    headerTitle: { fontSize: 18 },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#EBEBEA',
    },
    profileImage: {
        height: 90,
        width: 90,
        borderRadius: 45,
        marginBottom: 10
    },
    name: {
        fontFamily: Font.Poppins_Bold,
        marginBottom: 2
    },
    role: {
        fontFamily: Font.Poppins_Regular,
        color: '#666',
        marginBottom: 12
    },
    info: {
        fontFamily: Font.Poppins_Medium,
        fontSize: 15
    },
    flexRow: {
        flexDirection: 'row',
        alignItems: 'center',
marginVertical:5,
        width: '80%'
    },
    icon: {
        height: 20,
        width: 20,
        resizeMode: 'contain',
        marginRight: 10
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '90%', marginVertical: 12
    },
    iconBtn: {
        backgroundColor: '#f2f2f2',
        width: '47%',
        height: 40,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#D98579',
        alignItems: 'center',
        justifyContent: 'center',
    },
    findStaffBtn: { height: 42 },
    findStaffMain: {
        width: '92%',
        marginTop: 10
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EBEBEA',
    },
    cardTitle: {
        fontFamily: Font.Poppins_Bold,
        fontSize: 18,
        marginBottom: 8,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: '#EBEBEA',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: '#EBEBEA'
    },
    rowNoBorder: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12
    },
    textBox: { marginLeft: 10 },
    label: {
        fontFamily: Font.Poppins_Regular,
        fontSize: 13,
        color: '#888'
    },
    value: {
        fontFamily: Font.Poppins_SemiBold,
        fontSize: 14,
        marginTop: 2
    },
    professionalBox: { paddingVertical: 15 },
    kycHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    noBorder: {
        borderColor: 'white',
        marginBottom: 0
    },
    kycBadge: {
        backgroundColor: '#E6F7EC',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4
    },
    kycText: {
        color: '#28A745',
        fontFamily: Font.Poppins_Medium
    },

    actionFooter: {
        marginTop: 20
    },
    actionButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBorder: {
        borderColor: '#EBEBEA',
        borderWidth: 2
    },
    mt12: { marginTop: 12 },
    actionButtonText: {
        color: '#8C8D8B',
        fontSize: 16,
        fontWeight: '600'
    },


    modalContainer: {
        paddingTop: 20
    },
    modalTitle: { marginBottom: 20 },
    modalProfile: {
        alignItems: 'center',
        marginBottom: 20,
        flexDirection: 'row'
    },
    modalProfileImage: {
        width: 50,
        height: 50,
        borderRadius: 30
    },
    modalProfileText: {
        marginLeft: 10,
        justifyContent: 'center'
    },
    dropdown: {
        marginHorizontal: 0,
        height: 43
    },
    dropdownText: {
        marginLeft: 10,
        fontFamily: Font.Poppins_Regular
    },
    dropdownTitle: {
        textAlign: 'left',
        fontFamily: Font.Poppins_Regular
    },
    modalRatingRow: {
        flexDirection: 'row',
        marginVertical: 10
    },
    input: { height: 43 },
    modalActionBtn: {
        marginTop: 20,
        width: '100%'
    },
    closeBtn: {
        position: 'absolute',
        top: 0,
        right: 0,
        borderRadius: 50,
        zIndex: 1,
        borderWidth: 2,
        borderColor: '#C77166',
        paddingHorizontal: 5,
    },
});
