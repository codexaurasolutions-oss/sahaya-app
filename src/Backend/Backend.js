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

const _postJsonRequest = async (route, body, authenticated) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const token = authenticated ? store.getState().Token : null;
    const response = await fetch(`${API}${route}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
      },
      body: JSON.stringify(body || {}),
      signal: controller.signal,
    });
    const responseText = await response.text();
    let data = null;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        data = {message: responseText};
      }
    }

    return {ok: response.ok, data, status: response.status};
  } finally {
    clearTimeout(timeoutId);
  }
};

const _runJsonPost = async (
  route,
  body,
  authenticated,
  onSuccess,
  onError,
  onFail,
) => {
  let result;
  try {
    result = await _postJsonRequest(route, body, authenticated);
  } catch (error) {
    const isTimeout = error?.name === 'AbortError';
    onFail({
      data: null,
      msg: isTimeout
        ? 'Server is taking too long. Please try again.'
        : 'Could not connect to the server. Please try again.',
      message: error?.message,
      status: isTimeout ? 'timeout' : 'connection',
    });
    return;
  }

  if (result.ok) {
    onSuccess(result.data);
    return;
  }

  onError(
    _normalizeErrorResponse(
      result.data,
      `Server returned error ${result.status}. Please try again.`,
    ),
  );
};

export const POST_JSON = async (
  route,
  body = {},
  onSuccess = () => {},
  onError = () => {},
  onFail = () => {},
) => _runJsonPost(route, body, false, onSuccess, onError, onFail);

export const POST_JSON_WITH_TOKEN = async (
  route,
  body = {},
  onSuccess = () => {},
  onError = () => {},
  onFail = () => {},
) => _runJsonPost(route, body, true, onSuccess, onError, onFail);

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

const _fetchWithTimeout = async ({
  route,
  method,
  headers,
  body,
  timeout = 30000,
}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API}${route}`, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    const responseText = await response.text();
    let data = null;

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        data = {message: responseText};
      }
    }

    return {ok: response.ok, status: response.status, data};
  } finally {
    clearTimeout(timeoutId);
  }
};

const _reportFetchFailure = (error, onFail, label) => {
  console.error(`${label}:`, error?.name, error?.message);
  if (error?.name === 'AbortError') {
    onFail({
      data: null,
      msg: 'Server is taking too long. Please try again.',
      status: 'timeout',
    });
    return;
  }

  onFail(error);
};

const _reportAxiosFailure = (error, onError, onFail, label) => {
  console.error(`${label}:`, error?.code, error?.message);
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    onFail({
      data: null,
      msg: 'Server is taking too long. Please try again.',
      status: 'timeout',
    });
  } else if (
    error?.code === 'NETWORK_ERROR' ||
    error?.code === 'ERR_NETWORK' ||
    error?.message === 'Network Error' ||
    !error?.response
  ) {
    onFail(error);
  } else {
    onError(_normalizeErrorResponse(error?.response?.data || error));
  }
};

