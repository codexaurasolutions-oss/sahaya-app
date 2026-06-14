import SimpleToast from 'react-native-simple-toast';
import { BASE_URL } from './env';
import { createRef } from 'react';
import axios from 'axios';
import { store } from '../Redux/store';

export const toastRef = createRef();
const errorHandling = {
  validateStatus: function (status) {
    return status >= 200 && status <= 503; // accept all including 5xx so they reach .then()
  },
};

export const API = BASE_URL;
export const token = store.getState().Token;
export const statusMessage = {
  400: 'Invalid request format.',
  401: 'Invalid API Key.',
  403: 'The request is forbidden.',
  404: 'The specified resource could not be found.',
  405: 'You tried to access the resource with an invalid method.',
  500: 'We had a problem with our server. Try again later.',
  503: "We're temporarily offline for maintenance. Please try again later.",
};

const responseBack = (data, msg, status) => {
  return {
    data,
    msg,
    status,
  };
};

export const POST_FORM_DATA = async (
  route,
  body,
  onSuccess = () => { },
  onError = () => { },
  onFail = () => {
    SimpleToast.show('Check Network, Try Again.', SimpleToast.SHORT);
  },
  Content = 'multipart/form-data',
) => {
  try {
    await axios({
      method: 'post',
      url: `${API}${route}`,
      data: body,
      headers: {
        'Content-Type': Content,
        authorization: `Bearer ${store.getState().Token}`,
        Accept: 'application/json',
      },
      ...errorHandling,
    })
      .then(res => {
        if (res?.status == 200 || res?.status == 201) {
          onSuccess(res?.data);
        } else {
          // Handle different error status codes
          if (res?.status == 400 || res?.status == 422) {
            onError(res?.data || res);
          } else if (res?.status >= 500) {
            // Server errors — pass message to onError so screens show actual reason
            onError(res?.data || { error: 'Server error. Please try again.' });
          } else {
            // Other errors (401, 403, 404, etc.)
            onError(res?.data || res);
          }
        }
      })
      .catch(err => {
        console.error('POST_FORM_DATA Catch Error:', err);
        console.error('Error Details:', {
          message: err?.message,
          response: err?.response?.data,
          status: err?.response?.status,
          code: err?.code,
        });

        // Check if it's a network error or server error
        if (err?.code === 'NETWORK_ERROR' || err?.message === 'Network Error') {
          onFail(err);
        } else if (err?.response) {
          // Server responded with error status
          onError(err?.response?.data || err?.response || err);
        } else {
          // Other axios errors
          onError(err);
        }
      });
  } catch (error) {
    console.error('POST_FORM_DATA Try-Catch Error:', error);
    onFail({ data: null, msg: 'Network Error', status: 'error', error });
    return { data: null, msg: 'Network Error', status: 'error' };
  }
};

export const POST = async (
  route,
  body = {},
  onSuccess = () => { },
  onError = () => { },
  onFail = () => {
    SimpleToast.show('Check Network, Try Again.', SimpleToast.SHORT);
  },
) => {
  try {
    axios({
      method: 'post',
      url: `${API}${route}`,
      data: body,
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
      validateStatus: function (status) {
        return status >= 200 && status <= 503; // accept all so they reach .then()
      },
    })
      .then(res => {
        if (res?.status == 200 || res?.status == 201) {
          if (!!res?.data) {
            onSuccess(res?.data);
          } else {
            console.log('POST Error - no data in response');
            onError(res?.data);
          }
        } else {
          // Pass res.data (the actual JSON body) so callers can extract the error message
          console.log('POST Error - status:', res?.status, res?.data);
          onError(res?.data || { error: 'Server error. Please try again.' });
        }
      })
      .catch(err => {
        console.error(err);
        onFail(err);
      });
  } catch (error) {
    onFail({ data: null, msg: 'Network Error', status: 'error' });
    return { data: null, msg: 'Network Error', status: 'error' };
  }
};

export const GET = async (
  route,
  onSuccess = () => { },
  onError = () => { },
  headers = {},
  onFail = () => {
    SimpleToast.show('Check Network, Try Again.', SimpleToast.SHORT);
  },
) => {
  try {
    axios({
      method: 'get',
      url: `${API}${route}`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...errorHandling,
    })
      .then(res => {
        if (res?.status == 200) {
          onSuccess(res?.data);
        } else {
          if (res.status in statusMessage) {
            onError({
              data: null,
              message: statusMessage[res.status],
              status: false,
            });
          }
          onError(res);
        }
      })
      .catch(err => {
        onError(err);
      });
  } catch (error) {
    onFail({ data: null, msg: 'Network Error', status: 'error' });
    return { data: null, msg: 'Network Error', status: 'error' };
  }
};

