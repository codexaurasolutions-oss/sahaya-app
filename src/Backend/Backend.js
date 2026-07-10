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
export const getToken = () => store.getState().Token;
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

const _normalizeErrorResponse = (payload, fallbackMessage = 'Server error. Please try again.') => {
  if (payload && typeof payload === 'object') {
    return {
      ...payload,
      data: payload.data !== undefined ? payload.data : payload,
      message: payload.message || payload.error || fallbackMessage,
      error: payload.error,
      errors: payload.errors,
    };
  }

  return {
    data: payload ?? null,
    message: fallbackMessage,
    error: payload ?? fallbackMessage,
  };
};

const _hasFileUpload = (body) => {
  if (!body || !(body instanceof FormData)) return false;
  try {
    const parts = body._parts || [];
    return parts.some(([, value]) => value && typeof value === 'object' && value.uri);
  } catch (e) {
    return false;
  }
};

const _formDataToJsonObject = (body) => {
  const obj = {};
  try {
    const parts = body._parts || [];
    for (const [key, value] of parts) {
      if (value && typeof value === 'object' && value.uri) continue;
      if (obj[key] !== undefined) {
        if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
        obj[key].push(value);
      } else {
        obj[key] = value;
      }
    }
  } catch (e) {}
  return obj;
};