export const POST_FORM_DATA = async (
  route,
  body,
  onSuccess = () => { },
  onError = () => { },
  onFail = () => {
    SimpleToast.show('Check Network, Try Again.', SimpleToast.SHORT);
  },
  options = {},
) => {
  const token = store.getState().Token;
  const isPlainObject =
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !Array.isArray(body);

  const sendAsJson =
    (body instanceof FormData && !_hasFileUpload(body)) || isPlainObject;
  const requestBody = sendAsJson
    ? JSON.stringify(isPlainObject ? body : _formDataToJsonObject(body))
    : body;
  let result;

  try {
    result = await _fetchWithTimeout({
      route,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...(sendAsJson ? {'Content-Type': 'application/json'} : {}),
      },
      body: requestBody,
      timeout: options.timeout || 30000,
    });
  } catch (err) {
    _reportFetchFailure(err, onFail, 'POST_FORM_DATA request failed');
    return;
  }

  if (result.ok) {
    onSuccess(result.data);
  } else {
    onError(
      _normalizeErrorResponse(
        result.data,
        `Server returned error ${result.status}. Please try again.`,
      ),
    );
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
  let response;
  try {
    const isFormData = body instanceof FormData;
    const headers = {
      Accept: 'application/json',
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    response = await axios({
      method: 'post',
      url: `${API}${route}`,
      data: isFormData ? body : JSON.stringify(body),
      timeout: 30000,
      headers,
      validateStatus: function (status) {
        return status >= 200 && status <= 503;
      },
    });
  } catch (error) {
    _reportAxiosFailure(error, onError, onFail, 'POST request failed');
    return;
  }

  if (response?.status === 200 || response?.status === 201) {
    if (response?.data !== undefined && response?.data !== null) {
      onSuccess(response.data);
    } else {
      onError(_normalizeErrorResponse(response?.data));
    }
  } else {
    onError(
      _normalizeErrorResponse(
        response?.data,
        `Server returned error ${response?.status}. Please try again.`,
      ),
    );
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
  let response;
  try {
    response = await axios({
      method: 'get',
      url: `${API}${route}`,
      timeout: 30000,
      headers: {
        Accept: 'application/json',
      },
      ...errorHandling,
    });
  } catch (error) {
    _reportAxiosFailure(error, onError, onFail, 'GET request failed');
    return;
  }

  if (response?.status === 200) {
    onSuccess(response.data);
  } else if (response?.status in statusMessage) {
    onError({
      data: null,
      message: statusMessage[response.status],
      status: false,
    });
  } else {
    onError(_normalizeErrorResponse(response?.data || response));
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
  let response;
  try {
    response = await axios({
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
    });
  } catch (error) {
    _reportAxiosFailure(error, onError, onFail, 'POST_WITH_TOKEN request failed');
    return;
  }

  if (response?.status === 200 || response?.status === 201) {
    onSuccess(response.data);
  } else {
    if (response?.status === 401) {
      SimpleToast.show('Session expired. Please log in again.', SimpleToast.LONG);
    }
    onError(_normalizeErrorResponse(response?.data || response));
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
  let response;
  try {
    response = await axios({
      method: 'get',
      url: `${API}${route}`,
      timeout: 30000,
      headers: {
        authorization: `Bearer ${store.getState().Token}`,
        ...headers,
      },
      ...errorHandling,
    });
  } catch (error) {
    _reportAxiosFailure(error, onError, onFail, 'GET_WITH_TOKEN request failed');
    return;
  }

  if (response?.status === 200) {
    onSuccess(response.data);
    return response.data;
  }

  onError(_normalizeErrorResponse(response?.data || response));
  return response;
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
  let response;
  try {
    response = await axios({
      method: 'delete',
      url: `${API}${route}`,
      data: body,
      timeout: 30000,
      headers: {
        authorization: `Bearer ${store.getState().Token}`,
        ...headers,
      },
      ...errorHandling,
    });
  } catch (error) {
    _reportAxiosFailure(error, onError, onFail, 'DELETE_WITH_TOKEN request failed');
    return;
  }

  if (response?.status === 200 || response?.status === 204) {
    onSuccess(response.data);
  } else {
    if (response?.status === 401) {
      SimpleToast.show('Session expired. Please log in again.', SimpleToast.LONG);
    }
    onError(_normalizeErrorResponse(response?.data || response));
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
  const isPlainObject =
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !Array.isArray(body);
  const sendAsJson =
    (body instanceof FormData && !_hasFileUpload(body)) || isPlainObject;
  const requestBody = sendAsJson
    ? JSON.stringify(isPlainObject ? body : _formDataToJsonObject(body))
    : body;
  let result;

  try {
    result = await _fetchWithTimeout({
      route,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...(sendAsJson ? {'Content-Type': 'application/json'} : {}),
      },
      body: requestBody,
    });
  } catch (err) {
    _reportFetchFailure(err, onFail, 'PUT_FORM_DATA request failed');
    return;
  }

  if (result.ok) {
    onSuccess(result.data);
  } else {
    onError(
      _normalizeErrorResponse(
        result.data,
        `Server returned error ${result.status}. Please try again.`,
      ),
    );
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
  let response;
  try {
    response = await axios({
      method: 'put',
      url: `${API}${route}`,
      data: body,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${store.getState().Token}`,
        'Content-Type': 'application/json',
      },
      ...errorHandling,
    });
  } catch (error) {
    _reportAxiosFailure(error, onError, onFail, 'PUT_WITH_TOKEN request failed');
    return;
  }

  if (response?.status === 200) {
    onSuccess(response.data);
  } else {
    if (response?.status === 401) {
      SimpleToast.show('Session expired. Please log in again.', SimpleToast.LONG);
    }
    onError(_normalizeErrorResponse(response?.data || response));
  }
};

export function onErrorFound(res, onError) {
  const errorResponse = responseBack(null, statusMessage[res.status], 'error');
  onError(errorResponse);
  return errorResponse;
}
