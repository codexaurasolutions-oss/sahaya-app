import {navigationRef} from '../Navigation/RootNavigation';

const notificationScreenMap = {
  // Owner notifications
  job_application: {tab: 'Jobs'},
  job_quit: {tab: 'Dashboard', nestedScreen: 'StaffManagement'},
  leave_application: {tab: 'More'},
  subscription_activated: {tab: 'More'},
  subscription_expiring: {tab: 'More'},
  subscription_new: {tab: 'More'},
  extra_job_purchased: {tab: 'Jobs'},
  extra_staff_purchased: {tab: 'More'},
  staff_added: {tab: 'Dashboard', nestedScreen: 'StaffManagement'},

  // Staff notifications
  job_application_accepted: {tab: 'My Work'},
  job_application_rejected: {tab: 'My Work'},
  leave_approved: {tab: 'My Work'},
  leave_rejected: {tab: 'My Work'},
  salary_paid: {tab: 'DashboardHome'},
  salary_payment: {tab: 'DashboardHome'},
  attendance: {tab: 'DashboardHome'},
  advance_payment: {tab: 'DashboardHome'},
  advance_received: {tab: 'DashboardHome'},
  advance_deducted: {tab: 'DashboardHome'},
  termination: {tab: 'DashboardHome'},

  // Both
  kyc_approved: {tab: 'More'},
  kyc_rejected: {tab: 'More'},
  kyc_submitted: {tab: 'More'},
  admin_broadcast: {tab: 'DashboardHome'},
  user_registered: {tab: 'DashboardHome'},
};

const waitForNavigation = (callback, retries = 20, interval = 300) => {
  if (navigationRef?.isReady()) {
    callback();
  } else if (retries > 0) {
    setTimeout(() => waitForNavigation(callback, retries - 1, interval), interval);
  }
};

export const notificationOpen = async remoteMessage => {
  try {
    const data = remoteMessage?.data || remoteMessage?.notification?.data || {};
    const type = data.type || '';

    const route = notificationScreenMap[type];
    if (!route) {
      return;
    }

    waitForNavigation(() => {
      const state = navigationRef.getRootState();
      const ownerRoot = state?.routes?.find(r => r.name === 'TabNavigation');
      const staffRoot = state?.routes?.find(
        r => r.name === 'TabNavigationForStaff',
      );

      if (ownerRoot && !staffRoot) {
        const ownerParams = route.nestedScreen
          ? {
              screen: route.tab,
              params: {
                screen: route.nestedScreen,
              },
            }
          : {
              screen: route.tab,
            };

        if (type === 'job_application' && data?.job_id) {
          ownerParams.params = {
            ...(ownerParams.params || {}),
            screen: 'ListingJob',
            params: {id: Number(data.job_id)},
          };
          ownerParams.screen = 'Jobs';
        }

        navigationRef.navigate('TabNavigation', ownerParams);
        return;
      }

      if (staffRoot) {
        navigationRef.navigate('TabNavigationForStaff', {
          screen: route.tab,
        });
      }
    });
  } catch (error) {
    // silent
  }
};