export const POST_FORM_DATA = async (
  route,
  body,
  onSuccess = () => { },
  onError = () => { },
  onFail = () => {
    SimpleToast.show('Check Network, Try Again.', SimpleToast.SHORT);
  },
) => {
  const token = store.getState().Token;
  const isPlainObject =
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !Array.isArray(body);

  if ((body instanceof FormData && !_hasFileUpload(body)) || isPlainObject) {
    const jsonData = isPlainObject ? body : _formDataToJsonObject(body);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${API}${route}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(jsonData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => null);
      if (response.ok) {
        onSuccess(data);
      } else {
        onError(_normalizeErrorResponse(data, 'Server error. Please try again.'));
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('POST_FORM_DATA JSON Error:', err?.name, err?.message);
      if (err?.name === 'AbortError') {
        onFail({ data: null, msg: 'Server is taking too long. Please try again.', status: 'timeout' });
      } else {
        onFail(err);
      }
    }
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API}${route}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json().catch(() => null);
    if (response.ok) {
      onSuccess(data);
    } else {
      onError(_normalizeErrorResponse(data, 'Server error. Please try again.'));
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('POST_FORM_DATA Fetch Error:', err?.name, err?.message);
    if (err?.name === 'AbortError') {
      onFail({ data: null, msg: 'Server is taking too long. Please try again.', status: 'timeout' });
    } else {
      onFail(err);
    }
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
    const isFormData = body instanceof FormData;
    const headers = {
      Accept: 'application/json',
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    await axios({
      method: 'post',
      url: `${API}${route}`,
      data: isFormData ? body : JSON.stringify(body),
      timeout: 30000,
      headers,
      validateStatus: function (status) {
        return status >= 200 && status <= 503;
      },
    })
      .then(res => {
        if (res?.status == 200 || res?.status == 201) {
          if (!!res?.data) {
            onSuccess(res?.data);
          } else {
            console.log('POST Error - no data in response');
            onError(_normalizeErrorResponse(res?.data));
          }
        } else {
          console.log('POST Error - status:', res?.status, res?.data);
          onError(_normalizeErrorResponse(res?.data, 'Server error. Please try again.'));
        }
      })
      .catch(err => {
        console.error('POST Catch:', err?.code, err?.message);
        if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
          onFail({ data: null, msg: 'Server is taking too long. Please try again.', status: 'timeout' });
        } else if (err?.code === 'NETWORK_ERROR' || err?.message === 'Network Error' || !err?.response) {
          onFail(err);
        } else {
          onError(_normalizeErrorResponse(err?.response?.data || err));
        }
      });
  } catch (error) {
    console.error('POST Try-Catch:', error);
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
    await axios({
      method: 'get',
      url: `${API}${route}`,
      timeout: 30000,
      headers: {
        Accept: 'application/json',
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
          } else {
            onError(_normalizeErrorResponse(res));
          }
        }
      })
      .catch(err => {
        console.error('GET Catch:', err?.code, err?.message);
        if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
          onFail({ data: null, msg: 'Server is taking too long. Please try again.', status: 'timeout' });
        } else if (err?.code === 'NETWORK_ERROR' || err?.message === 'Network Error' || !err?.response) {
          onFail(err);
        } else {
          onError(err?.response?.data || err);
        }
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
      timeout: 30000,
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
            SimpleToast.show('Session expired. Please log in again.', SimpleToast.LONG);
          }
          onError(_normalizeErrorResponse(res));
        }
      })
      .catch(err => {
        console.error('POST_WITH_TOKEN Catch:', err?.code, err?.message);
        if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
          onFail({ data: null, msg: 'Server is taking too long. Please try again.', status: 'timeout' });
        } else if (err?.code === 'NETWORK_ERROR' || err?.message === 'Network Error' || !err?.response) {
          onFail(err);
        } else {
          onError(_normalizeErrorResponse(err?.response?.data || err));
        }
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
      timeout: 30000,
      headers: {
        authorization: `Bearer ${store.getState().Token}`,
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
          }
          onError(_normalizeErrorResponse(res));
          return res;
        }
      })
      .catch(err => {
        console.error('GET_WITH_TOKEN Catch:', err?.code, err?.message);
        if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
          onFail({ data: null, msg: 'Server is taking too long. Please try again.', status: 'timeout' });
        } else if (err?.code === 'NETWORK_ERROR' || err?.message === 'Network Error' || !err?.response) {
          onFail(err);
        } else {
          onError(_normalizeErrorResponse(err?.response?.data || err));
        }
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
    await axios({
      method: 'delete',
      url: `${API}${route}`,
      data: body,
      timeout: 30000,
      headers: {
        authorization: `Bearer ${store.getState().Token}`,
        ...headers,
      },
      ...errorHandling,
    })
      .then(res => {
        if (res?.status == 200) {
          onSuccess(res?.data);
        } else {
          if (res?.status == 401) {
            SimpleToast.show('Session expired. Please log in again.', SimpleToast.LONG);
          }
          onError(_normalizeErrorResponse(res));
        }
      })
      .catch(err => {
        console.error('DELETE_WITH_TOKEN Catch:', err?.code, err?.message);
        if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
          onFail({ data: null, msg: 'Server is taking too long. Please try again.', status: 'timeout' });
        } else if (err?.code === 'NETWORK_ERROR' || err?.message === 'Network Error' || !err?.response) {
          onFail(err);
        } else {
          onError(_normalizeErrorResponse(err?.response?.data || err));
        }
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
  const token = store.getState().Token;

  if (body instanceof FormData && !_hasFileUpload(body)) {
    const jsonData = _formDataToJsonObject(body);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${API}${route}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(jsonData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => null);
      if (response.ok) {
        onSuccess(data);
      } else {
        onError(_normalizeErrorResponse(data, 'Server error. Please try again.'));
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('PUT_FORM_DATA JSON Error:', err?.name, err?.message);
      if (err?.name === 'AbortError') {
        onFail({ data: null, msg: 'Server is taking too long. Please try again.', status: 'timeout' });
      } else {
        onFail(err);
      }
    }
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API}${route}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: body,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json().catch(() => null);
    if (response.ok) {
      onSuccess(data);
    } else {
      onError(_normalizeErrorResponse(data, 'Server error. Please try again.'));
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('PUT_FORM_DATA Fetch Error:', err?.name, err?.message);
    if (err?.name === 'AbortError') {
      onFail({ data: null, msg: 'Server is taking too long. Please try again.', status: 'timeout' });
    } else {
      onFail(err);
    }
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
    await axios({
      method: 'put',
      url: `${API}${route}`,
      data: body,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${store.getState().Token}`,
        'Content-Type': 'application/json',
      },
      ...errorHandling,
    })
      .then(res => {
        if (res?.status == 200) {
          onSuccess(res?.data);
        } else {
          if (res?.status == 401) {
            SimpleToast.show('Session expired. Please log in again.', SimpleToast.LONG);
          }
          onError(_normalizeErrorResponse(res));
        }
      })
      .catch(err => {
        console.error('PUT_WITH_TOKEN Catch:', err?.code, err?.message);
        if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
          onFail({ data: null, msg: 'Server is taking too long. Please try again.', status: 'timeout' });
        } else if (err?.code === 'NETWORK_ERROR' || err?.message === 'Network Error' || !err?.response) {
          onFail(err);
        } else {
          onError(_normalizeErrorResponse(err?.response?.data || err));
        }
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
