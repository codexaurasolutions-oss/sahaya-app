import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
} from "react-native";
import CommanView from "../../Component/CommanView";
import HeaderForUser from "../../Component/HeaderForUser";
import Typography from "../../Component/UI/Typography";
import { Font } from "../../Constants/Font";
import Button from "../../Component/Button";
import { ImageConstant } from "../../Constants/ImageConstant";
import LocalizedStrings from '../../Constants/localization';
import { GET_WITH_TOKEN } from "../../Backend/Backend";
import { ListJob } from "../../Backend/api_routes";
import { useIsFocused } from '@react-navigation/native';
import EmptyView from "../../Component/UI/EmptyView";

const JobsList = ({ navigation }) => {
    const [jobData, setJobData] = useState([]);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            JobList();
        }
    }, [isFocused]);

    const JobList = () => {
        setLoading(true);
        GET_WITH_TOKEN(
            ListJob,
            success => {
                setJobData(success?.data || []);
                setLoading(false);
            },
            error => {
                setLoading(false);
            },
            fail => {
                setLoading(false);
            },
        );
    };

    // Format compensation display
    const formatCompensation = (job) => {
        const amount = job?.expected_compensation || job?.compensation;
        if (amount && job?.compensation_type) {
            return `₹${amount} / ${job.compensation_type}`;
        }
        return amount ? `₹${amount}` : 'Not Found';
    };

    // Format location display
    const formatLocation = (job) => {
        if (job?.city && job?.state) {
            return `${job.city}, ${job.state}`;
        }
        return job?.city || job?.state || job?.street_address || 'Location not specified';
    };

    // Get description preview
    const getDescriptionPreview = (description) => {
        if (!description) return 'No description available...';
        return description.length > 50 ? description.substring(0, 50) + '...' : description;
    };

    // Split jobs into featured (first 4) and recent (rest)
    const jobsFeatured = jobData.slice(0, 4);
    const jobsRecent = jobData.slice(4);
    return (
        <CommanView>

            <HeaderForUser
                title={LocalizedStrings.staffSection?.ActiveJobs?.title || "Active Jobs"}
                onPressLeftIcon={() => navigation?.goBack()}
                source_arrow={ImageConstant?.BackArrow}
                style_title={{ fontSize: 18 }}
                source_logo={ImageConstant?.notification}
                Profile_icon={ImageConstant?.user}
                onPressRightIcon={() => navigation.navigate('Notifications')}
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E87C6F" />
                </View>
            ) : jobData.length === 0 ? (
                <View style={styles.emptyWrapper}>
                    <EmptyView
                        title={LocalizedStrings.staffSection?.ActiveJobs?.no_jobs || 'No Jobs Available'}
                        description={LocalizedStrings.staffSection?.ActiveJobs?.no_jobs_desc || 'There are no job listings available at the moment. Please check back later.'}
                        icon={ImageConstant?.joblisting}
                        iconColor="#D98579"
                    />
                </View>
            ) : (
                <ScrollView
                    style={styles.container}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    <View style={styles.searchRow}>
                        <TextInput
                            placeholder={LocalizedStrings.staffSection?.ActiveJobs?.search_placeholder || "Search for roles..."}
                            placeholderTextColor="#888"
                            style={styles.searchInput}
                        />
                        <TouchableOpacity style={styles.filterBtn}>
                            <Typography type={Font.Poppins_Medium} style={styles.filterText}>
                                {LocalizedStrings.staffSection?.ActiveJobs?.filter || "Filter"}
                            </Typography>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.filterBtn}>
                            <Typography type={Font.Poppins_Medium} style={styles.filterText}>
                                {LocalizedStrings.staffSection?.ActiveJobs?.sort || "Sort"}
                            </Typography>
                        </TouchableOpacity>
                    </View>

                    {jobsFeatured.length > 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Typography type={Font.Poppins_Bold} style={styles.sectionTitle}>
                                    {LocalizedStrings.staffSection?.ActiveJobs?.featured_jobs || "Featured Jobs"}
                                </Typography>
                                <TouchableOpacity>
                                    <Typography type={Font.Poppins_Regular} style={styles.viewAll}>
                                        {LocalizedStrings.staffSection?.ActiveJobs?.view_all || "View All"}
                                    </Typography>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.grid}>
                                {jobsFeatured.map((job) => (
                                    <View key={job.id} style={styles.jobCard}>
                                        <View style={styles.iconCircle}>
                                            <Image source={ImageConstant.Briefcase} style={{ height: 20, width: 20, tintColor: '#FF5833' }} />
                                        </View>
                                        <Typography type={Font.Poppins_SemiBold} style={styles.jobTitle}>
                                            {job.title || 'Job Title'}
                                        </Typography>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 7 }}>
                                            <Image source={ImageConstant.Location} style={{ height: 15, width: 13, marginRight: 5 }} />
                                            <Typography type={Font.Poppins_Regular} style={styles.jobLocation}>
                                                {formatLocation(job)}
                                            </Typography>
                                        </View>
                                        {job.stay_type && (
                                            <Typography type={Font.Poppins_Medium} style={{fontSize: 12, color: '#D98579', marginBottom: 5, textAlign: 'center'}}>
                                                {job.stay_type === 'come_and_go' ? 'Come and Go' : 'Inhouse'}
                                            </Typography>
                                        )}
                                        <Typography type={Font.Poppins_Bold} style={styles.jobPay}>
                                            {formatCompensation(job)}
                                        </Typography>
                                        <Typography type={Font.Poppins_Regular} style={styles.jobLocation}>
                                            {getDescriptionPreview(job.description)}
                                        </Typography>
                                        <Button
                                            title={LocalizedStrings.staffSection?.ActiveJobs?.view_details || "View Details"}
                                            style={styles.button}
                                            textStyle={styles.buttonText}
                                            onPress={() => navigation.navigate('JobDetails', { jobId: job.id })}
                                        />
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {jobsRecent.length > 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Typography type={Font.Poppins_Bold} style={styles.sectionTitle}>
                                    {LocalizedStrings.staffSection?.ActiveJobs?.recently_added || "Recently Added"}
                                </Typography>
                                <TouchableOpacity>
                                    <Typography type={Font.Poppins_Regular} style={styles.viewAll}>
                                        {LocalizedStrings.staffSection?.ActiveJobs?.view_all || "View All"}
                                    </Typography>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.grid}>
                                {jobsRecent.map((job) => (
                                    <View key={job.id} style={styles.jobCard}>
                                        <View style={styles.iconCircle}>
                                            <Image source={ImageConstant.Briefcase} style={{ height: 20, width: 20, tintColor: '#FF5833' }} />
                                        </View>
                                        <Typography type={Font.Poppins_SemiBold} style={styles.jobTitle}>
                                            {job.title || 'Job Title'}
                                        </Typography>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 7 }}>
                                            <Image source={ImageConstant.Location} style={{ height: 15, width: 13, marginRight: 5 }} />
                                            <Typography type={Font.Poppins_Regular} style={styles.jobLocation}>
                                                {formatLocation(job)}
                                            </Typography>
                                        </View>
                                        {job.stay_type && (
                                            <Typography type={Font.Poppins_Medium} style={{fontSize: 12, color: '#D98579', marginBottom: 5, textAlign: 'center'}}>
                                                {job.stay_type === 'come_and_go' ? 'Come and Go' : 'Inhouse'}
                                            </Typography>
                                        )}
                                        <Typography type={Font.Poppins_Bold} style={styles.jobPay}>
                                            {formatCompensation(job)}
                                        </Typography>
                                        <Typography type={Font.Poppins_Regular} style={styles.jobLocation}>
                                            {getDescriptionPreview(job.description)}
                                        </Typography>
                                        <Button
                                            title={LocalizedStrings.staffSection?.ActiveJobs?.view_details || "View Details"}
                                            style={styles.button}
                                            textStyle={styles.buttonText}
                                            onPress={() => navigation.navigate('JobDetails', { jobId: job.id })}
                                        />
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </ScrollView>
            )}
        </CommanView>
    );
};

export default JobsList;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: "#fff",
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 10,
    },
    searchInput: {
        flex: 1,
        backgroundColor: "#F5F5F5",
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 14,
        height: 40,
        marginRight: 8,
    },
    filterBtn: {
        backgroundColor: "#F5F5F5",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 5,
    },
    filterText: {
        fontSize: 13,
        color: "#333",
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 14,
    },
    sectionTitle: {
        fontSize: 20,
        color: "#333",
    },
    viewAll: {
        fontSize: 13,
        color: "#E87C6F",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginTop: 12,
    },
    jobCard: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#eee",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FFECE9",
        alignSelf: "center",
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    jobTitle: {
        fontSize: 17,
        color: "#222",
        textAlign: 'center'
    },
    jobPay: {
        fontSize: 18,
        color: "#E87C6F",
        marginVertical: 2,
    },
    jobLocation: {
        fontSize: 12,
        color: "gray",
    },
    button: {
        backgroundColor: "#E87C6F",
        borderRadius: 10,
        marginTop: 10,
        paddingVertical: 6,
        height: 37,
        width: '90%'
    },
    buttonText: {
        color: "#fff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
