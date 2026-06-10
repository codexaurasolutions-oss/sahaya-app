/**
 * Razorpay Payment Integration
 *
 * Wrapper around react-native-razorpay for initiating payments.
 */
import RazorpayCheckout from 'react-native-razorpay';

const RAZORPAY_KEY = 'rzp_test_placeholder'; // Replace with actual key

/**
 * Initiate a Razorpay payment checkout.
 *
 * @param {Object} options
 * @param {number} options.amount      - Amount in paise (e.g. 50000 = ₹500)
 * @param {string} options.currency    - Currency code (default: INR)
 * @param {string} options.orderId     - Razorpay order_id from backend
 * @param {string} options.description - Payment description
 * @param {Object} options.prefill     - { name, email, contact }
 * @returns {Promise<{success: boolean, paymentId?: string, orderId?: string, signature?: string, code?: number, description?: string}>}
 */
export const initiatePayment = async ({
  amount,
  currency = 'INR',
  orderId,
  description = 'Payment',
  prefill = {},
}) => {
  try {
    const options = {
      description,
      image: '', // optional logo URL
      currency,
      key: RAZORPAY_KEY,
      amount: String(amount),
      name: 'Sahayya',
      order_id: orderId,
      prefill: {
        email: prefill.email || '',
        contact: prefill.contact || '',
        name: prefill.name || '',
      },
      theme: { color: '#D98579' },
    };

    const result = await RazorpayCheckout.open(options);

    return {
      success: true,
      paymentId: result.razorpay_payment_id,
      orderId: result.razorpay_order_id,
      signature: result.razorpay_signature,
    };
  } catch (error) {
    return {
      success: false,
      code: error?.code ?? -1,
      description: error?.description || error?.message || 'Payment failed',
    };
  }
};

export default { initiatePayment };
