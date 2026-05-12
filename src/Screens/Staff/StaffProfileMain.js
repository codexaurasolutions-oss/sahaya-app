import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Modal } from 'react-native';
import CommanView from '../../Component/CommanView';
import HeaderForUser from '../../Component/HeaderForUser';
import { ImageConstant } from '../../Constants/ImageConstant';
import Typography from '../../Component/UI/Typography';
import Button from '../../Component/Button';
import { Font } from '../../Constants/Font';
import { useSelector, useDispatch } from 'react-redux';
import { userDetails } from '../../Redux/action';
import { GET_WITH_TOKEN, POST_FORM_DATA } from '../../Backend/Backend';
import { launchImageLibrary } from 'react-native-image-picker';
import { PROFILE, GET_NOTIFICATION_SETTINGS, SAVE_NOTIFICATION_SETTINGS, PROFILE_UPDATE } from '../../Backend/api_routes';
import moment from 'moment';
import LocalizedStrings from '../../Constants/localization';
import SimpleToast from 'react-native-simple-toast';
import { useIsFocused } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import { Alert } from 'react-native';
import { isPlaceholderImage } from '../../Utils/ImageUtils';

const StaffProfileMain = ({ navigation }) => {
    const dispatch = useDispatch();
    const userDetail = useSelector(store => store?.userDetails);
    const [loading, setLoading] = useState(false);
    const [terminateModal, setTerminateModal] = useState(false);
    const [Adhar, setAdhar] = useState()
    // Notification Settings State
    const [smsAlerts, setSmsAlerts] = useState(false);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [notificationSaving, setNotificationSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const isFocused = useIsFocused();

    // Fetch profile data on component mount
    useEffect(() => {
        fetchProfile();
    }, []);

    // Fetch notification settings on component mount
    useEffect(() => {
        if (isFocused) {
            fetchNotificationSettings();
        }
    }, [isFocused]);


    const downloadImage = async (url, name) => {
        try {
            if (!url) {
                SimpleToast.show('Image not available', SimpleToast.SHORT);
                return;
            }
            const fileName = name || url.split('/').pop();
            const destPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

            setLoading(true);
            const downloadResult = await RNFS.downloadFile({
                fromUrl: url,
                toFile: destPath,
            }).promise;

            setLoading(false);

            if (downloadResult.statusCode === 200) {
                Alert.alert('Success', `Image saved to Downloads folder as ${fileName}`);
            } else {
                Alert.alert('Failed', 'Could not download image');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'Download failed, please try again');
        }
    };

    const fetchProfile = () => {
        setLoading(true);
        GET_WITH_TOKEN(
            PROFILE,
            success => {
                setLoading(false);
                setAdhar(success.data?.kyc_information?.aadhaar_front_path)
                if (success?.data) {
                    dispatch(userDetails(success.data));
                }
            },
            error => {
                setLoading(false);
            },
            fail => {
                setLoading(false);
            },
        );
    };

    // Get user data from userDetails
    const imgUrl = userDetail?.image || '';
    const isDefaultImg = isPlaceholderImage(imgUrl);
    const userImage = isDefaultImg ? ImageConstant.user : { uri: userDetail.image };
    const userName = userDetail?.first_name && userDetail?.last_name
        ? `${userDetail.first_name} ${userDetail.last_name}`
        : userDetail?.first_name || userDetail?.name || 'User';
    const userRole = userDetail?.user_work_info?.primary_role
        || userDetail?.work_info?.primary_role
        || 'Staff Member';

    // Phone number with country code
    const countryCode = userDetail?.country_code || '+91';
    const phoneNumber = userDetail?.phone_number || 'Not Found';
    const userPhone = phoneNumber !== 'Not Found' ? `${countryCode} ${phoneNumber}` : 'Not Found';
    const userEmail = userDetail?.email || 'Not Found';

    // Date of Birth
    const userDOB = userDetail?.dob
        ? moment(userDetail.dob).format('DD/MM/YYYY')
        : 'Not Found';

    // Gender
    const userGender = userDetail?.gender
        ? userDetail.gender.charAt(0).toUpperCase() + userDetail.gender.slice(1)
        : 'Not Found';

    // Get address from userDetails
    const addresses = userDetail?.addresses || [];
    const currentAddress = addresses.length > 0 ? addresses[0] : {};
    const street = currentAddress?.street || 'Not Found';
    const city = currentAddress?.city || 'Not Found';
    const state = currentAddress?.state || 'Not Found';
    const pincode = currentAddress?.pincode || 'Not Found';

    // Get Aadhaar details
    const aadhaarNumber = userDetail?.aadhar_number || 'Not Found';
    const aadhaarName = userDetail?.aadhar_name || userName;
    const aadharVerify = userDetail?.aadhar__verify == 1 || userDetail?.aadhar__verify === true;

    // Get KYC information
    const kycInfo = userDetail?.kyc_information || {};
    const aadhaarFront = isPlaceholderImage(kycInfo?.aadhaar_front_path) ? null : kycInfo.aadhaar_front_path;
    const aadhaarBack = isPlaceholderImage(kycInfo?.aadhaar_back_path) ? null : kycInfo.aadhaar_back_path;
    const policeVerification = isPlaceholderImage(kycInfo?.police_verification_path) ? null : kycInfo.police_verification_path;
    const policeVerificationStatus = policeVerification ? 'Verified' : 'Pending';

    // Fetch notification settings
    const fetchNotificationSettings = () => {
        setNotificationLoading(true);
        GET_WITH_TOKEN(
            GET_NOTIFICATION_SETTINGS,
            success => {
                setNotificationLoading(false);
                if (success?.data) {
                    const notificationValue = success?.data?.value || success?.data?.notification || '0';
                    setSmsAlerts(notificationValue === '1' || notificationValue === 1);
                }
            },
            error => {
                setNotificationLoading(false);
            },
            fail => {
                setNotificationLoading(false);
            },
        );
    };

    // Handle SMS alerts change
    const handleSmsAlertsChange = (value) => {
        setSmsAlerts(value);
        saveNotificationSettings(value ? '1' : '0');
    };

    // Save notification settings
    const saveNotificationSettings = (value) => {
        setNotificationSaving(true);
        const formData = new FormData();
        formData.append('value', value);

        POST_FORM_DATA(
            SAVE_NOTIFICATION_SETTINGS,
            formData,
            success => {
                setNotificationSaving(false);
                SimpleToast.show(success?.message || 'Notification settings saved successfully', SimpleToast.SHORT);
            },
            error => {
                setNotificationSaving(false);
                SimpleToast.show(error?.message || 'Failed to save notification settings', SimpleToast.SHORT);
            },
            fail => {
                setNotificationSaving(false);
                SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
            },
        );
    };

    const handlePickProfileImage = () => {
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
        };

        launchImageLibrary(options, response => {
            if (response.didCancel) return;
            if (response.errorMessage) {
                SimpleToast.show('Error picking image', SimpleToast.SHORT);
            } else if (response.assets && response.assets[0]) {
                const asset = response.assets[0];
                const imageObj = {
                    uri: asset.uri,
                    type: asset.type || 'image/jpeg',
                    name: asset.fileName || `profile_photo_${Date.now()}.jpg`,
                };
                handleUpdateProfileImage(imageObj);
            }
        });
    };

    const handleUpdateProfileImage = (imageObj) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('image', imageObj);

        POST_FORM_DATA(
            PROFILE_UPDATE,
            formData,
            res => {
                setLoading(false);
                SimpleToast.show('Profile image updated successfully', SimpleToast.SHORT);
                fetchProfile(); // Refresh profile data to update UI and Redux
            },
            err => {
                setLoading(false);
                SimpleToast.show(err?.message || 'Failed to update image', SimpleToast.SHORT);
            }
        );
    };

    return (<>
        <CommanView>
            <HeaderForUser
                title={LocalizedStrings.StaffProfile?.title || "Staff Profile"}
                source_logo={ImageConstant?.pencle}
                Profile_icon={userDetail?.image && userDetail.image}
                style_title={styles.headerTitle}
                onPressRightIcon={() => navigation.navigate('EditProfile')}
                source_arrow={ImageConstant?.BackArrow}
                onPressLeftIcon={() => navigation?.goBack()}
            />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.profileCard}>
                    <View style={styles.imageContainer}>
                        <TouchableOpacity onPress={() => setPreviewImage(imgUrl)}>
                            <Image source={userImage} style={styles.profileImage} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.editImageBtn}
                            onPress={handlePickProfileImage}
                            activeOpacity={0.8}
                        >
                            <Image source={ImageConstant.NewCamera} style={styles.editImageIcon} />
                        </TouchableOpacity>
                    </View>
                    <Typography style={styles.name} size={22}>{userName}</Typography>
                    <Typography style={styles.role}>{userRole}</Typography>

                    <View style={styles.flexRow}>
                        <Image source={ImageConstant.phone} style={styles.icon} />
                        <Typography style={styles.info}>{userPhone}</Typography>
                    </View>
                    <View style={styles.flexRow}>
                        <Image source={ImageConstant.Location} style={styles.icon} />
                        <Typography style={styles.info}>
                            {city !== 'Not Found' && state !== 'Not Found'
                                ? `${city}, ${state}`
                                : city !== 'Not Found' ? city : state !== 'Not Found' ? state : 'Not Found'}
                        </Typography>
                    </View>
                    {userEmail !== 'Not Found' && (
                        <View style={styles.flexRow}>
                            <Image source={ImageConstant.mail} style={styles.icon} />
                            <Typography style={styles.info}>{userEmail}</Typography>
                        </View>
                    )}

                    {/* <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Image source={ImageConstant.phone} style={styles.icon} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Image source={ImageConstant.WhatsApp} style={styles.icon} />
                        </TouchableOpacity>
                    </View> */}
                    {/* <Button
                        onPress={() => navigation.navigate()}
                        style={styles.findStaffBtn}
                        title={'Find Staff with AI'}
                        main_style={styles.findStaffMain}
                    /> */}
                </View>
                <View style={styles.card}>
                    <Typography style={styles.cardTitle}>{LocalizedStrings.StaffProfile?.Personal_Information || "Personal Information"}</Typography>
                    <View style={styles.row}>
                        <Image source={ImageConstant.date} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>{LocalizedStrings.StaffProfile?.Date_of_Birth || "Date of Birth"}</Typography>
                            <Typography style={styles.value}>{userDOB}</Typography>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <Image source={ImageConstant.person} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>{LocalizedStrings.StaffProfile?.Gender || "Gender"}</Typography>
                            <Typography style={styles.value}>{userGender}</Typography>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <Image source={ImageConstant.person} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>Emergency Contact Name</Typography>
                            <Typography style={styles.value}>
                                {userDetail?.user_work_info?.emergency_contact_name || userDetail?.work_info?.emergency_contact_name || 'Not Found'}
                            </Typography>
                        </View>
                    </View>
                    <View style={styles.rowNoBorder}>
                        <Image source={ImageConstant.phone} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>Emergency Contact Number</Typography>
                            <Typography style={styles.value}>
                                {userDetail?.user_work_info?.emergency_contact_number || userDetail?.work_info?.emergency_contact_number
                                    ? `+91 ${userDetail?.user_work_info?.emergency_contact_number || userDetail?.work_info?.emergency_contact_number}`
                                    : 'Not Found'}
                            </Typography>
                        </View>
                    </View>
                    <View style={styles.rowNoBorder}>
                        <Image source={ImageConstant.upi} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>UPI ID</Typography>
                            <Typography style={styles.value}>
                                {userDetail?.upi_id || userDetail?.user_work_info?.upi_id || userDetail?.work_info?.upi_id || 'Not Available'}
                            </Typography>
                        </View>
                    </View>
                </View>
                
                <View style={styles.card}>
                    <Typography style={styles.cardTitle}>Documents</Typography>
                    <View style={styles.documentRow}>
                        <TouchableOpacity 
                            style={styles.docItem}
                            onPress={() => !isPlaceholderImage(userDetail?.user_work_info?.aadhar_front) ? setPreviewImage(userDetail.user_work_info.aadhar_front) : null}
                        >
                            <Typography style={styles.docLabel}>Aadhar Front</Typography>
                            <Typography style={styles.docStatus}>
                                {!isPlaceholderImage(userDetail?.user_work_info?.aadhar_front) ? 'View Card' : 'Not Uploaded'}
                            </Typography>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.docItem}
                            onPress={() => !isPlaceholderImage(userDetail?.user_work_info?.aadhar_back) ? setPreviewImage(userDetail.user_work_info.aadhar_back) : null}
                        >
                            <Typography style={styles.docLabel}>Aadhar Back</Typography>
                            <Typography style={styles.docStatus}>
                                {!isPlaceholderImage(userDetail?.user_work_info?.aadhar_back) ? 'View Card' : 'Not Uploaded'}
                            </Typography>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                        style={[styles.docItem, { marginTop: 10 }]}
                        onPress={() => !isPlaceholderImage(userDetail?.user_work_info?.verification_certificate) ? setPreviewImage(userDetail.user_work_info.verification_certificate) : null}
                    >
                        <Typography style={styles.docLabel}>Police Verification</Typography>
                        <Typography style={styles.docStatus}>
                            {!isPlaceholderImage(userDetail?.user_work_info?.verification_certificate) ? 'View Certificate' : 'Not Uploaded'}
                        </Typography>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Typography style={styles.cardTitle}>Work Information</Typography>
                    <View style={styles.row}>
                        <Image source={ImageConstant.Briefcase} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>Role</Typography>
                            <Typography style={styles.value}>{userRole}</Typography>
                        </View>
                    </View>
                    <View style={styles.rowNoBorder}>
                        <Image source={ImageConstant.Calendar} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>Joining Date</Typography>
                            <Typography style={styles.value}>
                                {userDetail?.user_work_info?.joining_date || userDetail?.work_info?.joining_date
                                    ? moment(userDetail?.user_work_info?.joining_date || userDetail?.work_info?.joining_date).format('DD MMM YYYY')
                                    : 'Not Found'}
                            </Typography>
                        </View>
                    </View>
                </View>
                <View style={styles.card}>
                    <Typography style={styles.cardTitle}>{LocalizedStrings.StaffProfile?.Aadhaar_Details || "Aadhaar Details"}</Typography>
                    <View style={styles.row}>
                        <Image source={ImageConstant.hash} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>{LocalizedStrings.StaffProfile?.Aadhaar_Number || "Aadhaar Number"}</Typography>
                            <Typography style={styles.value}>
                                {aadhaarNumber !== 'Not Found' && aadhaarNumber.length > 4
                                    ? `XXXX XXXX ${aadhaarNumber.slice(-4)}`
                                    : aadhaarNumber}
                            </Typography>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <Image source={ImageConstant.person} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>{LocalizedStrings.StaffProfile?.Aadhaar_Name || "Aadhaar Name"}</Typography>
                            <Typography style={styles.value}>{aadhaarName}</Typography>
                        </View>
                    </View>
                    <View style={styles.rowNoBorder}>
                        <Image source={ImageConstant.Calendar} style={styles.icon} />
                        <View style={styles.textBox}>
                            <Typography style={styles.label}>{LocalizedStrings.StaffProfile?.KYC_Status || "Verification Status"}</Typography>
                            <Typography style={styles.value}>{aadharVerify ? 'Verified' : 'Pending'}</Typography>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <Typography style={styles.cardTitle}>{LocalizedStrings.StaffProfile?.Residential_Address || "Residential Address"}</Typography>
                    {[
                        { label: LocalizedStrings.StaffProfile?.Street || 'Street', value: street },
                        { label: LocalizedStrings.StaffProfile?.City || 'City', value: city },
                        { label: LocalizedStrings.StaffProfile?.State || 'State', value: state },
                        { label: LocalizedStrings.StaffProfile?.Pincode || 'Pincode', value: pincode },
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
                    <Typography style={styles.cardTitle}>{LocalizedStrings.EditProfile?.Notification_Preferences || 'Notification Preferences'}</Typography>
                </View>

            </ScrollView>


        </CommanView>
        <Modal
            visible={!!previewImage}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setPreviewImage(null)}
        >
            <View style={styles.imagePreviewOverlay}>
                <TouchableOpacity
                    style={styles.imagePreviewClose}
                    onPress={() => setPreviewImage(null)}
                >
                    <Typography size={22} color="#fff">{'\u2715'}</Typography>
                </TouchableOpacity>
                {previewImage && (
                    <Image
                        source={{ uri: previewImage }}
                        style={styles.imagePreviewFull}
                        resizeMode="contain"
                    />
                )}
            </View>
        </Modal>

        {terminateModal && (
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <TouchableOpacity style={styles.closeModal} onPress={() => setTerminateModal(false)}>
                        <Typography style={{ fontSize: 18, color: '#E87C6F' }}>✕</Typography>
                    </TouchableOpacity>

                    <Typography style={styles.modalTitleText}>Aadhaar Card Images</Typography>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {aadhaarFront ? (
                            <View style={{ marginBottom: 20 }}>
                                <Image source={{ uri: aadhaarFront }} style={styles.aadhaarImage} />
                                <TouchableOpacity
                                    style={styles.downloadBtn}
                                    onPress={() => downloadImage(aadhaarFront, 'Aadhaar_Front.jpg')}
                                >
                                    <Typography style={styles.downloadText}>Download Front</Typography>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Typography style={styles.noImageText}>Front image not available</Typography>
                        )}

                        {aadhaarBack ? (
                            <View style={{ marginBottom: 20 }}>
                                <Image source={{ uri: aadhaarBack }} style={styles.aadhaarImage} />
                                <TouchableOpacity
                                    style={styles.downloadBtn}
                                    onPress={() => downloadImage(aadhaarBack, 'Aadhaar_Back.jpg')}
                                >
                                    <Typography style={styles.downloadText}>Download Back</Typography>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Typography style={styles.noImageText}>Back image not available</Typography>
                        )}
                    </ScrollView>
                </View>
            </View>
        )}

    </>
    );
};

