import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import React, { useEffect, useState } from 'react';
import CommanView from '../../../Component/CommanView';
import Typography from '../../../Component/UI/Typography';
import { Font } from '../../../Constants/Font';
import HeaderForUser from '../../../Component/HeaderForUser';
import DropdownComponent from '../../../Component/DropdownComponent';
import Button from '../../../Component/Button';
import { ImageConstant } from '../../../Constants/ImageConstant';
import { useSelector } from 'react-redux';
import LocalizedStrings from '../../../Constants/localization';
import { useIsFocused } from '@react-navigation/native';
import { GET_WITH_TOKEN, POST_WITH_TOKEN, PUT_WITH_TOKEN, POST_FORM_DATA } from '../../../Backend/Backend';
import {
  ListStaff,
  SalaryList,
  SalaryManagementStaff,
  SalaryStore,
  SalaryUpdateStatus,
  AdvanceWithdraw,
  AttendanceStaff,
  UpdateStaff,
} from '../../../Backend/api_routes';
import SimpleToast from 'react-native-simple-toast';
import moment from 'moment';
import PaymentReceipt from '../../../Component/PaymentReceipt';
import { setAsyncStorage, getAsyncStorage } from '../../../Utils/AsyncStorage';
// import { processSalaryPayment } from '../../../Services/RazorpayService';