export const POST_WITH_TOKEN = async (
  route,
  body = {},
  onSuccess = () => { },
  onError = () => { },
  onFail = () => {
    SimpleToast.show('Check Network, Try Again.', SimpleToast.SHORT);
  },
) => {
  try {
    await axios({
      method: 'post',
      url: `${API}${route}`,
      data: body,
      headers: {
        Authorization: `Bearer ${store.getState().Token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...errorHandling,
    })
      .then(res => {
        if (res?.status == 200 || res?.status == 201) {
          onSuccess(res?.data);
        } else {
          if (res?.status == 401) {
            // updateUnAuthorizedError();
          }
          onError(res);
        }
      })
      .catch(err => {
        console.error(err);
        onError(err);
      });
  } catch (error) {
    onFail({ data: null, msg: 'Network Error', status: 'error' });
    return { data: null, msg: 'Network Error', status: 'error' };
  }
};

export const GET_WITH_TOKEN = async (
  route,
  onSuccess = () => { },
  onError = () => { },
  onFail = () => {
    SimpleToast.show('Check Network, Try Again.', SimpleToast.SHORT);
  },
  headers = {},
  status = () => { },
) => {
  console.log('USER TOKEN', store.getState().Token);
  try {
    await axios({
      method: 'get',
      url: `${API}${route}`,
      headers: {
        authorization: `Bearer ${store.getState().Token}`,
        // 'Accept-Language': localization.getLanguage(),
        ...headers,
      },
      ...errorHandling,
    })
      .then(res => {
        if (res?.status == 200) {
          onSuccess(res?.data);
          return res?.data;
        } else {
          if (res?.status == 401) {
            // updateUnAuthorizedError();
          }
          if (statusMessage[res?.status]) {
            // SimpleToast(`${statusMessage[res?.status]}`, 'danger');
          }
          onError(res);
          return res;
        }
      })
      .catch(err => {
        onError(err);
        return err;
      });
    return;
  } catch (error) {
    console.log(error);
    onFail({ data: null, msg: 'Network Error', status: 'error', error });
    return { data: null, msg: 'Network Error', status: 'error' };
  }
};

export const DELETE_WITH_TOKEN = async (
  route,
  body = {},
  onSuccess = () => { },
  onError = () => { },
  onFail = () => {
    SimpleToast.show('Check Network, Try Again.', SimpleToast.SHORT);
  },
  headers = {},
) => {
  try {
    axios({
      method: 'delete',
      url: `${API}${route}`,
      data: body,
      headers: {
        authorization: `Bearer ${store.getState().Token}`,
        // 'Accept-Language': localization.getLanguage(),
        ...headers,
      },
      ...errorHandling,
    })
      .then(res => {
        if (res?.status == 200) {
          onSuccess(res?.data);
        } else {
          if (res?.status == 401) {
            // updateUnAuthorizedError();
          }
          onError(res);
        }
      })
      .catch(err => {
        onError(err);
      });
  } catch (error) {
    onFail({ data: null, msg: 'Network Error', status: 'error', error });
    return { data: null, msg: 'Network Error', status: 'error' };
  }
};

export const PUT_FORM_DATA = async (
  route,
  body,
  onSuccess = () => { },
  onError = () => { },
  onFail = () => {
    SimpleToast.show('Check Network, Try Again.', SimpleToast.SHORT);
  },
) => {
  try {
    axios({
      method: 'put',
      url: `${API}${route}`,
      data: body,
      headers: {
        'Content-Type': 'multipart/form-data',
        authorization: `Bearer ${store.getState().Token}`,
        // 'Accept-Language': localization.getLanguage()
      },
      ...errorHandling,
    })
      .then(res => {
        if (res?.status == 200 || res?.status == 201) {
          onSuccess(res?.data);
        } else {
          if (res?.status == 401) {
            // updateUnAuthorizedError();
          }
          onError(res);
        }
      })
      .catch(err => {
        console.error('PUT_FORM_DATA Error:', err);
        onError(err);
      });
  } catch (error) {
    onFail({ data: null, msg: 'Network Error', status: 'error' });
    return { data: null, msg: 'Network Error', status: 'error' };
  }
};

export const PUT_WITH_TOKEN = async (
  route,
  body = {},
  onSuccess = () => { },
  onError = () => { },
  onFail = () => {
    SimpleToast.show('Check Network, Try Again.', SimpleToast.SHORT);
  },
) => {
  try {
    axios({
      method: 'put',
      url: `${API}${route}`,
      data: body,
      headers: {
        Authorization: `Bearer ${store.getState().Token}`,
        'Content-Type': 'application/json',
        // 'Accept-Language': localization.getLanguage()
      },
      ...errorHandling,
    })
      .then(res => {
        if (res?.status == 200) {
          onSuccess(res?.data);
        } else {
          if (res?.status == 401) {
            // updateUnAuthorizedError();
          }
          onError(res);
        }
      })
      .catch(err => {
        console.error(err);
        onError(err);
      });
  } catch (error) {
    onFail({ data: null, msg: 'Network Error', status: 'error' });
    return { data: null, msg: 'Network Error', status: 'error' };
  }
};

export function onErrorFound(res, onError) {
  const errorResponse = responseBack(null, statusMessage[res.status], 'error');
  onError(errorResponse);
  return errorResponse;
}