export default StaffProfileMain;

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
    imageContainer: {
        position: 'relative',
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editImageBtn: {
        position: 'absolute',
        bottom: 5,
        right: -5,
        backgroundColor: '#fff',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#EBEBEA',
    },
    editImageIcon: {
        width: 18,
        height: 18,
        tintColor: '#D98579',
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
        marginVertical: 5,
        width: '80%'
    },
    icon: {
        height: 20,
        width: 20,
        resizeMode: 'contain',
        marginRight: 10,
        tintColor: '#8C8D8B'
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
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    benefit: {
        fontSize: 14,
        marginVertical: 2,
        fontFamily: Font.Poppins_Medium,
        color: '#333',
    },
    subText: {
        fontSize: 12,
        color: '#666',
        width: '80%',
        fontFamily: Font.Poppins_Regular,
    },
    loadingContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    modalBox: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        maxHeight: '80%',
    },
    closeModal: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 2,
    },
    modalTitleText: {
        fontFamily: Font.Poppins_Bold,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
        color: '#333',
    },
    aadhaarImage: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
        borderRadius: 10,
    },
    noImageText: {
        textAlign: 'center',
        color: '#888',
        marginVertical: 10,
        fontFamily: Font.Poppins_Regular,
    },
    downloadBtn: {
        backgroundColor: '#E87C6F',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignSelf: 'center',
        marginTop: 10,
    },
    downloadText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: Font.Poppins_Medium,
    },
    docBox: {
        width: '48%',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EBEBEA',
        alignItems: 'center',
    },
    docLink: {
        fontSize: 13,
        color: '#D98579',
        fontFamily: Font.Poppins_SemiBold,
        marginTop: 4,
    },
    docGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 12,
    },
    docItem: {
        width: '30%',
        alignItems: 'center',
    },
    documentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    docItemCard: {
        width: '48%',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EBEBEA',
        alignItems: 'center',
    },
    docStatus: {
        fontSize: 13,
        color: '#D98579',
        fontFamily: Font.Poppins_SemiBold,
        marginTop: 4,
    },
    docImage: {
        width: '100%',
        height: 90,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    docLabel: {
        fontFamily: Font.Poppins_Medium,
        fontSize: 11,
        color: '#555',
        marginTop: 6,
        textAlign: 'center',
    },
    imagePreviewOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreviewClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    imagePreviewFull: {
        width: '90%',
        height: '70%',
    },
});
