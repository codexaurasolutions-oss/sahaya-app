const inactiveStatuses = new Set([
  'cancelled',
  'canceled',
  'expired',
  'failed',
  'inactive',
  'refunded',
]);

const parsePrice = value => {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

export const getSubscriptionPrice = subscription => {
  const candidates = [
    subscription?.subscription?.price,
    subscription?.plan?.price,
    subscription?.subscription_price,
    subscription?.price,
    subscription?.amount,
  ];

  for (const candidate of candidates) {
    const price = parsePrice(candidate);
    if (price !== null) {
      return price;
    }
  }

  return 0;
};

export const isFreeSubscriptionPlan = subscription =>
  getSubscriptionPrice(subscription) <= 0;

export const isSubscriptionActive = subscription => {
  if (!subscription) {
    return false;
  }

  const explicitActive = subscription.is_active;
  if (
    explicitActive === false ||
    explicitActive === 0 ||
    explicitActive === '0' ||
    String(explicitActive).toLowerCase() === 'false'
  ) {
    return false;
  }

  const status = String(
    subscription.status ||
      subscription.subscription_status ||
      subscription.payment_status ||
      '',
  ).toLowerCase();
  if (inactiveStatuses.has(status)) {
    return false;
  }

  const expiryValue =
    subscription.end_date ||
    subscription.valid_until ||
    subscription.expires_at ||
    subscription.expiry_date;
  if (expiryValue) {
    const expiryTime = new Date(expiryValue).getTime();
    if (Number.isFinite(expiryTime) && expiryTime <= Date.now()) {
      return false;
    }
  }

  return true;
};

export const hasActivePaidSubscription = subscription =>
  isSubscriptionActive(subscription) && getSubscriptionPrice(subscription) > 0;

export const getSubscriptionPlanId = subscription =>
  subscription?.subscription_id ||
  subscription?.subscription?.id ||
  subscription?.plan_id ||
  subscription?.plan?.id ||
  subscription?.id ||
  null;