const StaffManagement = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [baseSalary, setBaseSalary] = useState('');
  const [profileMonthlySalary, setProfileMonthlySalary] = useState(0);
  const [bonus, setBonus] = useState('');
  const [overtime, setOvertime] = useState('');
  const [advance, setAdvance] = useState('');
  const [deduction, setDeduction] = useState(200);
  const [selectedMethod, setSelectedMethod] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userDetails = useSelector(state => state?.userDetails);
  const [leaveList, setLeaveList] = useState([]);
  const [leaveType, setLeaveType] = useState(null);
  const [listPastPayments, setListPastPayments] = useState([]);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiInput, setUpiInput] = useState('');
  const [isEditingBaseSalary, setIsEditingBaseSalary] = useState(false);
  const [isEditingAdjustments, setIsEditingAdjustments] = useState(false);
  const [isEditingDeductions, setIsEditingDeductions] = useState(false);
  const [isSavingAdjustments, setIsSavingAdjustments] = useState(false);
  const [pendingPaymentToConfirm, setPendingPaymentToConfirm] = useState(null);
  const [confirmReceiptFile, setConfirmReceiptFile] = useState(null);
  const [isSavingBaseSalary, setIsSavingBaseSalary] = useState(false);
  const [isSavingDeductions, setIsSavingDeductions] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [upiUpdating, setUpiUpdating] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceHistory, setAdvanceHistory] = useState([]);
  const [paymentType, setPaymentType] = useState(null);
  const [shouldDeductAdvance, setShouldDeductAdvance] = useState(true);
  const [deductionMethod, setDeductionMethod] = useState(null);
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState('Cash');
  const [workedDays, setWorkedDays] = useState(0);
  const [totalDaysInMonth, setTotalDaysInMonth] = useState(30);
  const paymentTypeData = [
    { value: 'payment', label: 'Payment' },
    { value: 'advance', label: 'Advance Payment' },
  ];
  const deductionMethodData = [
    { value: 'monthly', label: 'Monthly Deduction' },
    { value: 'one_time', label: 'One-Time Deduction (Next Salary)' },
    { value: 'installments', label: 'Installments (Multiple Months)' },
  ];
  const getSanitizedValue = value =>
    Number.isNaN(value) || value === null ? '' : String(value);

  const handleAmountChange = setter => text => {
    const numericValue = parseFloat(text.replace(/[^0-9.]/g, ''));
    setter(Number.isNaN(numericValue) ? 0 : numericValue);
  };
  const [totalNet, setTotalNet] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [canProcessAnyway, setCanProcessAnyway] = useState(false);
  const [totalPaidThisMonth, setTotalPaidThisMonth] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const getPayableAmount = () => {
    if (customAmount === '' || customAmount === null || customAmount === undefined) {
      return Number(totalNet) || 0;
    }
    const parsedAmount = Number(customAmount);
    return Number.isNaN(parsedAmount) ? 0 : parsedAmount;
  };

  const savePaymentToLocal = async (record) => {
    try {
      const existing = await getAsyncStorage('payment_history');
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(record);
      await setAsyncStorage('payment_history', JSON.stringify(history));
    } catch (e) {
      console.log('Error saving payment to local storage', e);
    }
  };

  const loadAdvanceHistory = async (staffId) => {
    try {
      const stored = await getAsyncStorage('payment_history');
      if (stored) {
        const all = JSON.parse(stored);
        const staffAdvances = all.filter(
          item => item.type === 'advance' && String(item.staff_id) === String(staffId),
        );
        setAdvanceHistory(staffAdvances);
      } else {
        setAdvanceHistory([]);
      }
    } catch (e) {
      setAdvanceHistory([]);
    }
  };

  useEffect(() => {
    GetSalaryList();
    GetUser();
  }, [isFocused]);

  useEffect(() => {
    if (profileMonthlySalary > 0 && totalDaysInMonth > 0) {
      const calculatedBase = ((profileMonthlySalary / totalDaysInMonth) * workedDays).toFixed(2);
      setBaseSalary(calculatedBase);
    } else {
      setBaseSalary('0');
    }
  }, [profileMonthlySalary, workedDays, totalDaysInMonth]);

  useEffect(() => {
    const base = Number(baseSalary) || 0;
    const bonusAmount = Number(bonus) || 0;
    const overtimeAmount = Number(overtime) || 0;
    const advanceVal = Number(advance) || 0;
    const taxAmount = Number(deduction) || 0;
    const netSalary = Math.max(0, base + bonusAmount + overtimeAmount - taxAmount - advanceVal);
    setTotalNet(netSalary);
    
    // Auto-calculate custom amount whenever net salary components change
    setCustomAmount(String(netSalary.toFixed(2)));
    
    // Check if already paid to show UI warning
    const currentMonth = moment().format('YYYY-MM');
    const selectedStaffId = leaveType?.value;
    const existing = listPastPayments?.find(payment => {
      const paymentMonth = moment(payment?.created_at).format('YYYY-MM');
      const isSameMonth = paymentMonth === currentMonth;
      const isPaid = payment?.status?.toLowerCase() === 'paid';
      const isSameStaff = payment?.staff_id === selectedStaffId || payment?.staff_member?.id === selectedStaffId;
      return isSameMonth && isPaid && isSameStaff;
    });
    setCanProcessAnyway(!!existing);

    // Calculate total paid this month for this staff
    const staffPayments = listPastPayments?.filter(payment => {
      const paymentMonth = moment(payment?.created_at).format('YYYY-MM');
      const isSameMonth = paymentMonth === currentMonth;
      const isPaid = payment?.status?.toLowerCase() === 'paid';
      const isSameStaff = payment?.staff_id === selectedStaffId || payment?.staff_member?.id === selectedStaffId;
      return isSameMonth && isPaid && isSameStaff;
    });
    const paidSum = staffPayments?.reduce((sum, p) => sum + (Number(p.net_salary || p.amount) || 0), 0) || 0;
    setTotalPaidThisMonth(paidSum);
  }, [overtime, baseSalary, bonus, advance, deduction, leaveType, listPastPayments]);

  useEffect(() => {
    setRemainingBalance(Math.max(0, getPayableAmount() - totalPaidThisMonth));
  }, [customAmount, totalNet, totalPaidThisMonth]);

  // Reset custom amount when staff changes
  useEffect(() => {
    setCustomAmount('');
  }, [leaveType]);

  const GetUser = () => {
    GET_WITH_TOKEN(
      ListStaff,
      success => {
        if (success?.data) {
          const leaveTypes = success?.data?.data?.map(item => ({
            value: item.id,
            label: `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.name || 'Staff',
            upi_id: item.upi_id || 
                    item.user_work_info?.upi_id || 
                    item.work_info?.upi_id || 
                    item.user_detail?.upi_id ||
                    item.staff?.upi_id ||
                    '',
          }));
          setLeaveList(leaveTypes || []);
        }
      },
      error => {
        SimpleToast.show('Failed to load staff list for salary', SimpleToast.SHORT);
      },
      fail => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const GetSalaryList = () => {
    GET_WITH_TOKEN(
      SalaryList,
      success => {
        if (success?.data) {
          setListPastPayments(success.data);
        }
      },
      error => {
        SimpleToast.show('Failed to load past payments', SimpleToast.SHORT);
      },
      fail => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const fetchSalaryDetails = id => {
    GET_WITH_TOKEN(
      `${SalaryManagementStaff}/${id}`,
      response => {
        const salaryDetails = response?.data?.salary_details ?? {};
        const baseSalary = salaryDetails?.base_salary?.monthly_salary ?? 0;
        const adjustments = salaryDetails?.adjustments ?? {};
        setProfileMonthlySalary(baseSalary);
        setBonus(adjustments.performance_bonus ?? 0);
        setOvertime(adjustments.overtime_pay ?? 0);
        setAdvance(adjustments.advance_payment ?? 0);
        setDeduction(adjustments.tax_deduction ?? 0);
      },
      error => {
        console.log('fetchSalaryDetails error ---->', error);
        SimpleToast.show(error?.data?.message, SimpleToast.SHORT);
      },
      fail => {
        console.log('fetchSalaryDetails network fail ---->', fail);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const fetchAttendance = (staffId) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    setTotalDaysInMonth(new Date(year, month, 0).getDate());

    const formData = new FormData();
    formData.append('id', staffId);
    formData.append('month', month);
    formData.append('year', year);

    POST_FORM_DATA(
      AttendanceStaff,
      formData,
      success => {
        const records = success?.data?.attendance || success?.data || [];
        let totalWorked = 0;
        if (Array.isArray(records)) {
          records.forEach(record => {
            const status = record?.status?.toLowerCase();
            if (status === 'present' || status === 'late') {
              totalWorked++;
            }
          });
        }
        setWorkedDays(totalWorked);
      },
      error => console.log('Salary fetch attendance error:', error)
    );
  };

  const markAsPaid = (paymentId, receiptFile = null) => {
    console.log('markAsPaid called with paymentId --->', paymentId);
    if (!paymentId) {
      SimpleToast.show('Payment ID not found', SimpleToast.SHORT);
      return;
    }

    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('status', 'paid');
    
    if (receiptFile) {
      formData.append('payment_receipt', {
        uri: receiptFile.uri,
        type: receiptFile.type || 'image/jpeg',
        name: receiptFile.fileName || 'receipt.jpg',
      });
    }

    POST_FORM_DATA(
      `${SalaryUpdateStatus}/${paymentId}/status`,
      formData,
      success => {
        setListPastPayments(prev =>
          prev.map(item =>
            item.payment_id === paymentId ? { ...item, status: 'paid' } : item,
          ),
        );
        SimpleToast.show('Payment marked as paid', SimpleToast.SHORT);
        setPendingPaymentToConfirm(null);
        setConfirmReceiptFile(null);
      },
      error => {
        SimpleToast.show(
          error?.data?.message || 'Failed to update status',
          SimpleToast.SHORT,
        );
      },
      () => {
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const saveSalaryData = () => {
    if (!leaveType?.value) {
      SimpleToast.show('Please select a staff member first', SimpleToast.SHORT);
      return;
    }

    const isSavingBase = isEditingBaseSalary;
    const isSavingAdj = isEditingAdjustments;

    if (isSavingBase) setIsSavingBaseSalary(true);
    if (isSavingAdj) setIsSavingAdjustments(true);

    const body = {
      staff_id: leaveType?.value,
      houseowner_id: userDetails?.id,
      basic_salary: Number(baseSalary) || 0,
      performative_allowance: Number(bonus) || 0,
      over_time_allowance: Number(overtime) || 0,
      tax: Number(deduction) || 0,
      advance_payment: Number(advance) || 0,
      payment_mode: selectedMethod?.toLowerCase() || 'cash',
      status: 'paid',
    };

    POST_WITH_TOKEN(
      `${SalaryManagementStaff}/${leaveType?.value}`,
      body,
      success => {
        const savedData = success?.data;
        if (savedData) {
          setBaseSalary(savedData.basic_salary ?? baseSalary);
          setBonus(savedData.performative_allowance ?? bonus);
          setOvertime(savedData.over_time_allowance ?? overtime);
          setDeduction(savedData.tax ?? deduction);
          setAdvance(savedData.advance_payment ?? advance);
          if (savedData.net_salary != null) {
            setTotalNet(savedData.net_salary);
          }
        }
        setIsSavingBaseSalary(false);
        setIsSavingAdjustments(false);
        setIsSavingDeductions(false);
        setIsEditingBaseSalary(false);
        setIsEditingAdjustments(false);
        setIsEditingDeductions(false);
        SimpleToast.show('Salary updated successfully', SimpleToast.SHORT);
        GetSalaryList();
      },
      error => {
        setIsSavingBaseSalary(false);
        setIsSavingAdjustments(false);
        setIsSavingDeductions(false);
        SimpleToast.show(
          error?.data?.message || 'Failed to update salary',
          SimpleToast.SHORT,
        );
      },
      fail => {
        setIsSavingBaseSalary(false);
        setIsSavingAdjustments(false);
        setIsSavingDeductions(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const updatePermanentSalary = () => {
    if (!leaveType?.value) {
      SimpleToast.show('Please select a staff member first', SimpleToast.SHORT);
      return;
    }
    if (!baseSalary || isNaN(baseSalary)) {
      SimpleToast.show('Please enter a valid base salary', SimpleToast.SHORT);
      return;
    }

    setIsSavingBaseSalary(true);
    POST_WITH_TOKEN(
      `${UpdateStaff}/${leaveType?.value}`,
      { salary: baseSalary },
      res => {
        setIsSavingBaseSalary(false);
        setIsEditingBaseSalary(false);
        SimpleToast.show('Staff profile salary updated permanently!', SimpleToast.LONG);
      },
      err => {
        setIsSavingBaseSalary(false);
        SimpleToast.show(err?.data?.message || 'Failed to update permanent salary', SimpleToast.SHORT);
      }
    );
  };

  const handleAdvanceWithdraw = () => {
    if (!leaveType?.value) {
      SimpleToast.show('Please select a staff member first', SimpleToast.SHORT);
      return;
    }
    if (!advanceAmount || Number(advanceAmount) <= 0) {
      SimpleToast.show('Please enter a valid amount', SimpleToast.SHORT);
      return;
    }
    if (shouldDeductAdvance && !deductionMethod) {
      SimpleToast.show('Please select a deduction method', SimpleToast.SHORT);
      return;
    }

    // If UPI is selected, handle UPI payment flow
    if (advancePaymentMethod === 'UPI') {
      if (leaveType?.upi_id) {
        // UPI ID exists, directly open UPI app
        const upiId = leaveType.upi_id.trim();
        const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(leaveType?.label || 'Staff')}&am=${Number(advanceAmount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Advance payment - ${moment().format('DD MMM YYYY')}`)}`;
        Linking.openURL(upiUrl)
          .then(() => {
            // After opening UPI app, proceed with API call
            submitAdvancePayment();
          })
          .catch(() => {
            setAdvanceLoading(false);
            SimpleToast.show(
              'No UPI app found on this device. Please install GPay, PhonePe or any UPI app.',
              SimpleToast.LONG,
            );
          });
        return;
      }
      // No UPI ID found, show modal to enter one
      // Try to find the latest UPI ID from the leaveList just in case leaveType is stale
      const latestStaffData = leaveList.find(s => s.value === leaveType?.value);
      const latestUpiId = latestStaffData?.upi_id || leaveType?.upi_id || '';
      
      setUpiInput(latestUpiId);
      setShowUpiModal(true);
      setAdvanceLoading(false);
      return;
    }

    // For Cash, directly submit
    submitAdvancePayment();
  };

  const submitAdvancePayment = (forcedStatus = null) => {
    if (!leaveType?.value) {
      SimpleToast.show('Please select a staff member', SimpleToast.SHORT);
      return;
    }
    
    setAdvanceLoading(true);
    const body = {
      user_id: String(leaveType?.value),
      amount: Number(advanceAmount),
      should_deduct: shouldDeductAdvance,
      deduction_method: shouldDeductAdvance ? deductionMethod?.value : null,
      payment_mode: (advancePaymentMethod || 'cash').toLowerCase(),
      status: forcedStatus,
    };

    POST_WITH_TOKEN(
      AdvanceWithdraw,
      body,
      success => {
        setAdvanceLoading(false);
        const paidAdvance = Number(advanceAmount) || 0;
        setAdvanceAmount('');
        setShouldDeductAdvance(true);
        setDeductionMethod(null);
        setAdvancePaymentMethod('Cash');
        // Update advance locally so net salary recalculates immediately (only if deducting)
        if (shouldDeductAdvance) {
          setAdvance(prev => (Number(prev) || 0) + paidAdvance);
        }
        
        // Save advance payment to local storage for immediate UI update
        const staffName = leaveType?.label || 'Staff';
        const advanceRecord = {
          staff_id: leaveType?.value,
          staff_name: staffName,
          amount: paidAdvance,
          type: 'advance',
          date: new Date().toISOString(),
          should_deduct: shouldDeductAdvance,
          deduction_method: shouldDeductAdvance ? deductionMethod?.value : null,
          payment_mode: advancePaymentMethod,
        };
        
        savePaymentToLocal(advanceRecord).then(() => {
          loadAdvanceHistory(leaveType?.value);
        });
        
        SimpleToast.show(
          success?.message || 'Advance payment processed successfully!',
          SimpleToast.SHORT,
        );
        GetSalaryList();
      },
      error => {
        setAdvanceLoading(false);
        SimpleToast.show(
          error?.data?.message || 'Failed to process advance payment',
          SimpleToast.SHORT,
        );
      },
      () => {
        setAdvanceLoading(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  const paymentOptions = [
    // {
    //   value: 'Razorpay',
    //   label: 'Razorpay',
    //   icon: ImageConstant.upi,
    // },
    {
      value: 'Cash',
      label: LocalizedStrings.SalaryManagement.cash,
      icon: ImageConstant.cash,
    },
    {
      value: 'UPI',
      label: LocalizedStrings.SalaryManagement.upi,
      icon: ImageConstant.upi,
    },
    // {
    //   value: 'Bank Transfer',
    //   label: LocalizedStrings.SalaryManagement.bank_transfer,
    //   icon: ImageConstant.bankTransfer,
    // },
  ];

  const validateSalaryForm = () => {
    if (!leaveType?.value) {
      SimpleToast.show(
        LocalizedStrings.SalaryManagement.validation_select_staff,
        SimpleToast.SHORT,
      );
      return false;
    }

    if (!baseSalary || Number(baseSalary) <= 0) {
      SimpleToast.show(
        LocalizedStrings.SalaryManagement.validation_base_salary,
        SimpleToast.SHORT,
      );
      return false;
    }

    // Check if total net is negative or zero
    if (totalNet <= 0) {
      SimpleToast.show(
        'Net Salary cannot be zero or negative. Please check earnings and deductions.',
        SimpleToast.LONG,
      );
      return false;
    }

    return true;
  };

  const SalaryManagementPost = () => {
    if (!validateSalaryForm() || isSubmitting) {
      return;
    }

    // Check if salary was already paid this month for the selected staff
    const currentMonth = moment().format('YYYY-MM');
    const selectedStaffId = leaveType?.value;
    const alreadyPaid = listPastPayments?.find(payment => {
      const paymentMonth = moment(payment?.created_at).format('YYYY-MM');
      const isSameMonth = paymentMonth === currentMonth;
      const isPaid = payment?.status?.toLowerCase() === 'paid';
      const isSameStaff = payment?.staff_id === selectedStaffId || payment?.staff_member?.id === selectedStaffId;
      return isSameMonth && isPaid && isSameStaff;
    });

    if (alreadyPaid) {
      Alert.alert(
        LocalizedStrings.SalaryManagement.already_paid_title || 'Salary Already Paid',
        `Salary has already been marked as paid for ${moment().format('MMMM YYYY')}. Do you want to process another payment?`,
        [
          { text: 'Cancel', onPress: () => setIsSubmitting(false), style: 'cancel' },
          { text: 'Process Anyway', onPress: () => {
            // Re-check UPI if needed, or go straight to submit
            if (selectedMethod === 'UPI') {
              processUpiPayment();
            } else {
              submitSalaryPayment(null);
            }
          }}
        ]
      );
      return;
    }

    setIsSubmitting(true);

    // // If Razorpay is selected, process payment first
    // if (selectedMethod === 'Razorpay') {
    //   Alert.alert(
    //     'Confirm Payment',
    //     `You are about to pay ₹${totalNet.toFixed(2)} to ${leaveType?.label}. Do you want to proceed?`,
    //     [
    //       { text: 'Cancel', style: 'cancel' },
    //       { text: 'Pay Now', onPress: () => processRazorpayPayment() }
    //     ]
    //   );
    //   return;
    // }

    // If UPI is selected, check if staff already has a UPI ID
    if (selectedMethod === 'UPI') {
      processUpiPayment();
      return;
    }

    // For Cash, directly submit
    submitSalaryPayment(null);
  };

  const processUpiPayment = () => {
    if (leaveType?.upi_id) {
      // UPI ID exists, directly process payment without modal
      const upiId = leaveType.upi_id.trim();
      const amountToPay = getPayableAmount();
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(leaveType?.label || 'Staff')}&am=${amountToPay.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Salary payment for ${moment().format('MMMM YYYY')}`)}`;
      Linking.openURL(upiUrl)
        .then(() => {
          // Give the app a moment to settle after opening external app before hitting the API
          setTimeout(() => {
            submitSalaryPayment(null);
          }, 1000);
        })
        .catch(() => {
          setIsSubmitting(false);
          SimpleToast.show(
            'No UPI app found on this device. Please install GPay, PhonePe or any UPI app.',
            SimpleToast.LONG,
          );
        });
      return;
    }
    // No UPI ID found, show modal to enter one
    const latestStaffData = leaveList.find(s => s.value === leaveType?.value);
    const latestUpiId = latestStaffData?.upi_id || leaveType?.upi_id || '';
    
    setUpiInput(latestUpiId);
    setShowUpiModal(true);
    setIsSubmitting(false);
  };

  // const processRazorpayPayment = async () => {
  //   setIsSubmitting(true);
  //   try {
  //     const salaryDetails = {
  //       totalAmount: totalNet,
  //       baseSalary: baseSalary,
  //       bonus: bonus,
  //       overtime: overtime,
  //       advance: advance,
  //       month: moment().format('MMMM'),
  //       year: moment().format('YYYY'),
  //     };
  //     const staff = {
  //       id: leaveType?.value,
  //       name: leaveType?.label,
  //     };
  //     const result = await processSalaryPayment(salaryDetails, staff, userDetails);
  //     if (result.success) {
  //       submitSalaryPayment(result);
  //     } else {
  //       setIsSubmitting(false);
  //       if (result.code !== 0) {
  //         SimpleToast.show(result.description || 'Payment failed. Please try again.', SimpleToast.SHORT);
  //       }
  //     }
  //   } catch (error) {
  //     setIsSubmitting(false);
  //     SimpleToast.show('Payment failed. Please try again.', SimpleToast.SHORT);
  //   }
  // };

  const handleUpiModalSubmit = () => {
    const upiId = upiInput?.trim();
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiId || !upiRegex.test(upiId)) {
      SimpleToast.show('Please enter a valid UPI ID (e.g. name@bank)', SimpleToast.SHORT);
      return;
    }

    setUpiUpdating(true);

    // Save the UPI ID to the staff's profile in the backend
    const formData = new FormData();
    formData.append('upi_id', upiId);

    POST_FORM_DATA(
      `${UpdateStaff}/${leaveType?.value}`,
      formData,
      () => {
        // Successfully updated in backend
        setUpiUpdating(false);
        proceedWithUpiOpening(upiId);
      },
      (err) => {
        console.log('Failed to persist UPI ID:', err);
        setUpiUpdating(false);
        // Even if persistence fails, we can proceed with the payment for now
        proceedWithUpiOpening(upiId);
      }
    );
  };

  const proceedWithUpiOpening = (upiId) => {
    // Update local state
    setLeaveList(prev =>
      prev.map(item =>
        item.value === leaveType?.value ? { ...item, upi_id: upiId } : item,
      ),
    );
    if (leaveType) {
      setLeaveType(prev => ({ ...prev, upi_id: upiId }));
    }

    setShowUpiModal(false);

    const isAdvancePayment = paymentType?.value === 'advance';
    const amountToPay = getPayableAmount();
    const amount = isAdvancePayment ? Number(advanceAmount) : amountToPay;
    const transactionNote = isAdvancePayment 
      ? `Advance payment - ${moment().format('DD MMM YYYY')}`
      : `Salary payment for ${moment().format('MMMM YYYY')}`;

    // Standard NPCI UPI URI
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(leaveType?.label || 'Staff')}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

    Linking.openURL(upiUrl)
      .then(() => {
        // Delay to ensure the OS handles the app switch before showing the confirmation or hitting API
        // This prevents network "Try Again" errors during app switching
        setTimeout(() => {
          Alert.alert(
            'Payment Confirmation',
            'Please confirm if you have completed the payment in your UPI app.',
            [
              { 
                text: 'Cancel', 
                onPress: () => {
                  setIsSubmitting(false);
                  setAdvanceLoading(false);
                },
                style: 'cancel' 
              },
              { 
                text: 'Yes, Paid', 
                onPress: () => {
                  if (isAdvancePayment) {
                    submitAdvancePayment('paid');
                  } else {
                    submitSalaryPayment('paid');
                  }
                } 
              }
            ]
          );
        }, 1500);
      })
      .catch((err) => {
        console.log('Linking error:', err);
        setIsSubmitting(false);
        setAdvanceLoading(false);
        Alert.alert(
          'UPI Payment Failed',
          'Failed to open UPI app. Please install GPay, PhonePe or any UPI app. Alternatively, use Cash or Bank Transfer.',
        );
      });
  };

  const submitSalaryPayment = (paymentResult) => {
    const paymentMode = selectedMethod?.toLowerCase() || 'cash';
    const isPaid = paymentResult || paymentMode === 'cash';
    const body = {
      staff_id: leaveType?.value,
      houseowner_id: userDetails?.id,
      basic_salary: Number(baseSalary) || 0,
      performative_allowance: Number(bonus) || 0,
      over_time_allowance: Number(overtime) || 0,
      tax: Number(deduction) || 0,
      advance_payment: Number(advance) || 0,
      payment_mode: paymentMode,
      amount: getPayableAmount(),
      status: isPaid ? 'paid' : 'pending',
    };
    POST_WITH_TOKEN(
      `${SalaryManagementStaff}/${leaveType?.value}`,
      body,
      success => {
        setIsSubmitting(false);
        const savedData = success?.data;
        // Add new payment to the local list immediately
        if (savedData) {
          const newPayment = {
            payment_id: savedData.id || savedData.payment_id,
            staff_id: leaveType?.value,
            amount: savedData.net_salary || getPayableAmount(),
            net_salary: savedData.net_salary || getPayableAmount(),
            status: savedData.status || (isPaid ? 'paid' : 'pending'),
            payment_mode: savedData.payment_mode || selectedMethod,
            created_at: savedData.created_at || new Date().toISOString(),
            processed_by: { name: userDetails?.first_name ? `${userDetails.first_name} ${userDetails.last_name || ''}`.trim() : userDetails?.name || '' },
            staff_member: { name: leaveType?.label || '' },
            salary_breakdown: {
              base_salary: Number(baseSalary) || 0,
              performance_bonus: Number(bonus) || 0,
              overtime_pay: Number(overtime) || 0,
              tax_deduction: Number(deduction) || 0,
              advance_payment: Number(advance) || 0,
            },
          };
          setListPastPayments(prev => [newPayment, ...(prev || [])]);
          // Save salary payment to local storage
          const paymentRecord = {
            staff_id: leaveType?.value,
            staff_name: leaveType?.label,
            amount: savedData.net_salary || getPayableAmount(),
            type: 'payment',
            payment_mode: savedData.payment_mode || selectedMethod,
            status: savedData.status || (isPaid ? 'paid' : 'pending'),
            date: savedData.created_at || new Date().toISOString(),
          };
          savePaymentToLocal(paymentRecord);
        }
        SimpleToast.show(
          paymentResult
            ? 'Payment successful! Salary processed.'
            : LocalizedStrings.SalaryManagement.success_salary_processed,
          SimpleToast.SHORT,
        );
      },
      error => {
        setIsSubmitting(false);
        SimpleToast.show(error?.data?.message || 'Failed to process salary', SimpleToast.SHORT);
      },
      fail => {
        setIsSubmitting(false);
        SimpleToast.show('Network error. Please try again.', SimpleToast.SHORT);
      },
    );
  };

  // Filter payments for the selected staff only
  const filteredPayments = leaveType?.value
    ? (listPastPayments || []).filter(p =>
        p?.staff_id === leaveType.value ||
        p?.staff_member?.id === leaveType.value ||
        p?.staff_member?.name === leaveType.label
      )
    : listPastPayments || [];

  return (
    <CommanView>
      <HeaderForUser
        title={LocalizedStrings.SalaryManagement.title}
        source_logo={ImageConstant?.notification}
        Profile_icon={userDetails?.image}
        style_title={{ fontSize: 18 }}
        onPressRightIcon={() => navigation.navigate('Notification')}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Typography type={Font.Poppins_SemiBold} style={styles.sectionTitle}>
          {LocalizedStrings.SalaryManagement.staff_member}
        </Typography>

        <DropdownComponent
          title={LocalizedStrings.SalaryManagement.select_staff}
          placeholder="Select Staff Member"
          width={'100%'}
          style_dropdown={{ marginHorizontal: 0 }}
          selectedTextStyleNew={{
            marginLeft: 10,
            fontFamily: Font.Poppins_Regular,
          }}
          marginHorizontal={0}
          style_title={{
            textAlign: 'left',
            fontFamily: Font.Poppins_Regular,
          }}
          data={leaveList}
          value={leaveType?.value}
          onChange={item => {
            setLeaveType(item);
            setPaymentType(null);
            // Reset salary fields when switching staff
            setBaseSalary('');
            setProfileMonthlySalary(0);
            setBonus('');
            setOvertime('');
            setAdvance('');
            setDeduction(0);
            setTotalNet(0);
            setWorkedDays(0);
            // Fetch the selected staff's salary details
            fetchSalaryDetails(item?.value);
            loadAdvanceHistory(item?.value);
            fetchAttendance(item?.value);
          }}
        />

        {leaveType && (
          <>
            <Typography type={Font.Poppins_SemiBold} style={styles.sectionTitle}>
              Payment Type
            </Typography>
            <DropdownComponent
              title="Select Payment Type"
              placeholder="Select type"
              width={'100%'}
              style_dropdown={{ marginHorizontal: 0 }}
              selectedTextStyleNew={{
                marginLeft: 10,
                fontFamily: Font.Poppins_Regular,
              }}
              marginHorizontal={0}
              style_title={{
                textAlign: 'left',
                fontFamily: Font.Poppins_Regular,
              }}
              data={paymentTypeData}
              value={paymentType}
              onChange={item => {
                setPaymentType(item);
              }}
            />
          </>
        )}

        {leaveType && paymentType?.value === 'advance' && (
          <View style={{ marginTop: 15 }}>
            <Typography type={Font.Poppins_SemiBold} style={styles.sectionTitle}>
              Advance Payment
            </Typography>
            <View style={styles.section}>
              <Typography
                type={Font.Poppins_Regular}
                size={13}
                color="#666"
                style={{ marginBottom: 15 }}
              >
                Give advance payment to {leaveType?.label || 'staff member'}.
              </Typography>

              <Typography
                type={Font.Poppins_Medium}
                size={13}
                style={{ marginBottom: 5 }}
              >
                Amount
              </Typography>
              <TextInput
                style={styles.upiInput}
                placeholder="Enter amount (e.g. 5000)"
                placeholderTextColor="#999"
                value={advanceAmount}
                onChangeText={text => setAdvanceAmount(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />

              <View style={{ marginTop: 20, marginBottom: 10 }}>
                <Typography type={Font.Poppins_Medium} size={14} style={{ marginBottom: 10 }}>
                  Deduct from Salary?
                </Typography>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      shouldDeductAdvance && styles.toggleButtonActive,
                    ]}
                    onPress={() => {
                      setShouldDeductAdvance(true);
                      setDeductionMethod(null);
                    }}
                  >
                    <Typography
                      type={Font.Poppins_Medium}
                      size={13}
                      color={shouldDeductAdvance ? '#D98579' : '#666'}
                    >
                      Yes, Deduct
                    </Typography>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      !shouldDeductAdvance && styles.toggleButtonActive,
                    ]}
                    onPress={() => {
                      setShouldDeductAdvance(false);
                      setDeductionMethod(null);
                    }}
                  >
                    <Typography
                      type={Font.Poppins_Medium}
                      size={13}
                      color={!shouldDeductAdvance ? '#D98579' : '#666'}
                    >
                      No, Don't Deduct
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>

              {shouldDeductAdvance && (
                <View style={{ marginTop: 10 }}>
                  <Typography type={Font.Poppins_Medium} size={14} style={{ marginBottom: 5 }}>
                    Deduction Method
                  </Typography>
                  <DropdownComponent
                    title="Select Deduction Method"
                    placeholder="Choose how to deduct"
                    width={'100%'}
                    style_dropdown={{ marginHorizontal: 0 }}
                    selectedTextStyleNew={{
                      marginLeft: 10,
                      fontFamily: Font.Poppins_Regular,
                    }}
                    marginHorizontal={0}
                    style_title={{
                      textAlign: 'left',
                      fontFamily: Font.Poppins_Regular,
                    }}
                    data={deductionMethodData}
                    value={deductionMethod}
                    onChange={item => setDeductionMethod(item)}
                  />
                </View>
              )}

              <Typography type={Font.Poppins_Medium} size={14} style={{ marginTop: 20, marginBottom: 10 }}>
                Payment Method
              </Typography>
              <View style={styles.paymentMethodsVertical}>
                {paymentOptions.map(method => (
                  <TouchableOpacity
                    key={method.value}
                    style={[
                      styles.paymentBoxVertical,
                      advancePaymentMethod === method.value && styles.selectedBoxVertical,
                    ]}
                    onPress={() => setAdvancePaymentMethod(method.value)}
                  >
                    <Image
                      source={method.icon}
                      style={styles.paymentIconVertical}
                      resizeMode="contain"
                    />
                    <Typography
                      type={Font.Poppins_Regular}
                      style={{
                        fontSize: 14,
                        marginLeft: 12,
                        flex: 1,
                      }}
                    >
                      {method.label}
                    </Typography>
                    {advancePaymentMethod === method.value && (
                      <View style={styles.checkmark}>
                        <Typography type={Font.Poppins_Bold} style={{ color: '#fff', fontSize: 12 }}>✓</Typography>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title={advanceLoading ? 'Processing...' : 'Send Advance'}
                onPress={handleAdvanceWithdraw}
                main_style={{ width: '100%', marginTop: 15 }}
                loader={advanceLoading}
                disabled={advanceLoading}
              />
            </View>

            <View style={[styles.section, { marginTop: 15 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Typography type={Font.Poppins_SemiBold} size={14}>
                  Advance History
                </Typography>
                <Typography type={Font.Poppins_SemiBold} size={14} color="#D98579">
                  Total: {'\u20B9'}{Number(advance) || 0}
                </Typography>
              </View>

              {advanceHistory.length > 0 ? (
                advanceHistory.map((item, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderBottomWidth: index < advanceHistory.length - 1 ? 1 : 0,
                      borderColor: '#EBEBEA',
                    }}
                  >
                    <View>
                      <Typography type={Font.Poppins_Medium} size={13} color="#333">
                        {'\u20B9'}{item.amount}
                      </Typography>
                      <Typography type={Font.Poppins_Regular} size={11} color="#999">
                        {moment(item.date).format('DD MMM YYYY, hh:mm A')}
                      </Typography>
                      <Typography type={Font.Poppins_Regular} size={10} color="#666">
                        {item.payment_mode ? (item.payment_mode.toLowerCase() === 'upi' ? 'UPI' : 'Cash') : 'Cash'}
                      </Typography>
                      {item.deduction_method && (
                        <Typography type={Font.Poppins_Regular} size={10} color="#666">
                          {item.deduction_method === 'monthly' ? 'Monthly Deduction' : 
                           item.deduction_method === 'one_time' ? 'One-Time Deduction' : 
                           item.deduction_method === 'installments' ? 'Installments' : 
                           item.should_deduct ? 'Will be deducted' : 'No deduction'}
                        </Typography>
                      )}
                    </View>
                    <View style={{
                      backgroundColor: '#FFF5EE',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <Typography type={Font.Poppins_Medium} size={11} color="#D98579">
                        Advance
                      </Typography>
                    </View>
                  </View>
                ))
              ) : (
                <Typography type={Font.Poppins_Regular} size={12} color="#999" style={{ textAlign: 'center', paddingVertical: 10 }}>
                  No advance payments yet.
                </Typography>
              )}

              {shouldDeductAdvance && (
                <Typography type={Font.Poppins_Regular} size={11} color="#999" style={{ marginTop: 10 }}>
                  This amount will be deducted from the monthly salary.
                </Typography>
              )}
            </View>
          </View>
        )}

        {leaveType && paymentType?.value === 'payment' && (
          <View style={{}}>
            <Typography
              type={Font.Poppins_SemiBold}
              style={styles.sectionTitle}
            >
              {LocalizedStrings.SalaryManagement.salary_slip_breakdown}
            </Typography>
            <View style={styles.section}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  type={Font.Poppins_SemiBold}
                  style={styles.subTitle}
                >
                  {LocalizedStrings.SalaryManagement.base_salary}
                </Typography>
              </View>
              <View style={{ marginBottom: 10, padding: 10, backgroundColor: '#F0FDF4', borderRadius: 8, borderWidth: 1, borderColor: '#DCFCE7' }}>
                 <Typography type={Font.Poppins_Medium} size={13} color="#166534">
                    Worked Days: {workedDays} / {totalDaysInMonth} Days
                 </Typography>
                 {profileMonthlySalary > 0 && (
                   <Typography type={Font.Poppins_Regular} size={11} color="#15803d" style={{ marginTop: 4 }}>
                     Monthly base salary (from profile): ₹{profileMonthlySalary.toFixed(2)}
                   </Typography>
                 )}
              </View>
              <View style={styles.salaryRow}>
                <Typography type={Font.Poppins_Regular} style={styles.subText}>
                  {LocalizedStrings.SalaryManagement.monthly_salary} ({moment().format('MMMM-YYYY')})
                </Typography>
                {isEditingBaseSalary ? (
                  <TextInput
                    style={[styles.amountInput, styles.amountPositive]}
                    keyboardType="numeric"
                    value={getSanitizedValue(baseSalary)}
                    onChangeText={handleAmountChange(setBaseSalary)}
                    placeholder="0"
                    placeholderTextColor="#333"
                  />
                ) : (
                  <Typography
                    type={Font.Poppins_SemiBold}
                    style={styles.amountPositive}
                  >
                    {getSanitizedValue(baseSalary) || '0'}
                  </Typography>
                )}
              </View>
              {isEditingBaseSalary && (
                <View>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveSalaryData}
                    disabled={isSavingBaseSalary}
                  >
                    <Typography
                      type={Font.Poppins_SemiBold}
                      style={styles.saveButtonText}
                    >
                      {isSavingBaseSalary ? 'Saving...' : 'Save'}
                    </Typography>
                  </TouchableOpacity>

                </View>
              )}
            </View>
            <View style={styles.section}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  type={Font.Poppins_SemiBold}
                  style={styles.subTitle}
                >
                  {LocalizedStrings.SalaryManagement.adjustments}
                </Typography>
                <TouchableOpacity
                  onPress={() => setIsEditingAdjustments(!isEditingAdjustments)}
                >
                  <Image
                    source={ImageConstant.pencle}
                    style={styles.pencle}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.salaryRow}>
                <Typography type={Font.Poppins_Regular} style={styles.label}>
                  {LocalizedStrings.SalaryManagement.performance_bonus}
                </Typography>
                {isEditingAdjustments ? (
                  <TextInput
                    style={[styles.amountInput, styles.amountPositive]}
                    keyboardType="numeric"
                    value={getSanitizedValue(bonus)}
                    onChangeText={handleAmountChange(setBonus)}
                    placeholder="0"
                    placeholderTextColor="#333"
                  />
                ) : (
                  <Typography
                    type={Font.Poppins_SemiBold}
                    style={styles.amountPositive}
                  >
                    {getSanitizedValue(bonus) || '0'}
                  </Typography>
                )}
              </View>

              <View style={styles.salaryRow}>
                <Typography type={Font.Poppins_Regular} style={styles.label}>
                  {LocalizedStrings.SalaryManagement.overtime_pay}
                </Typography>
                {isEditingAdjustments ? (
                  <TextInput
                    style={[styles.amountInput, styles.amountPositive]}
                    keyboardType="numeric"
                    value={getSanitizedValue(overtime)}
                    onChangeText={handleAmountChange(setOvertime)}
                    placeholder="0"
                    placeholderTextColor="#333"
                  />
                ) : (
                  <Typography
                    type={Font.Poppins_SemiBold}
                    style={styles.amountPositive}
                  >
                    {getSanitizedValue(overtime) || '0'}
                  </Typography>
                )}
              </View>

              {isEditingAdjustments && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveSalaryData}
                  disabled={isSavingAdjustments}
                >
                  <Typography
                    type={Font.Poppins_SemiBold}
                    style={styles.saveButtonText}
                  >
                    {isSavingAdjustments ? 'Saving...' : 'Save'}
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  type={Font.Poppins_SemiBold}
                  style={styles.subTitle}
                >
                  Deductions
                </Typography>
                <TouchableOpacity
                  onPress={() => setIsEditingDeductions(!isEditingDeductions)}
                >
                  <Image
                    source={ImageConstant.pencle}
                    style={styles.pencle}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.salaryRow}>
                <View style={styles.amountLabelWrap}>
                  <Typography type={Font.Poppins_Regular} style={styles.label}>
                    Advance Katauti
                  </Typography>
                  <Typography type={Font.Poppins_Regular} style={styles.amountHelpText}>
                    Deduct taken advance
                  </Typography>
                </View>
                {isEditingDeductions ? (
                  <TextInput
                    style={[styles.amountInput, styles.deductionInput]}
                    keyboardType="numeric"
                    value={getSanitizedValue(advance)}
                    onChangeText={handleAmountChange(setAdvance)}
                    placeholder="0"
                    placeholderTextColor="#D98579"
                  />
                ) : (
                  <Typography
                    type={Font.Poppins_SemiBold}
                    style={{ color: '#D98579' }}
                  >
                    {Number(advance) > 0 ? `-${getSanitizedValue(advance)}` : '0'}
                  </Typography>
                )}
              </View>

              <View style={styles.salaryRow}>
                <View style={styles.amountLabelWrap}>
                  <Typography type={Font.Poppins_Regular} style={styles.label}>
                    Other Deduction
                  </Typography>
                  <Typography type={Font.Poppins_Regular} style={styles.amountHelpText}>
                    Tax or manual deduction
                  </Typography>
                </View>
                {isEditingDeductions ? (
                  <TextInput
                    style={[styles.amountInput, styles.deductionInput]}
                    keyboardType="numeric"
                    value={getSanitizedValue(deduction)}
                    onChangeText={handleAmountChange(setDeduction)}
                    placeholder="0"
                    placeholderTextColor="#D98579"
                  />
                ) : (
                  <Typography
                    type={Font.Poppins_SemiBold}
                    style={{ color: '#D98579' }}
                  >
                    {Number(deduction) > 0 ? `-${getSanitizedValue(deduction)}` : '0'}
                  </Typography>
                )}
              </View>

              {isEditingDeductions && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveSalaryData}
                  disabled={isSavingDeductions}
                >
                  <Typography
                    type={Font.Poppins_SemiBold}
                    style={styles.saveButtonText}
                  >
                    {isSavingDeductions ? 'Saving...' : 'Save'}
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.section]}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  type={Font.Poppins_SemiBold}
                  style={[styles.netLabel, { paddingVertical: 16 }]}
                >
                  {LocalizedStrings.SalaryManagement.net_salary}
                </Typography>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Typography type={Font.Poppins_Bold} style={styles.netValue}>₹</Typography>
                  <TextInput
                    style={[styles.netValue, { borderBottomWidth: 1, borderColor: '#ccc', minWidth: 80, textAlign: 'right' }]}
                    keyboardType="numeric"
                    value={customAmount}
                    onChangeText={(val) => setCustomAmount(val)}
                  />
                </View>
              </View>
            </View>

            {totalPaidThisMonth > 0 && (
              <View style={[styles.section, { backgroundColor: '#F0F7FF', borderColor: '#379AE6', marginTop: 5 }]}>
                <View style={styles.salaryRow}>
                  <Typography type={Font.Poppins_Medium} size={13} color="#333">Total Paid this Month:</Typography>
                  <Typography type={Font.Poppins_Bold} size={14} color="#379AE6">₹{totalPaidThisMonth.toLocaleString('en-IN')}</Typography>
                </View>
                <View style={[styles.salaryRow, { marginTop: 8 }]}>
                  <Typography type={Font.Poppins_Medium} size={13} color="#333">Remaining Balance:</Typography>
                  <Typography type={Font.Poppins_Bold} size={15} color={remainingBalance > 0 ? '#D98579' : '#16A34A'}>
                    ₹{remainingBalance.toLocaleString('en-IN')}
                  </Typography>
                </View>
                {remainingBalance > 0 && (
                  <TouchableOpacity 
                    style={{ alignSelf: 'flex-end', marginTop: 10 }}
                    onPress={() => setCustomAmount(String(remainingBalance))}
                  >
                    <Typography color="#379AE6" size={12} type={Font.Poppins_SemiBold}>Use Remaining Balance</Typography>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Typography
              type={Font.Poppins_SemiBold}
              style={styles.sectionTitle}
            >
              {LocalizedStrings.SalaryManagement.select_payment_method}
            </Typography>
            <View style={styles.section}>
              <View style={styles.paymentMethodsVertical}>
                {paymentOptions.map(method => (
                  <TouchableOpacity
                    key={method.value}
                    style={[
                      styles.paymentBoxVertical,
                      selectedMethod === method.value && styles.selectedBoxVertical,
                    ]}
                    onPress={() => setSelectedMethod(method.value)}
                  >
                    <Image
                      source={method.icon}
                      style={styles.paymentIconVertical}
                      resizeMode="contain"
                    />
                    <Typography
                      type={Font.Poppins_Regular}
                      style={{
                        fontSize: 14,
                        marginLeft: 12,
                        flex: 1,
                      }}
                    >
                      {method.label}
                    </Typography>
                    {selectedMethod === method.value && (
                      <View style={styles.checkmark}>
                        <Typography type={Font.Poppins_Bold} style={{ color: '#fff', fontSize: 12 }}>✓</Typography>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {canProcessAnyway && (
              <View style={{ backgroundColor: '#FFF9C4', padding: 12, borderRadius: 8, marginTop: 10, borderLeftWidth: 4, borderLeftColor: '#FBC02D', marginBottom: 10 }}>
                <Typography type={Font.Poppins_Medium} size={12} color="#5D4037">
                  Note: You have already paid ₹{totalPaidThisMonth.toLocaleString('en-IN')} to this staff this month. 
                  {remainingBalance > 0 
                    ? ` There is a remaining balance of ₹${remainingBalance.toLocaleString('en-IN')}.` 
                    : " The full salary has been paid."} 
                  You can still process this as an additional payment if needed.
                </Typography>
              </View>
            )}

            <View style={styles.bottomButton}>
              <Button
                title={isSubmitting ? 'Processing...' : LocalizedStrings.SalaryManagement.process_payment}
                main_style={styles.buttonStyle}
                onPress={SalaryManagementPost}
                loader={isSubmitting}
              />
            </View>

            {/* Advance Management quick-link */}
            <TouchableOpacity
              style={styles.advanceLinkCard}
              onPress={() => navigation.navigate('AdvanceManagement')}
              activeOpacity={0.8}
            >
              <Typography type={Font.Poppins_SemiBold} size={14}>💰 Manage Staff Advances</Typography>
              <Typography type={Font.Poppins_Regular} size={12} color="#D98579">View & track → </Typography>
            </TouchableOpacity>

            <View style={{ marginTop: 20 }}>
                <View style={styles.rowBetween}>
                  <Typography
                    type={Font.Poppins_SemiBold}
                    style={styles.sectionTitle}
                  >
                    {LocalizedStrings.SalaryManagement.recent_payments}
                  </Typography>
                  {filteredPayments.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('RecentSalaryList');
                      }}
                    >
                      <Typography
                        type={Font.Poppins_Regular}
                        style={{ color: '#D98579', fontSize: 12 }}
                      >
                        {LocalizedStrings.SalaryManagement.view_all}
                      </Typography>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.section}>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.slice(0, 3).map((item, index) => {
                    console.log('Salary list item --->', JSON.stringify(item));
                    const itemId = item?.payment_id || item?.id || item?.salary_id;
                    return (
                    <TouchableOpacity
                      key={itemId || index}
                      style={styles.paymentRow}
                      activeOpacity={item.status?.toLowerCase() === 'pending' ? 0.6 : 1}
                      onPress={() => {
                        // The whole row no longer triggers the alert. 
                        // The confirm button does.
                      }}
                    >
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Image
                          source={ImageConstant.lines}
                          style={styles.paymentHistoryIcon}
                          resizeMode="contain"
                        />

                        <View style={{ marginLeft: 8 }}>
                          <Typography
                            type={Font.Poppins_Regular}
                            style={styles.paymentDate}
                          >
                            {moment(item?.created_at).format('DD-MM-YYYY')}
                          </Typography>
                          <Typography
                            type={Font.Poppins_Regular}
                            style={styles.paymentAmount}
                          >
                            ₹{(item.net_salary ?? item.amount ?? 0).toFixed(2)}
                          </Typography>
                          <Typography
                            type={Font.Poppins_Regular}
                            style={styles.paymentStaff}
                          >
                            {`${LocalizedStrings.SalaryManagement.status_paid} to ${item.staff_name || item.staff_member?.name || 'Staff'}`}
                          </Typography>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Typography
                          type={Font.Poppins_SemiBold}
                          style={[
                            styles.paymentStatus,
                            {
                              color:
                                item.status?.toLowerCase() === 'paid' ? 'green' : 'orange',
                            },
                          ]}
                        >
                          {item.status}
                        </Typography>
                        {item.status?.toLowerCase() === 'pending' && (
                          <TouchableOpacity
                            style={{ backgroundColor: '#D98579', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginTop: 4 }}
                            onPress={(e) => {
                              e.stopPropagation && e.stopPropagation();
                              setPendingPaymentToConfirm(item);
                            }}
                          >
                            <Typography
                              type={Font.Poppins_Regular}
                              style={{ fontSize: 10, color: '#FFF' }}
                            >
                              Confirm
                            </Typography>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.downloadButton}
                          onPress={(e) => {
                            e.stopPropagation && e.stopPropagation();
                            setReceiptPayment(item);
                          }}
                        >
                          <Image
                            source={ImageConstant.fileText}
                            style={styles.downloadIcon}
                            resizeMode="contain"
                          />
                          <Typography
                            type={Font.Poppins_Regular}
                            style={styles.downloadText}
                          >
                            Receipt
                          </Typography>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                    );
                  })
                  ) : (
                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                       <Typography size={13} color="#999">No recent payments found for this staff.</Typography>
                    </View>
                  )}
                </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Confirm Payment Modal */}
      <Modal
        transparent={true}
        visible={!!pendingPaymentToConfirm}
        animationType="fade"
        onRequestClose={() => {
          setPendingPaymentToConfirm(null);
          setConfirmReceiptFile(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.upiModalContent}>
            <View style={styles.upiModalHeader}>
              <Typography type={Font.Poppins_SemiBold} size={18}>
                Confirm Payment
              </Typography>
              <TouchableOpacity
                onPress={() => {
                  setPendingPaymentToConfirm(null);
                  setConfirmReceiptFile(null);
                }}
              >
                <Image source={ImageConstant.close} style={{ width: 16, height: 16, tintColor: '#000' }} />
              </TouchableOpacity>
            </View>

            <Typography type={Font.Poppins_Regular} style={{ marginBottom: 20 }}>
              Upload an optional payment receipt to confirm this payment.
            </Typography>

            <TouchableOpacity
              style={styles.uploadContainer}
              onPress={() => {
                launchImageLibrary(
                  { mediaType: 'photo', quality: 0.8 },
                  (response) => {
                    if (response.didCancel) {
                      console.log('User cancelled image picker');
                    } else if (response.errorMessage) {
                      SimpleToast.show('ImagePicker Error: ' + response.errorMessage, SimpleToast.SHORT);
                    } else if (response.assets && response.assets.length > 0) {
                      setConfirmReceiptFile(response.assets[0]);
                    }
                  }
                );
              }}
            >
              <Typography type={Font.Poppins_Regular} color="#666">
                {confirmReceiptFile ? confirmReceiptFile.fileName || 'Receipt Selected' : 'Tap to Upload Payment Receipt (Optional)'}
              </Typography>
            </TouchableOpacity>

            <Button
              title="Save & Confirm"
              onPress={() => {
                if (pendingPaymentToConfirm) {
                  const itemId = pendingPaymentToConfirm.payment_id || pendingPaymentToConfirm.id || pendingPaymentToConfirm.salary_id;
                  markAsPaid(itemId, confirmReceiptFile);
                }
              }}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* Payment Receipt Modal */}
      <PaymentReceipt
        visible={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        paymentData={receiptPayment}
        userDetails={userDetails}
      />

      {/* Advance Payment Modal */}
      <Modal
        transparent={true}
        visible={showAdvanceModal}
        animationType="fade"
        onRequestClose={() => setShowAdvanceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAdvanceModal(false)}
        >
          <TouchableOpacity
            style={styles.upiModalContent}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.upiModalHeader}>
              <Typography type={Font.Poppins_SemiBold} size={18}>
                Advance Payment
              </Typography>
              <TouchableOpacity onPress={() => setShowAdvanceModal(false)}>
                <Image
                  source={ImageConstant?.close}
                  style={{ width: 20, height: 20 }}
                />
              </TouchableOpacity>
            </View>

            <Typography
              type={Font.Poppins_Regular}
              size={13}
              color="#666"
              style={{ marginBottom: 15 }}
            >
              Give advance payment to {leaveType?.label || 'staff member'}. This will be deducted from their salary.
            </Typography>

            <Typography
              type={Font.Poppins_Medium}
              size={13}
              style={{ marginBottom: 5 }}
            >
              Amount
            </Typography>
            <TextInput
              style={styles.upiInput}
              placeholder="Enter amount (e.g. 5000)"
              placeholderTextColor="#999"
              value={advanceAmount}
              onChangeText={text => setAdvanceAmount(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />

            <Button
              title={advanceLoading ? 'Processing...' : 'Send Advance'}
              onPress={handleAdvanceWithdraw}
              main_style={{ width: '100%', marginTop: 15 }}
              loader={advanceLoading}
              disabled={advanceLoading}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* UPI ID Modal */}
      <Modal
        transparent={true}
        visible={showUpiModal}
        animationType="fade"
        onRequestClose={() => setShowUpiModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUpiModal(false)}
        >
          <TouchableOpacity
            style={styles.upiModalContent}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.upiModalHeader}>
              <Typography type={Font.Poppins_SemiBold} size={18}>
                {leaveType?.upi_id ? 'Confirm UPI ID' : 'Enter UPI ID'}
              </Typography>
              <TouchableOpacity onPress={() => setShowUpiModal(false)}>
                <Image
                  source={ImageConstant?.close}
                  style={{ width: 20, height: 20 }}
                />
              </TouchableOpacity>
            </View>

            <Typography
              type={Font.Poppins_Regular}
              size={13}
              color="#666"
              style={{ marginBottom: 15 }}
            >
              {leaveType?.upi_id
                ? `Current UPI ID for ${leaveType?.label}. You can update it below.`
                : `No UPI ID found for ${leaveType?.label}. Please enter UPI ID to proceed.`}
            </Typography>

            <Typography
              type={Font.Poppins_Medium}
              size={13}
              style={{ marginBottom: 5 }}
            >
              UPI ID
            </Typography>
            <TextInput
              style={styles.upiInput}
              placeholder="e.g. name@ybl, number@paytm"
              placeholderTextColor="#999"
              value={upiInput}
              onChangeText={setUpiInput}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Typography
              type={Font.Poppins_Regular}
              size={12}
              color="#888"
              style={{ marginTop: 5, marginBottom: 15 }}
            >
              Amount: ₹{paymentType?.value === 'advance' ? Number(advanceAmount).toFixed(2) : totalNet.toFixed(2)}
            </Typography>

            <Button
              title={upiUpdating ? 'Updating...' : (paymentType?.value === 'advance' ? 'Pay Advance via UPI' : 'Pay via UPI')}
              onPress={handleUpiModalSubmit}
              main_style={{ width: '100%' }}
              loader={upiUpdating}
              disabled={upiUpdating}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </CommanView>
  );
};

export default StaffManagement;

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 1,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#EBEBEA',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  subTitle: {
    fontSize: 16.5,
    marginTop: 10,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
    gap: 12,
  },
  amountLabelWrap: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    fontSize: 13,
    color: '#333',
    marginTop: 5,
  },
  amountHelpText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  subText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    marginTop: 10,
  },
  value: {
    fontSize: 14,
  },
  amountInput: {
    minWidth: 80,
    width: 110,
    textAlign: 'right',
    fontSize: 14,
    borderBottomWidth: 1,
    borderColor: '#EBEBEA',
    paddingVertical: 2,
    fontFamily: Font.Poppins_SemiBold,
  },
  deductionInput: {
    color: '#D98579',
  },
  amountPositive: {
    color: '#333',
  },
  amountNegative: {
    color: '#D98579',
  },
  netLabel: {
    fontSize: 15,
  },
  netValue: {
    fontSize: 18,
    color: '#D98579',
    marginTop: 5,
  },
  paymentIcon: {
    width: 30,
    height: 30,
    alignSelf: 'center',
    marginBottom: 4,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  paymentMethodsVertical: {
    flexDirection: 'column',
    marginTop: 10,
    gap: 12,
  },
  paymentBox: {
    width: '48%',
    height: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentBoxVertical: {
    width: '100%',
    height: 60,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  selectedBox: {
    borderColor: '#ff6600',
    backgroundColor: '#fff5ee',
  },
  selectedBoxVertical: {
    borderColor: '#D98579',
    backgroundColor: '#FFF5EE',
    borderWidth: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D98579',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentIconVertical: {
    width: 28,
    height: 28,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: 700,
    marginVertical: 3,
  },
  paymentStaff: {
    fontSize: 12,
    color: '#555',
  },
  paymentDate: {
    fontSize: 12,
    color: '#888',
    textAlign: 'left',
  },
  paymentStatus: {
    fontSize: 12,
    textAlign: 'right',
  },

  buttonStyle: {
    width: '100%',
  },
  bottomButton: {
    alignItems: 'center',
    marginVertical: 10,
  },
  advanceLinkCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF4F2',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 8,
  },
  paymentHistoryIcon: {
    width: 20,
    height: 20,
    tintColor: '#555',
  },
  pencle: {
    tintColor: '#DE3B40',
    width: 40,
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upiModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  upiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  upiInput: {
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Font.Poppins_Regular,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  advanceButton: {
    backgroundColor: '#FFF5EE',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#D98579',
  },
  advanceButtonText: {
    color: '#D98579',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#D98579',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#FFF5EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D98579',
  },
  downloadIcon: {
    width: 14,
    height: 14,
    tintColor: '#D98579',
    marginRight: 4,
  },
  downloadText: {
    fontSize: 10,
    color: '#D98579',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
  },
  toggleButtonActive: {
    borderColor: '#D98579',
    backgroundColor: '#FFF5EE',
  },
  uploadContainer: {
    borderWidth: 1,
    borderColor: '#EBEBEA',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
});
